/** Números do painel do oficial, calculados só a partir das Partes encerradas (docs/ESPECIFICACAO.md, 8.6). */
import type { ParteGuardada } from '../data/repositorio'
import { pendenciasDaParte, type Pendencia } from './pendencias'

export interface PontoEnergia { data: string; numero: number; consumo: number }
export interface PontoAbastecimento { data: string; numero: number; litros: number; valor: number }
export interface LinhaVtr { vtr: string; litros: number; valor: number; abastecimentos: number }
export interface LinhaNatureza { natureza: string; grupo: 'incendio' | 'salvamento' | 'aph'; quantidade: number }

export interface DadosPainel {
  partes: number
  aguardandoVisto: number
  periodo: { de: string; ate: string } | null
  energia: { pontos: PontoEnergia[]; media: number; total: number; maximo: number }
  abastecimento: { pontos: PontoAbastecimento[]; litros: number; valor: number; precoMedio: number; porVtr: LinhaVtr[] }
  ocorrencias: { total: number; porGrupo: Record<LinhaNatureza['grupo'], number>; porNatureza: LinhaNatureza[] }
  pendencias: { numero: number; itens: Pendencia[] } | null
}

const GRUPOS = ['incendio', 'salvamento', 'aph'] as const

/** `ultimosDias`: considera só as Partes dos últimos N dias (contados a partir da Parte mais recente). */
export function calcularPainel(todas: ParteGuardada[], ultimosDias?: number): DadosPainel {
  const encerradas = todas
    .filter((p) => p.status !== 'rascunho')
    .sort((a, b) => a.dataServico.localeCompare(b.dataServico) || a.numero - b.numero)
  const fim = encerradas[encerradas.length - 1]
  const corte = fim && ultimosDias ? somarDiasISO(fim.dataServico, -(ultimosDias - 1)) : undefined
  const partes = corte ? encerradas.filter((p) => p.dataServico >= corte) : encerradas

  const energiaPontos: PontoEnergia[] = partes.map((p) => ({
    data: p.dataServico, numero: p.numero, consumo: p.parte.itens.energia.passei - p.parte.itens.energia.recebi,
  }))
  const energiaTotal = energiaPontos.reduce((s, x) => s + x.consumo, 0)

  const abastPontos: PontoAbastecimento[] = []
  const porVtr = new Map<string, LinhaVtr>()
  for (const p of partes) {
    let litros = 0
    let valor = 0
    for (const a of p.parte.itens.participacao) {
      if (a.tipo !== 'abastecimentoVtr' && a.tipo !== 'abastecimentoEquip') continue
      litros += a.litros
      valor += a.valor
      const chave = a.tipo === 'abastecimentoVtr' ? a.vtr : 'Equipamentos'
      const l = porVtr.get(chave) ?? { vtr: chave, litros: 0, valor: 0, abastecimentos: 0 }
      l.litros += a.litros; l.valor += a.valor; l.abastecimentos += 1
      porVtr.set(chave, l)
    }
    abastPontos.push({ data: p.dataServico, numero: p.numero, litros, valor })
  }
  const litrosTotal = abastPontos.reduce((s, x) => s + x.litros, 0)
  const valorTotal = abastPontos.reduce((s, x) => s + x.valor, 0)

  const porGrupo = { incendio: 0, salvamento: 0, aph: 0 }
  const naturezas = new Map<string, LinhaNatureza>()
  for (const p of partes) {
    for (const g of GRUPOS) {
      for (const r of p.parte.itens.ocorrencias[g]) {
        const qtd = Math.max(1, r.numeros.length)
        porGrupo[g] += qtd
        const chave = `${g}|${r.natureza.trim() || 'Sem natureza'}`
        const l = naturezas.get(chave) ?? { natureza: r.natureza.trim() || 'Sem natureza', grupo: g, quantidade: 0 }
        l.quantidade += qtd
        naturezas.set(chave, l)
      }
    }
  }

  return {
    partes: partes.length,
    aguardandoVisto: todas.filter((p) => p.status === 'encerrada').length,
    periodo: partes.length ? { de: partes[0].dataServico, ate: partes[partes.length - 1].dataServico } : null,
    energia: {
      pontos: energiaPontos,
      total: energiaTotal,
      media: energiaPontos.length ? energiaTotal / energiaPontos.length : 0,
      maximo: energiaPontos.reduce((m, x) => Math.max(m, x.consumo), 0),
    },
    abastecimento: {
      pontos: abastPontos, litros: litrosTotal, valor: valorTotal,
      precoMedio: litrosTotal > 0 ? valorTotal / litrosTotal : 0,
      porVtr: [...porVtr.values()].sort((a, b) => b.litros - a.litros),
    },
    ocorrencias: {
      total: porGrupo.incendio + porGrupo.salvamento + porGrupo.aph,
      porGrupo,
      porNatureza: [...naturezas.values()].sort((a, b) => b.quantidade - a.quantidade || a.natureza.localeCompare(b.natureza, 'pt-BR')),
    },
    pendencias: fim ? { numero: fim.numero, itens: pendenciasDaParte(fim.parte) } : null,
  }
}

function somarDiasISO(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}
