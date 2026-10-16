/** Busca no histórico: acha uma palavra (sem ligar para acento ou maiúscula) em todas as Partes e correções. */
import type { ParteGuardada } from '../data/repositorio'

export const normalizar = (t: string): string => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export interface Trecho {
  /** Numeral do item (I a X), "Visto", "Retificação" ou "Solicitação". */
  item: string
  texto: string
}

export interface ResultadoBusca {
  id: string
  numero: number
  dataServico: string
  status: ParteGuardada['status']
  trechos: Trecho[]
  /** Quantas linhas bateram (os trechos mostram no máximo 6). */
  total: number
}

const MAX_TRECHOS = 6

function linhasDaParte(g: ParteGuardada, textoRascunho?: (g: ParteGuardada) => string): Trecho[] {
  const trechos: Trecho[] = []
  const texto = g.textoFinal ?? (g.status === 'rascunho' ? textoRascunho?.(g) ?? '' : '')
  let item = 'Cabeçalho'
  for (const linha of texto.split('\n')) {
    const m = /^([IVX]+) – /.exec(linha)
    if (m) item = m[1]
    if (linha.trim()) trechos.push({ item, texto: linha.trim() })
  }
  for (const r of g.retificacoes) {
    trechos.push({ item: 'Retificação', texto: `Item ${r.item}${r.alinea ? `, alínea ${r.alinea}` : ''}: ${r.ondeSeLe ? `“${r.ondeSeLe}” → ` : ''}“${r.leiaSe}”. Motivo: ${r.motivo}` })
  }
  for (const s of g.solicitacoes ?? []) trechos.push({ item: 'Solicitação', texto: s.motivo })
  if (g.visto?.despacho) trechos.push({ item: 'Visto', texto: `Despacho: ${g.visto.despacho}` })
  for (const [letra, a] of Object.entries(g.visto?.alineas ?? {})) {
    if (a.providencia) trechos.push({ item: 'Visto', texto: `Alínea ${letra}) providência: ${a.providencia}` })
  }
  return trechos
}

/** Todas as palavras digitadas precisam aparecer na mesma linha. Mínimo de 2 letras. */
export function buscar(partes: ParteGuardada[], termo: string, textoRascunho?: (g: ParteGuardada) => string): ResultadoBusca[] {
  const palavras = normalizar(termo).split(/\s+/).filter((p) => p.length >= 2)
  if (palavras.length === 0) return []
  const resultados: ResultadoBusca[] = []
  for (const g of partes) {
    const achados = linhasDaParte(g, textoRascunho).filter((t) => {
      const n = normalizar(t.texto)
      return palavras.every((p) => n.includes(p))
    })
    if (achados.length) {
      resultados.push({ id: g.id, numero: g.numero, dataServico: g.dataServico, status: g.status, trechos: achados.slice(0, MAX_TRECHOS), total: achados.length })
    }
  }
  return resultados.sort((a, b) => b.dataServico.localeCompare(a.dataServico) || b.numero - a.numero)
}

/** Divide o texto em pedaços "com destaque" / "sem destaque" para mostrar as palavras achadas. */
export function destacar(texto: string, termo: string): { texto: string; marcado: boolean }[] {
  const palavras = normalizar(termo).split(/\s+/).filter((p) => p.length >= 2)
  const n = normalizar(texto)
  const marca = new Array<boolean>(texto.length).fill(false)
  if (n.length === texto.length) {
    for (const p of palavras) {
      for (let i = n.indexOf(p); i !== -1; i = n.indexOf(p, i + p.length)) for (let k = i; k < i + p.length; k++) marca[k] = true
    }
  }
  const partes: { texto: string; marcado: boolean }[] = []
  for (let i = 0; i < texto.length; i++) {
    const ult = partes[partes.length - 1]
    if (ult && ult.marcado === marca[i]) ult.texto += texto[i]
    else partes.push({ texto: texto[i], marcado: marca[i] })
  }
  return partes
}
