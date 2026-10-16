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
  /** Militar fora do efetivo ativo some das listas de escolha, mas continua nas Partes antigas. */
  ativo?: boolean
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

/** Alínea da Participação. `textoManual` (lápis) substitui a frase gerada, como se escrita à mão. */
export type Alinea = AlineaTipo & { textoManual?: string }

export type AlineaTipo =
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
  | { tipo: 'deslocamento'; vtr: string; /** Veículo digitado (ex.: "na embarcação X"); vale no lugar da VTR. */ veiculo?: string; municipio: string; militares: Militar[]; missao: string; saida: string; retorno?: string }
  | { tipo: 'pernoite'; quem: string }
  /** Avaria ou manutenção de QUALQUER coisa do quartel (VTR, equipamento, cozinha, alojamento...). `objeto` leva o artigo: "a VTR AR-146". */
  | { tipo: 'avaria'; informante: Militar | null; objeto?: string; /** legado: só a sigla da VTR */ vtr?: string; descricao: string }
  | { tipo: 'recebimentoMaterial'; descricao: string; local: string }
  | { tipo: 'livre'; texto: string }

/** Horário em que o serviço foi assumido/passado. "previsto" gera a frase padrão do modelo. */
export type Horario =
  | { tipo: 'previsto' }
  | { tipo: 'antes' | 'atraso' | 'fora'; hora: string }

export const ROTULO_HORARIO: Record<Horario['tipo'], string> = {
  previsto: 'No horário previsto',
  antes: 'Antes do horário previsto',
  atraso: 'Com atraso',
  fora: 'Fora do horário previsto (outro)',
}

export interface ItensParte {
  recebimento: {
    antecessor: Militar | null
    /** Nome digitado quando o antecessor não está no cadastro (vale no lugar de `antecessor`). */
    antecessorTexto?: string
    /** Concordância escolhida pelo autor; se ausente, vem do cadastro. */
    genero?: Genero
    horario?: Horario
    observacao?: string
  }
  guarnicao: FuncaoGuarnicao[]
  energia: { recebi: number; passei: number }
  armamento: { itens: ItemQuantificado[] }
  comunicacao: ItemQuantificado[]
  combustivel: LinhaCombustivel[]
  participacao: Alinea[]
  juntada: ItemQuantificado[]
  ocorrencias: { incendio: OcorrenciaRegistro[]; salvamento: OcorrenciaRegistro[]; aph: OcorrenciaRegistro[] }
  passagem: {
    sucessor: Militar | null
    sucessorTexto?: string
    genero?: Genero
    horario?: Horario
    observacao?: string
  }
}

/**
 * Textos escritos à mão pelo autor. O autor pode reescrever QUALQUER parte da Parte antes de
 * encerrar (como no livro físico): quando há ajuste, ele substitui o texto gerado automaticamente.
 */
export interface AjustesTexto {
  /** Todas as linhas do cabeçalho (unidade + Parte nº / Do / Ao). */
  cabecalho?: string[]
  /** Linhas de cada item, por numeral ("I" a "X"). */
  secoes?: Record<string, string[]>
  /** Linhas do bloco de assinatura. */
  assinatura?: string[]
}

export interface Parte {
  numero: number
  /** Data de início do serviço, "AAAA-MM-DD". */
  dataServico: string
  autor: Militar
  itens: ItensParte
  ajustes?: AjustesTexto
}

export type Gravidade = 'bloqueia' | 'forte' | 'aviso' | 'leve'

export interface Aviso {
  codigo: string
  /** Item (numeral) a que o aviso se refere; some quando o autor reescreve o item à mão. */
  item?: string
  gravidade: Gravidade
  mensagem: string
}
