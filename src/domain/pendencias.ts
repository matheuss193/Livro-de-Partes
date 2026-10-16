/** Pendências que o oficial precisa enxergar rápido: avarias e viaturas fora de serviço (docs/ESPECIFICACAO.md, 2.3). */
import { textoAlinea } from './textos'
import type { Parte } from './tipos'

export interface Pendencia {
  tipo: 'avaria' | 'vtr-fora'
  texto: string
}

export function pendenciasDaParte(parte: Parte): Pendencia[] {
  const lista: Pendencia[] = []
  for (const a of parte.itens.participacao) {
    if (a.tipo === 'avaria') lista.push({ tipo: 'avaria', texto: textoAlinea(a) })
    if (a.tipo === 'verificacao' && a.alteracoes.trim()) lista.push({ tipo: 'avaria', texto: textoAlinea(a) })
    if (a.tipo === 'estrutura') lista.push({ tipo: 'avaria', texto: textoAlinea(a) })
    if (a.tipo === 'saudeMilitar') lista.push({ tipo: 'avaria', texto: textoAlinea(a) })
  }
  for (const l of parte.itens.combustivel) {
    const s = l.situacao.tipo
    if (s === 'oficina' || s === 'inoperante' || s === 'baixada') {
      lista.push({ tipo: 'vtr-fora', texto: `VTR ${l.vtr}: ${s === 'oficina' ? 'em oficina' : s === 'inoperante' ? 'inoperante' : 'baixada'}.` })
    }
  }
  return lista
}
