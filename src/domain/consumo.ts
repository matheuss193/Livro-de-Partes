/**
 * Consumo de combustível por viatura (L/100 Km), calculado entre abastecimentos consecutivos
 * ("tanque cheio a tanque cheio": os litros de um abastecimento cobrem os Km rodados desde o anterior).
 * Alerta quando o último consumo passa de 30% acima da média anterior da mesma viatura. Só avisa.
 */
import type { ParteDatada } from './manutencao'
import type { Aviso, Parte } from './tipos'

export const LIMITE_DESVIO_CONSUMO = 0.3

export interface PontoConsumo {
  data: string
  numero: number
  km: number
  litros: number
  kmRodados: number | null
  l100: number | null
}

export interface ConsumoVtr {
  vtr: string
  pontos: PontoConsumo[]
  /** Média dos consumos anteriores ao último (precisa de pelo menos um). */
  mediaAnterior: number | null
  ultimo: number | null
  /** Quanto o último passou da média, em fração (0,5 = 50% acima). */
  desvio: number | null
  alerta: boolean
}

export function consumoPorVtr(partes: ParteDatada[]): ConsumoVtr[] {
  const ordenadas = [...partes].sort((a, b) => a.dataServico.localeCompare(b.dataServico) || a.numero - b.numero)
  const porVtr = new Map<string, { data: string; numero: number; km: number; litros: number }[]>()
  for (const p of ordenadas) {
    for (const a of p.parte.itens.participacao) {
      if (a.tipo !== 'abastecimentoVtr' || !(a.litros > 0) || !(a.km > 0) || !a.vtr) continue
      const lista = porVtr.get(a.vtr) ?? []
      lista.push({ data: p.dataServico, numero: p.numero, km: a.km, litros: a.litros })
      porVtr.set(a.vtr, lista)
    }
  }
  const resultado: ConsumoVtr[] = []
  for (const [vtr, fills] of porVtr) {
    const pontos: PontoConsumo[] = fills.map((f, i) => {
      const rodados = i > 0 ? f.km - fills[i - 1].km : null
      return { ...f, kmRodados: rodados, l100: rodados !== null && rodados > 0 ? (f.litros / rodados) * 100 : null }
    })
    const validos = pontos.filter((p) => p.l100 !== null)
    const ultimo = validos.length ? (validos[validos.length - 1].l100 as number) : null
    const anteriores = validos.slice(0, -1).map((p) => p.l100 as number)
    const media = anteriores.length ? anteriores.reduce((s, x) => s + x, 0) / anteriores.length : null
    const desvio = ultimo !== null && media !== null && media > 0 ? ultimo / media - 1 : null
    resultado.push({ vtr, pontos, mediaAnterior: media, ultimo, desvio, alerta: desvio !== null && desvio > LIMITE_DESVIO_CONSUMO })
  }
  return resultado.sort((a, b) => Number(b.alerta) - Number(a.alerta) || a.vtr.localeCompare(b.vtr))
}

const dec = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Avisos sobre os abastecimentos da Parte em edição (compara com o histórico da viatura). */
export function avisosConsumo(historico: ParteDatada[], atual: ParteDatada): Aviso[] {
  const outros = historico.filter((p) => !(p.numero === atual.numero && p.dataServico === atual.dataServico))
  return consumoPorVtr([...outros, atual])
    .filter((c) => c.alerta && c.pontos[c.pontos.length - 1].numero === atual.numero)
    .map((c) => ({
      codigo: `consumo-${c.vtr}`,
      item: 'VII',
      gravidade: 'aviso' as const,
      mensagem: `${c.vtr}: consumo de ${dec(c.ultimo ?? 0)} L/100 Km, ${Math.round((c.desvio ?? 0) * 100)}% acima da média anterior (${dec(c.mediaAnterior ?? 0)}). Confira litros, Km e o abastecimento anterior.`,
    }))
}

/** Consumo da viatura neste abastecimento, para mostrar no formulário da alínea. */
export function consumoDoAbastecimento(historico: ParteDatada[], atual: ParteDatada, vtr: string, km: number): PontoConsumo | undefined {
  return consumoPorVtr([...historico.filter((p) => !(p.numero === atual.numero && p.dataServico === atual.dataServico)), atual])
    .find((c) => c.vtr === vtr)?.pontos.find((p) => p.numero === atual.numero && p.km === km)
}

export type { Parte }
