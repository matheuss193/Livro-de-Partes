/**
 * Sugestões de participação aprendidas das Partes anteriores: o que mais se repete (avaria, visita, rotina,
 * deslocamento, instrução...) aparece como atalho para adicionar com um toque. O autor sempre pode editar.
 * Não sugere o que depende de valores do dia (abastecimento, permuta, substituição, revisão).
 */
import { normalizar } from './busca'
import { textoAlinea } from './textos'
import type { Alinea, Parte } from './tipos'

const FORA = new Set<Alinea['tipo']>(['abastecimentoVtr', 'abastecimentoEquip', 'permuta', 'substituicao', 'revisao'])

export interface Sugestao {
  alinea: Alinea
  texto: string
  vezes: number
  ultimaData: string
}

export const clonarAlinea = (a: Alinea): Alinea => JSON.parse(JSON.stringify(a)) as Alinea

export function sugerirParticipacoes(partes: { dataServico: string; parte: Parte }[], jaNaParte: Alinea[], max = 6): Sugestao[] {
  const jaTem = new Set(jaNaParte.map((a) => `${a.tipo}|${normalizar(textoAlinea(a))}`))
  const mapa = new Map<string, Sugestao>()
  for (const p of [...partes].sort((a, b) => a.dataServico.localeCompare(b.dataServico))) {
    for (const a of p.parte.itens.participacao) {
      if (FORA.has(a.tipo)) continue
      const texto = textoAlinea(a)
      if (a.tipo === 'livre' && !texto.trim()) continue
      const chave = `${a.tipo}|${normalizar(texto)}`
      const atual = mapa.get(chave)
      mapa.set(chave, { alinea: clonarAlinea(a), texto, vezes: (atual?.vezes ?? 0) + 1, ultimaData: p.dataServico })
    }
  }
  return [...mapa.entries()]
    .filter(([chave]) => !jaTem.has(chave))
    .map(([, s]) => s)
    .sort((a, b) => b.vezes - a.vezes || b.ultimaData.localeCompare(a.ultimaData))
    .slice(0, max)
}
