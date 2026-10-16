/**
 * Revisão de viatura por Km acumulado. O Km atual vem das Partes; a última revisão vem do cadastro da
 * viatura e das alíneas "Revisão" registradas nas Partes (a mais recente prevalece). Só avisa: nada é corrigido sozinho.
 */
import type { Viatura } from '../data/repositorio'
import type { Aviso, Parte } from './tipos'

/** Avisa quando faltam até 500 Km para a revisão (configurável na fase 2). */
export const MARGEM_AVISO_KM = 500
export const INTERVALO_PADRAO_KM = 10000

export type SituacaoRevisao = 'em-dia' | 'proxima' | 'vencida' | 'sem-dados'

export interface StatusRevisao {
  vtr: string
  kmAtual: number | null
  ultimaRevisaoKm: number | null
  intervaloKm: number
  proximaKm: number | null
  faltamKm: number | null
  situacao: SituacaoRevisao
}

export interface ParteDatada {
  dataServico: string
  numero: number
  parte: Parte
}

const ordenar = (partes: ParteDatada[]) =>
  [...partes].sort((a, b) => a.dataServico.localeCompare(b.dataServico) || a.numero - b.numero)

/** `atual`: o rascunho em edição (conta como o dado mais recente). */
export function statusRevisoes(viaturas: Viatura[], partes: ParteDatada[], atual?: ParteDatada): StatusRevisao[] {
  const todas = ordenar([...partes.filter((p) => p.numero !== atual?.numero || p.dataServico !== atual?.dataServico), ...(atual ? [atual] : [])])
  return viaturas
    .filter((v) => v.ativa)
    .map((v) => {
      let kmAtual: number | null = null
      let ultima: number | null = v.ultimaRevisaoKm ?? null
      for (const p of todas) {
        const l = p.parte.itens.combustivel.find((x) => x.vtr === v.prefixo)
        const km = l ? l.passeiKm ?? l.recebiKm : null
        if (km !== null && km !== undefined) kmAtual = km
        for (const a of p.parte.itens.participacao) {
          if (a.tipo === 'revisao' && a.vtr === v.prefixo && a.km > 0) ultima = Math.max(ultima ?? 0, a.km)
        }
      }
      const intervalo = v.intervaloRevisaoKm ?? INTERVALO_PADRAO_KM
      if (kmAtual === null || ultima === null) {
        return { vtr: v.prefixo, kmAtual, ultimaRevisaoKm: ultima, intervaloKm: intervalo, proximaKm: null, faltamKm: null, situacao: 'sem-dados' as const }
      }
      const proxima = ultima + intervalo
      const faltam = proxima - kmAtual
      const situacao: SituacaoRevisao = faltam < 0 ? 'vencida' : faltam <= MARGEM_AVISO_KM ? 'proxima' : 'em-dia'
      return { vtr: v.prefixo, kmAtual, ultimaRevisaoKm: ultima, intervaloKm: intervalo, proximaKm: proxima, faltamKm: faltam, situacao }
    })
}

const milhar = (n: number) => n.toLocaleString('pt-BR')

export function avisosRevisao(status: StatusRevisao[]): Aviso[] {
  const avisos: Aviso[] = []
  for (const s of status) {
    if (s.situacao === 'proxima' && s.faltamKm !== null && s.proximaKm !== null) {
      avisos.push({ codigo: `revisao-${s.vtr}`, item: 'VI', gravidade: 'aviso', mensagem: `${s.vtr}: faltam ${milhar(s.faltamKm)} Km para a revisão (próxima aos ${milhar(s.proximaKm)} Km; Km atual ${milhar(s.kmAtual ?? 0)}).` })
    }
    if (s.situacao === 'vencida' && s.faltamKm !== null && s.proximaKm !== null) {
      avisos.push({ codigo: `revisao-${s.vtr}`, item: 'VI', gravidade: 'aviso', mensagem: `${s.vtr}: revisão vencida há ${milhar(-s.faltamKm)} Km (era aos ${milhar(s.proximaKm)} Km; Km atual ${milhar(s.kmAtual ?? 0)}). Se já foi feita, registre em Participação > Revisão.` })
    }
  }
  return avisos
}
