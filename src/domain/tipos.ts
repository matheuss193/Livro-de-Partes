/**
 * Tipos do domínio da Parte (ver docs/ESPECIFICACAO.md, seções 2 e 6).
 * Datas de serviço são sempre texto ISO "AAAA-MM-DD" (calendário de America/Belem),
 * para evitar problemas de fuso horário.
 */

export type Genero = 'M' | 'F'

export interface Militar {
  id: string
  /** Ex.: "2º SGT", "CB", "SD", "1º TEN". */
  postoGrad: string
  /** Ex.: "QBM", "QOBM", "BM". Pode ser vazio. */
  quadro: string
  nomeGuerra: string
  nomeCompleto: string
  genero: Genero
}

export interface Unidade {
  nome: string
  /** Linhas do cabeçalho acima do número da Parte (3 linhas no modelo do 9º GBM). */
  cabecalho: [string, string, string]
  cidade: string
  /** Destinatário da Parte (SubCmt). */
  destinatario: { militar: Militar; funcao: string }
  /** Grafia da unidade de energia (A CONFIRMAR com o comando). */
  unidadeEnergia: string
}

export type NivelTanque = '1/4' | '1/2' | '3/4' | '4/4' | '—'

export type SituacaoVtr =
  | { tipo: 'operante' }
  | { tipo: 'oficina' }
  | { tipo: 'inoperante' }
  | { tipo: 'baixada' }
  | { tipo: 'missao'; destino: string }
  | { tipo: 'outro'; texto: string }

export interface LinhaCombustivel {
  vtr: string
  recebiNivel: NivelTanque
  recebiKm: number | null
  passeiNivel: NivelTanque
  passeiKm: number | null
  situacao: SituacaoVtr
}

export interface FuncaoGuarnicao {
  /** Rótulo no singular/plural já como aparece na Parte, ex.: "Socorristas". */
  funcao: string
  militares: Militar[]
}

export interface ItemQuantificado {
  descricao: string
  genero: Genero
  quantidade: number
}

export interface OcorrenciaRegistro {
  /** Um ou mais números (texto livre: a numeração mudou de formato ao longo do tempo). */
  numeros: string[]
  natureza: string
}

export type Alinea =
  | { tipo: 'permuta'; entra: Militar | null; sai: Militar | null }
  | { tipo: 'substituicao'; entra: Militar | null; sai: Militar | null; determinacao: string }
  | {
      tipo: 'abastecimentoVtr'
      vtr: string
      litros: number
      combustivel: string
      valor: number
      km: number
      saldo: number
      danfe?: string
    }
  | {
      tipo: 'abastecimentoEquip'
      litros: number
      combustivel: string
      cartao: string
      valor: number
      saldo: number
    }
  | { tipo: 'deslocamento'; vtr: string; municipio: string; militares: Militar[]; missao: string; saida: string; retorno?: string }
  | { tipo: 'pernoite'; quem: string }
  | { tipo: 'avaria'; informante: Militar | null; vtr: string; descricao: string }
  | { tipo: 'recebimentoMaterial'; descricao: string; local: string }
  | { tipo: 'livre'; texto: string }

export interface ItensParte {
  recebimento: { antecessor: Militar | null; observacao?: string }
  guarnicao: FuncaoGuarnicao[]
  energia: { recebi: number; passei: number }
  armamento: { itens: ItemQuantificado[] }
  comunicacao: ItemQuantificado[]
  combustivel: LinhaCombustivel[]
  participacao: Alinea[]
  juntada: ItemQuantificado[]
  ocorrencias: { incendio: OcorrenciaRegistro[]; salvamento: OcorrenciaRegistro[]; aph: OcorrenciaRegistro[] }
  passagem: { sucessor: Militar | null }
}

export interface Parte {
  numero: number
  /** Data de início do serviço, "AAAA-MM-DD". */
  dataServico: string
  autor: Militar
  itens: ItensParte
}

export type Gravidade = 'bloqueia' | 'forte' | 'aviso' | 'leve'

export interface Aviso {
  codigo: string
  gravidade: Gravidade
  mensagem: string
}
