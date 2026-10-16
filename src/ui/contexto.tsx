import { createContext, useContext } from 'react'
import type { Equipamento, ItemDocumentoPadrao, Natureza, Repositorio, Viatura } from '../data/repositorio'
import type { Equipe, Militar, Unidade } from '../domain/tipos'

/** Dados de cadastro carregados do repositório, disponíveis a todas as telas. */
export interface Cadastros {
  unidade: Unidade
  militares: Militar[]
  viaturas: Viatura[]
  equipamentos: Equipamento[]
  documentos: ItemDocumentoPadrao[]
  naturezas: Natureza[]
  /** Escala de serviço (equipes em rodízio). */
  equipes: Equipe[]
}

export interface ContextoApp {
  repo: Repositorio
  cad: Cadastros
  /** Fase 1: "quem sou eu" é uma escolha simples (sem login). Na fase 2 vira o usuário autenticado. */
  usuario: Militar
  /** Recarrega os cadastros depois de uma alteração. */
  recarregar: () => Promise<void>
  /** Demonstração: apaga os dados do aparelho e volta ao estado inicial. */
  reiniciarDemo: () => Promise<void>
  /** Backup completo deste aparelho (arquivo JSON). */
  exportarBackup: () => Promise<Blob>
  /** Substitui os dados deste aparelho pelos de um backup. */
  importarBackup: (texto: string) => Promise<{ partes: number }>
}

const Ctx = createContext<ContextoApp | null>(null)
export const ProvedorApp = Ctx.Provider

export function useApp(): ContextoApp {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp fora do provedor')
  return v
}
