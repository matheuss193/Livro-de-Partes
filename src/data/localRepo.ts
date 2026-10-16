/** Implementação local (IndexedDB via Dexie): fase 1, dados só no aparelho. */
import Dexie, { type Table } from 'dexie'
import { gerarTextoOficial } from '../domain/textos'
import { hashDoConteudo } from '../domain/hash'
import { unidadeExemplo } from '../domain/exemplo'
import type { Militar, Parte, Unidade } from '../domain/tipos'
import type {
  Equipamento, ItemDocumentoPadrao, Natureza, NovaRetificacao, ParteGuardada, RegistroAuditoria, Repositorio, Viatura,
} from './repositorio'
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
  async listarDocumentosPadrao(): Promise<ItemDocumentoPadrao[]> { await this.pronto; return this.db.documentos.toArray() }
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
    const textoFinal = gerarTextoOficial(atual.parte, unidade, {
      assinatura: `assinado eletronicamente em ${formatarDataHora(em)}`,
    })
    const hash = await hashDoConteudo({ parte: atual.parte, textoFinal })
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

  async listarAuditoria(parteId?: string): Promise<RegistroAuditoria[]> {
    await this.pronto
    const tudo = parteId ? await this.db.auditoria.where('parteId').equals(parteId).toArray() : await this.db.auditoria.toArray()
    return tudo.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  }
}

/** ISO (UTC) -> "15/10/2026 07:58" no fuso de Belém (UTC-3, sem horário de verão). */
export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Belem', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso)).replace(',', '')
}
