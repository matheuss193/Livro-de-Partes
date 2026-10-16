/** Implementação local (IndexedDB via Dexie): fase 1, dados só no aparelho. */
import Dexie, { type Table } from 'dexie'
import { gerarTextoOficial } from '../domain/textos'
import { hashDoConteudo } from '../domain/hash'
import { historicoDemo, unidadeExemplo, andrade } from '../domain/exemplo'
import { ehOficial, tratamento } from '../domain/formatacao'
import type { Militar, Parte, Unidade } from '../domain/tipos'
import type {
  AnexoMeta, Equipamento, ItemDocumentoPadrao, Natureza, NovaRetificacao, ParteGuardada, RegistroAuditoria, Repositorio, Viatura, Visto,
} from './repositorio'
import { TAMANHO_MAXIMO_ANEXO, TIPOS_ANEXO } from './repositorio'
import { documentosPadraoSeed, equipamentosSeed, militaresSeed, naturezasSeed, viaturasSeed } from './seed'

class BancoLocal extends Dexie {
  config!: Table<{ id: string; unidade: Unidade }, string>
  militares!: Table<Militar, string>
  viaturas!: Table<Viatura, string>
  equipamentos!: Table<Equipamento, string>
  documentos!: Table<ItemDocumentoPadrao, string>
  naturezas!: Table<Natureza, string>
  partes!: Table<ParteGuardada, string>
  auditoria!: Table<RegistroAuditoria, number>
  anexos!: Table<AnexoMeta & { blob: Blob }, string>

  constructor(nome: string) {
    super(nome)
    this.version(1).stores({
      config: 'id',
      militares: 'id',
      viaturas: 'id',
      equipamentos: 'id',
      documentos: 'id',
      naturezas: 'id',
      partes: 'id, [ano+numero], status',
      auditoria: '++id, parteId',
    })
    this.version(2).stores({ anexos: 'id, parteId' })
  }
}

const agora = () => new Date().toISOString()
const anoDe = (dataServico: string) => Number(dataServico.slice(0, 4))

export class LocalRepo implements Repositorio {
  private db: BancoLocal
  private pronto: Promise<void>

  constructor(nomeBanco = 'livro-de-partes') {
    this.db = new BancoLocal(nomeBanco)
    this.pronto = this.semear()
  }

  /** Na primeira execução, carrega os dados fictícios de demonstração. */
  private async semear(): Promise<void> {
    if ((await this.db.config.count()) > 0) return
    await this.db.transaction('rw', [this.db.config, this.db.militares, this.db.viaturas, this.db.equipamentos, this.db.documentos, this.db.naturezas], async () => {
      await this.db.config.put({ id: 'unidade', unidade: unidadeExemplo })
      await this.db.militares.bulkPut(militaresSeed)
      await this.db.viaturas.bulkPut(viaturasSeed)
      await this.db.equipamentos.bulkPut(equipamentosSeed)
      await this.db.documentos.bulkPut(documentosPadraoSeed)
      await this.db.naturezas.bulkPut(naturezasSeed)
    })
    await this.semearHistorico()
  }

  /** Demonstração: duas Partes encerradas (nº 199 vistada e nº 200 aguardando visto) para a nova nascer encadeada. */
  private async semearHistorico(): Promise<void> {
    const unidade = unidadeExemplo
    const [p199, p200] = historicoDemo()
    for (const [parte, encerradaEm] of [[p199, '2026-10-13T10:55:00Z'], [p200, '2026-10-14T10:58:00Z']] as const) {
      const { textoFinal, hash } = await this.congelar(parte, unidade, encerradaEm)
      const g: ParteGuardada = {
        // Id fixo: se duas instâncias semearem ao mesmo tempo (ex.: React StrictMode), o registro é o mesmo.
        id: `demo-${parte.numero}`, numero: parte.numero, ano: anoDe(parte.dataServico), dataServico: parte.dataServico,
        status: parte === p199 ? 'vistada' : 'encerrada', parte, atualizadaEm: encerradaEm, textoFinal, hash, encerradaEm, retificacoes: [],
      }
      if (parte === p199) {
        const base = {
          oficialId: andrade.id, oficial: tratamento(andrade), assinaturaNome: nomeParaAssinatura(andrade),
          funcao: unidade.destinatario.funcao, em: '2026-10-13T14:20:00Z', despacho: 'Ciente. Sem alterações.', alineas: { a: { ciente: true } },
        }
        g.visto = { ...base, hash: await hashDoConteudo({ ...base, parteHash: hash }) }
      }
      await this.db.partes.put(g)
    }
  }

  /** Apaga os dados do aparelho e recarrega a demonstração do zero (só existe no LocalRepo). */
  async reiniciarDemonstracao(): Promise<void> {
    await this.pronto
    await this.db.transaction('rw', this.db.tables, async () => {
      for (const t of this.db.tables) await t.clear()
    })
    await this.semear()
  }

  /** Gera o texto final e o hash que congelam a Parte. */
  private async congelar(parte: Parte, unidade: Unidade, em: string, anexos: AnexoMeta[] = []): Promise<{ textoFinal: string; hash: string }> {
    const textoFinal = gerarTextoOficial(parte, unidade, { assinatura: `assinado eletronicamente em ${formatarDataHora(em)}` })
    // Os anexos entram no hash: trocar ou remover um arquivo depois mudaria o código de verificação.
    const hash = await hashDoConteudo({ parte, textoFinal, ...(anexos.length ? { anexos: anexos.map((a) => ({ nome: a.nome, sha256: a.sha256 })) } : {}) })
    return { textoFinal, hash }
  }

  private async registrar(r: Omit<RegistroAuditoria, 'em'>): Promise<void> {
    await this.db.auditoria.add({ ...r, em: agora() })
  }

  async obterUnidade(): Promise<Unidade> {
    await this.pronto
    return (await this.db.config.get('unidade'))!.unidade
  }
  async salvarUnidade(u: Unidade): Promise<void> {
    await this.pronto
    await this.db.config.put({ id: 'unidade', unidade: u })
  }

  async listarMilitares(): Promise<Militar[]> { await this.pronto; return this.db.militares.toArray() }
  async salvarMilitar(m: Militar): Promise<void> { await this.pronto; await this.db.militares.put(m) }

  async listarViaturas(): Promise<Viatura[]> {
    await this.pronto
    return (await this.db.viaturas.toArray()).sort((a, b) => a.ordem - b.ordem)
  }
  async salvarViatura(v: Viatura): Promise<void> { await this.pronto; await this.db.viaturas.put(v) }

  async listarEquipamentos(): Promise<Equipamento[]> {
    await this.pronto
    return (await this.db.equipamentos.toArray()).sort((a, b) => a.ordem - b.ordem)
  }
  async salvarEquipamento(e: Equipamento): Promise<void> { await this.pronto; await this.db.equipamentos.put(e) }
  /** Remover da lista padrão não altera Partes já guardadas (elas têm cópia própria dos itens). */
  async removerEquipamento(id: string): Promise<void> { await this.pronto; await this.db.equipamentos.delete(id) }
  async listarDocumentosPadrao(): Promise<ItemDocumentoPadrao[]> { await this.pronto; return this.db.documentos.toArray() }
  async salvarDocumentoPadrao(d: ItemDocumentoPadrao): Promise<void> { await this.pronto; await this.db.documentos.put(d) }
  async removerDocumentoPadrao(id: string): Promise<void> { await this.pronto; await this.db.documentos.delete(id) }
  async listarNaturezas(): Promise<Natureza[]> { await this.pronto; return this.db.naturezas.toArray() }

  async listarPartes(): Promise<ParteGuardada[]> {
    await this.pronto
    return (await this.db.partes.toArray()).sort((a, b) => b.dataServico.localeCompare(a.dataServico) || b.numero - a.numero)
  }
  async obterParte(id: string): Promise<ParteGuardada | undefined> { await this.pronto; return this.db.partes.get(id) }

  async ultimaEncerrada(): Promise<ParteGuardada | undefined> {
    const todas = await this.listarPartes()
    return todas.find((p) => p.status !== 'rascunho')
  }

  async salvarRascunho(parte: Parte, id?: string): Promise<ParteGuardada> {
    await this.pronto
    const ano = anoDe(parte.dataServico)
    return this.db.transaction('rw', [this.db.partes, this.db.auditoria], async () => {
      const existente = id ? await this.db.partes.get(id) : undefined
      if (existente && existente.status !== 'rascunho') {
        throw new Error('Parte encerrada não pode ser alterada. Use retificação.')
      }
      const mesmoNumero = await this.db.partes.where('[ano+numero]').equals([ano, parte.numero]).toArray()
      if (mesmoNumero.some((p) => p.id !== id)) {
        throw new Error(`Já existe a Parte nº ${parte.numero} em ${ano} nesta unidade.`)
      }
      const nova: ParteGuardada = {
        id: id ?? crypto.randomUUID(),
        numero: parte.numero,
        ano,
        dataServico: parte.dataServico,
        status: 'rascunho',
        parte,
        atualizadaEm: agora(),
        retificacoes: [],
      }
      await this.db.partes.put(nova)
      if (!existente) await this.registrar({ acao: 'criou-rascunho', parteId: nova.id, usuario: parte.autor.nomeGuerra })
      return nova
    })
  }

  async encerrar(id: string, usuario: string): Promise<ParteGuardada> {
    await this.pronto
    const unidade = await this.obterUnidade()
    const atual = await this.db.partes.get(id)
    if (!atual) throw new Error('Parte não encontrada.')
    if (atual.status !== 'rascunho') throw new Error('Esta Parte já foi encerrada.')
    const em = agora()
    const anexos = await this.listarAnexos(id)
    const { textoFinal, hash } = await this.congelar(atual.parte, unidade, em, anexos)
    const encerrada: ParteGuardada = { ...atual, status: 'encerrada', textoFinal, hash, encerradaEm: em, atualizadaEm: em }
    await this.db.partes.put(encerrada)
    await this.registrar({ acao: 'encerrou', parteId: id, usuario, detalhes: `hash ${hash}` })
    return encerrada
  }

  async adicionarRetificacao(id: string, r: NovaRetificacao): Promise<ParteGuardada> {
    await this.pronto
    const atual = await this.db.partes.get(id)
    if (!atual) throw new Error('Parte não encontrada.')
    if (atual.status === 'rascunho') throw new Error('Só se retifica Parte encerrada; edite o rascunho.')
    const em = agora()
    const numero = atual.retificacoes.length + 1
    const hash = await hashDoConteudo({ ...r, numero, em, parteHash: atual.hash })
    // O conteúdo original (parte, textoFinal, hash) permanece intacto; só se acrescenta ao final.
    const atualizada: ParteGuardada = { ...atual, retificacoes: [...atual.retificacoes, { ...r, numero, em, hash }] }
    await this.db.partes.put(atualizada)
    await this.registrar({ acao: `registrou-${r.tipo}`, parteId: id, usuario: r.autor, detalhes: `nº ${numero}, item ${r.item}` })
    return atualizada
  }

  async vistar(id: string, oficial: Militar, dados: { despacho?: string; alineas: Visto['alineas'] }): Promise<ParteGuardada> {
    await this.pronto
    if (!ehOficial(oficial)) throw new Error('Só oficial pode dar o visto.')
    const atual = await this.db.partes.get(id)
    if (!atual) throw new Error('Parte não encontrada.')
    if (atual.status === 'rascunho') throw new Error('A Parte ainda não foi encerrada.')
    if (atual.status === 'vistada') throw new Error('Esta Parte já foi vistada.')
    const em = agora()
    // O visto é anexado; textoFinal, hash e conteúdo original permanecem intactos.
    const unidade = await this.obterUnidade()
    const base = {
      oficialId: oficial.id, oficial: tratamento(oficial), assinaturaNome: nomeParaAssinatura(oficial),
      funcao: unidade.destinatario.funcao, em, despacho: dados.despacho?.trim() || undefined, alineas: dados.alineas,
    }
    const hash = await hashDoConteudo({ ...base, parteHash: atual.hash })
    const vistada: ParteGuardada = { ...atual, status: 'vistada', visto: { ...base, hash } }
    await this.db.partes.put(vistada)
    await this.registrar({ acao: 'vistou', parteId: id, usuario: oficial.nomeGuerra })
    return vistada
  }

  async solicitarRetificacao(id: string, oficial: Militar, motivo: string): Promise<ParteGuardada> {
    await this.pronto
    if (!ehOficial(oficial)) throw new Error('Só oficial pode solicitar retificação.')
    const atual = await this.db.partes.get(id)
    if (!atual) throw new Error('Parte não encontrada.')
    if (atual.status === 'rascunho') throw new Error('A Parte ainda não foi encerrada.')
    const solicitacoes = atual.solicitacoes ?? []
    const nova = { ...atual, solicitacoes: [...solicitacoes, { numero: solicitacoes.length + 1, em: agora(), oficial: tratamento(oficial), motivo: motivo.trim() }] }
    await this.db.partes.put(nova)
    await this.registrar({ acao: 'solicitou-retificacao', parteId: id, usuario: oficial.nomeGuerra, detalhes: motivo.trim() })
    return nova
  }

  async adicionarAnexo(parteId: string, arquivo: File, rotulo?: string): Promise<AnexoMeta> {
    await this.pronto
    const parte = await this.db.partes.get(parteId)
    if (!parte) throw new Error('Parte não encontrada.')
    if (parte.status !== 'rascunho') throw new Error('Parte encerrada não aceita novos anexos.')
    if (!TIPOS_ANEXO.includes(arquivo.type)) throw new Error('Anexe um PDF ou uma foto (JPG, PNG ou WEBP).')
    if (arquivo.size > TAMANHO_MAXIMO_ANEXO) throw new Error('O arquivo passa de 10 MB.')
    const sha256 = await sha256Arquivo(arquivo)
    const meta: AnexoMeta = { id: crypto.randomUUID(), parteId, nome: arquivo.name, tipo: arquivo.type, tamanho: arquivo.size, sha256, rotulo: rotulo?.trim() || undefined, em: agora() }
    await this.db.anexos.put({ ...meta, blob: arquivo })
    await this.registrar({ acao: 'anexou', parteId, usuario: parte.parte.autor.nomeGuerra, detalhes: `${meta.nome} (${sha256.slice(0, 8)})` })
    return meta
  }

  async listarAnexos(parteId: string): Promise<AnexoMeta[]> {
    await this.pronto
    const todos = await this.db.anexos.where('parteId').equals(parteId).toArray()
    return todos.map(({ blob: _blob, ...meta }) => meta).sort((a, b) => a.em.localeCompare(b.em))
  }

  async obterAnexo(id: string): Promise<{ meta: AnexoMeta; blob: Blob } | undefined> {
    await this.pronto
    const a = await this.db.anexos.get(id)
    if (!a) return undefined
    const { blob, ...meta } = a
    return { meta, blob }
  }

  async removerAnexo(id: string): Promise<void> {
    await this.pronto
    const a = await this.db.anexos.get(id)
    if (!a) return
    const parte = await this.db.partes.get(a.parteId)
    if (parte && parte.status !== 'rascunho') throw new Error('Parte encerrada não aceita remover anexos.')
    await this.db.anexos.delete(id)
    await this.registrar({ acao: 'removeu-anexo', parteId: a.parteId, usuario: parte?.parte.autor.nomeGuerra ?? '', detalhes: a.nome })
  }

  async listarAuditoria(parteId?: string): Promise<RegistroAuditoria[]> {
    await this.pronto
    const tudo = parteId ? await this.db.auditoria.where('parteId').equals(parteId).toArray() : await this.db.auditoria.toArray()
    return tudo.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  }
}

async function sha256Arquivo(arquivo: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await arquivo.arrayBuffer())
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** "Nome Completo – 1º TEN QOBM", como no bloco de assinatura. */
export function nomeParaAssinatura(m: Militar): string {
  return `${m.nomeCompleto} – ${[m.postoGrad, m.quadro].filter(Boolean).join(' ')}`
}

/** ISO (UTC) -> "15/10/2026 07:58" no fuso de Belém (UTC-3, sem horário de verão). */
export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Belem', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso)).replace(',', '')
}
