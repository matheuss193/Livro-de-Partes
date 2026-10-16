/** Criação de uma Parte nova, pré-preenchida com a Parte anterior (continuidade). */
import type { ParteGuardada } from '../../data/repositorio'
import type { Cadastros } from '../../ui/contexto'
import type { LinhaCombustivel, Militar, Parte } from '../../domain/tipos'

/** Funções da guarnição no modelo do 9º GBM (o Comandante do Socorro é sempre o autor, automático). */
export const FUNCOES_GUARNICAO = [
  'Adjunto ao CMT do SOS',
  'Condutor e Operador de VTR Inc/Salv',
  'Condutor da VTR UR-119',
  'Socorristas',
  'Guarnição de Incêndio',
  'Guarnição de Salvamento',
]

/** Data de hoje no calendário de Belém, "AAAA-MM-DD". */
export function hojeEmBelem(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Belem' }).format(agora)
}

export function criarParteNova(autor: Militar, cad: Cadastros, ultima?: ParteGuardada, hoje = hojeEmBelem()): Parte {
  const ant = ultima?.parte
  const combustivel: LinhaCombustivel[] = cad.viaturas
    .filter((v) => v.ativa)
    .map((v) => {
      const a = ant?.itens.combustivel.find((l) => l.vtr === v.prefixo)
      const nivel = a?.passeiNivel ?? '4/4'
      return {
        vtr: v.prefixo,
        recebiNivel: nivel,
        recebiKm: a?.passeiKm ?? null,
        passeiNivel: nivel,
        passeiKm: null, // o comandante informa; não se copia o Km para não "inventar" o dado
        situacao: { tipo: 'operante' },
      }
    })
  return {
    numero: ultima ? ultima.numero + 1 : 1,
    dataServico: hoje,
    autor,
    itens: {
      recebimento: { antecessor: ant?.autor ?? null },
      guarnicao: FUNCOES_GUARNICAO.map((funcao) => ({ funcao, militares: [] })),
      energia: { recebi: ant?.itens.energia.passei ?? 0, passei: 0 },
      armamento: { itens: [] },
      comunicacao: cad.equipamentos.map((e) => ({ descricao: e.descricao, genero: e.genero, quantidade: e.quantidadePadrao })),
      combustivel,
      participacao: [],
      juntada: cad.documentos.map((d) => ({ descricao: d.descricao, genero: d.genero, quantidade: d.quantidadePadrao })),
      ocorrencias: { incendio: [], salvamento: [], aph: [] },
      passagem: { sucessor: null },
    },
  }
}
