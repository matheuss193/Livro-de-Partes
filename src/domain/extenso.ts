import type { Genero } from './tipos'

const UNIDADES_M = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const ESPECIAIS = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']

function unidade(n: number, genero: Genero): string {
  if (genero === 'F') {
    if (n === 1) return 'uma'
    if (n === 2) return 'duas'
  }
  return UNIDADES_M[n]
}

/** Número de 0 a 99 por extenso, com concordância de gênero ("um"/"uma", "dois"/"duas"). */
export function extenso(n: number, genero: Genero = 'M'): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new RangeError(`Número fora de 0 a 99: ${n}`)
  if (n < 10) return unidade(n, genero)
  if (n < 20) return ESPECIAIS[n - 10]
  const d = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${unidade(u, genero)}`
}

/** Padrão do livro: dois dígitos + extenso entre parênteses. Ex.: "01 (uma)". */
export function quantidadeExtenso(n: number, genero: Genero = 'M'): string {
  return `${String(n).padStart(2, '0')} (${extenso(n, genero)})`
}
