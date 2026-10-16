/**
 * Interface do repositório de dados. O app só conversa com ela; a implementação
 * pode ser local (LocalRepo, fase 1) ou Firebase (fase 2) sem mudar as telas.
 */
import type { Equipe, Militar, Parte, Unidade } from '../domain/tipos'

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

/** Documento anexado à Parte (juntada): PDF ou foto. O arquivo em si fica à parte, ligado por `parteId`. */
export interface AnexoMeta {
  id: string
  parteId: string
  nome: string
  tipo: string
  tamanho: number
  /** SHA-256 do arquivo: entra no hash da Parte ao encerrar. */
  sha256: string
  /** A que documento da Juntada se refere (livre), ex.: "Mapa de Comunicação e Ronda". */
  rotulo?: string
  em: string
}

export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024
export const TIPOS_ANEXO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

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
  /** A cada quantos Km a viatura faz revisão (padrão 10.000). */
  intervaloRevisaoKm?: number
  /** Km da última revisão conhecida (as revisões registradas nas Partes têm prioridade). */
  ultimaRevisaoKm?: number
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
  /** Escala de serviço: equipes em rodízio (cada uma com seu Comandante do Socorro). */
  obterEscala(): Promise<Equipe[]>

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

  /** Só em rascunho. Aceita PDF/JPG/PNG/WEBP até 10 MB. */
  adicionarAnexo(parteId: string, arquivo: File, rotulo?: string): Promise<AnexoMeta>
  listarAnexos(parteId: string): Promise<AnexoMeta[]>
  obterAnexo(id: string): Promise<{ meta: AnexoMeta; blob: Blob } | undefined>
  /** Só em rascunho: depois de encerrada, a Parte e seus anexos são imutáveis. */
  removerAnexo(id: string): Promise<void>

  listarAuditoria(parteId?: string): Promise<RegistroAuditoria[]>
}
