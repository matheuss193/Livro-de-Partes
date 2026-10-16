/**
 * Escala de serviço em rodízio de equipes. Na demonstração a escala é fictícia (4 equipes de 24 h);
 * na fase 2 virá do cadastro da unidade. A Parte nova já nasce com a guarnição, o antecessor e o sucessor da escala.
 */
import { somarDias } from './formatacao'
import type { Equipe, FuncaoGuarnicao, Militar } from './tipos'

/** Data em que a equipe de índice `INDICE_ANCORA` esteve de serviço (referência do rodízio). */
export const DATA_ANCORA = '2026-10-14'
export const INDICE_ANCORA = 1

const dias = (a: string, b: string) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) - Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10))) / 86400000)
const mod = (n: number, m: number) => ((n % m) + m) % m

export function indiceDaEquipe(equipes: Equipe[], data: string): number {
  return mod(INDICE_ANCORA + dias(DATA_ANCORA, data), equipes.length)
}

export function equipeDoDia(equipes: Equipe[], data: string): Equipe {
  return equipes[indiceDaEquipe(equipes, data)]
}

export const equipeDoComandante = (equipes: Equipe[], m: Militar): Equipe | undefined => equipes.find((e) => e.comandante.id === m.id)

/** Equipe do autor, se ele comanda uma; senão, a equipe da data (na demonstração qualquer sargento pode redigir). */
export function equipeParaParte(equipes: Equipe[], data: string, autor: Militar): Equipe {
  return equipeDoComandante(equipes, autor) ?? equipeDoDia(equipes, data)
}

export function equipeSeguinte(equipes: Equipe[], e: Equipe): Equipe {
  return equipes[(equipes.indexOf(e) + 1) % equipes.length]
}

export function equipeAnterior(equipes: Equipe[], e: Equipe): Equipe {
  return equipes[mod(equipes.indexOf(e) - 1, equipes.length)]
}

/** Guarnição da equipe como as funções do item II (cópia: o autor pode alterar à vontade). */
export function guarnicaoDaEquipe(e: Equipe): FuncaoGuarnicao[] {
  return e.guarnicao.map((f) => ({ funcao: f.funcao, militares: [...f.militares] }))
}

export { somarDias }
