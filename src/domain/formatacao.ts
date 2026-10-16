import type { Militar } from './tipos'

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** "2026-10-14" -> "14 de outubro de 2026". */
export function dataPorExtenso(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Data inválida: ${iso}`)
  return `${Number(m[3])} de ${MESES[Number(m[2]) - 1]} de ${m[1]}`
}

/** Soma dias a uma data ISO (aritmética em UTC, sem efeito de fuso/horário de verão). */
export function somarDias(iso: string, dias: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** Número com vírgula decimal e ponto de milhar: 1234.5 -> "1.234,50". */
export function decimalBR(n: number, casas = 2): string {
  const [inteiro, frac] = Math.abs(n).toFixed(casas).split('.')
  const milhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${n < 0 ? '-' : ''}${milhar}${frac ? ',' + frac : ''}`
}

export function reais(n: number): string {
  return `R$ ${decimalBR(n)}`
}

/** Dois dígitos, como no livro: 7 -> "07". */
export function doisDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

/** "2º SGT QBM Albuquerque" (quadro é omitido quando vazio). */
export function tratamento(m: Militar): string {
  return [m.postoGrad, m.quadro, m.nomeGuerra].filter(Boolean).join(' ')
}

const HIERARQUIA = ['CEL', 'TEN CEL', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP', 'ST', '1º SGT', '2º SGT', '3º SGT', 'CB', 'SD']

/** Ordena do posto mais alto ao mais baixo e, no mesmo posto, por nome de guerra. */
export function ordenarPorHierarquia(militares: Militar[]): Militar[] {
  const peso = (m: Militar) => {
    const i = HIERARQUIA.indexOf(m.postoGrad.toUpperCase())
    return i === -1 ? HIERARQUIA.length : i
  }
  return [...militares].sort((a, b) => peso(a) - peso(b) || a.nomeGuerra.localeCompare(b.nomeGuerra, 'pt-BR'))
}

/** "A", "A e B", "A, B e C". */
export function listaComE(itens: string[]): string {
  if (itens.length <= 1) return itens.join('')
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`
}

/** Lê decimal digitado no padrão brasileiro ("1.234,50" ou "45,5"); texto inválido vira 0. */
export function parseDecimal(t: string): number {
  const limpo = t.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')
  const n = Number(limpo)
  return Number.isFinite(n) ? n : 0
}
