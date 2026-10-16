/**
 * Interface do repositório de dados. O app só conversa com ela; a implementação
 * pode ser local (LocalRepo, fase 1) ou Firebase (fase 2) sem mudar as telas.
 */
import type { Militar, Parte, Unidade } from '../domain/tipos'

export type StatusParte = 'rascunho' | 'encerrada' | 'vistada'

export type TipoRetificacao = 'retificacao' | 'errata' | 'adendo'

export interface Retificacao {
  numero: number
  tipo: TipoRetificacao
  /** Numeral do item, ex.: "VII". */
  item: string
  alinea?: string
  ondeSeLe?: string
  leiaSe: string
  motivo: string
  autor: string
  em: string
  hash: string
}

/** Visto do oficial: equivale às rubricas do livro físico (triângulo do cabeçalho e margem direita). */
export interface Visto {
  oficialId: string
  /** Como o oficial é citado, ex.: "1º TEN QOBM Andrade". */
  oficial: string
  /** Nome completo e posto/quadro para o bloco de assinatura, ex.: "Marcos Souza – 1º TEN QOBM". */
  assinaturaNome?: string
  /** Função do oficial no destinatário da Parte, ex.: "SubCmt do 9º GBM". */
  funcao?: string
  em: string
  /** Código de verificação (SHA-256) do visto, amarrado ao hash da Parte. */
  hash?: string
  despacho?: string
  /** Por letra da alínea do item VII: ciente e/ou providência. */
  alineas: Record<string, { ciente: boolean; providencia?: string }>
}

/** Pedido do oficial para o autor retificar a Parte (o oficial nunca edita o conteúdo). */
export interface SolicitacaoRetificacao {
  numero: number
  em: string
  oficial: string
  motivo: string
}

export interface ParteGuardada {
  id: string
  numero: number
  ano: number
  dataServico: string
  status: StatusParte
  parte: Parte
  atualizadaEm: string
  /** Preenchidos só após o encerramento. */
  textoFinal?: string
  hash?: string
  encerradaEm?: string
  retificacoes: Retificacao[]
  visto?: Visto
  solicitacoes?: SolicitacaoRetificacao[]
}

export interface Viatura {
  id: string
  prefixo: string
  tipo: string
  combustivel: string
  ordem: number
  ativa: boolean
}

export interface Equipamento {
  id: string
  descricao: string
  genero: 'M' | 'F'
  quantidadePadrao: number
  ordem: number
}

export interface ItemDocumentoPadrao {
  id: string
  descricao: string
  genero: 'M' | 'F'
  quantidadePadrao: number
}

export interface Natureza {
  id: string
  grupo: 'incendio' | 'salvamento' | 'aph'
  descricao: string
}

export interface RegistroAuditoria {
  id?: number
  acao: string
  parteId?: string
  usuario: string
  em: string
  detalhes?: string
}

export interface NovaRetificacao {
  tipo: TipoRetificacao
  item: string
  alinea?: string
  ondeSeLe?: string
  leiaSe: string
  motivo: string
  autor: string
}

export interface Repositorio {
  obterUnidade(): Promise<Unidade>
  salvarUnidade(u: Unidade): Promise<void>

  listarMilitares(): Promise<Militar[]>
  salvarMilitar(m: Militar): Promise<void>

  listarViaturas(): Promise<Viatura[]>
  salvarViatura(v: Viatura): Promise<void>

  listarEquipamentos(): Promise<Equipamento[]>
  salvarEquipamento(e: Equipamento): Promise<void>
  removerEquipamento(id: string): Promise<void>
  listarDocumentosPadrao(): Promise<ItemDocumentoPadrao[]>
  salvarDocumentoPadrao(d: ItemDocumentoPadrao): Promise<void>
  removerDocumentoPadrao(id: string): Promise<void>
  listarNaturezas(): Promise<Natureza[]>

  listarPartes(): Promise<ParteGuardada[]>
  obterParte(id: string): Promise<ParteGuardada | undefined>
  /** Última Parte encerrada (base da continuidade: Recebi = Passei anterior). */
  ultimaEncerrada(): Promise<ParteGuardada | undefined>
  /**
   * Cria (sem `id`) ou atualiza um RASCUNHO. Falha se a Parte já foi encerrada
   * ou se o número já existe na unidade/ano em outra Parte.
   */
  salvarRascunho(parte: Parte, id?: string): Promise<ParteGuardada>
  /** Congela a Parte: gera texto final e hash. Irreversível. */
  encerrar(id: string, usuario: string): Promise<ParteGuardada>
  adicionarRetificacao(id: string, r: NovaRetificacao): Promise<ParteGuardada>
  /** Só oficial. A Parte passa a "vistada"; o conteúdo original não muda. */
  vistar(id: string, oficial: Militar, dados: { despacho?: string; alineas: Visto['alineas'] }): Promise<ParteGuardada>
  /** Só oficial: pede ao autor que retifique, com motivo. */
  solicitarRetificacao(id: string, oficial: Militar, motivo: string): Promise<ParteGuardada>

  listarAuditoria(parteId?: string): Promise<RegistroAuditoria[]>
}
