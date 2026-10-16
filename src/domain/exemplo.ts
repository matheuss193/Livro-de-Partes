/** Dados FICTÍCIOS de demonstração, reproduzindo docs/EXEMPLO_PARTE.md. Nenhum dado real. */
import type { ItemQuantificado, LinhaCombustivel, Militar, Parte, Unidade } from './tipos'

const m = (id: string, postoGrad: string, quadro: string, nomeGuerra: string, genero: 'M' | 'F' = 'M', nomeCompleto = nomeGuerra): Militar => ({
  id, postoGrad, quadro, nomeGuerra, nomeCompleto, genero,
})

export const albuquerque = m('m1', '2º SGT', 'QBM', 'Albuquerque', 'M', 'Ricardo Albuquerque Neves')
export const teixeira = m('m2', '2º SGT', 'QBM', 'Teixeira')
export const rangel = m('m3', '2º SGT', 'QBM', 'Rangel', 'F')
export const pacheco = m('m4', '3º SGT', 'QBM', 'Pacheco')
export const moura = m('m5', '3º SGT', 'QBM', 'Moura')
export const brandao = m('m6', 'CB', 'BM', 'Brandão')
export const lima = m('m7', 'SD', 'BM', 'Lima')
export const prado = m('m8', 'SD', 'BM', 'Prado')
export const nogueira = m('m9', 'SD', 'BM', 'Nogueira')
export const castro = m('m10', 'SD', 'BM', 'Castro')
export const farias = m('m11', 'SD', 'BM', 'Farias')
export const rezende = m('m12', 'SD', 'BM', 'Rezende')
export const vieira = m('m13', '2º SGT', 'QBM', 'Vieira')
export const cunha = m('m14', 'SD', 'BM', 'Cunha')
export const andrade = m('m15', '1º TEN', 'QOBM', 'Andrade', 'M', 'Marcos Vinícius Andrade Souza')

export const unidadeExemplo: Unidade = {
  nome: '9º GBM',
  cabecalho: ['Corpo de Bombeiros Militar do Pará', 'Coordenadoria Estadual de Defesa Civil', '9º Grupamento Bombeiro Militar'],
  cidade: 'Altamira-PA',
  destinatario: { militar: andrade, funcao: 'SubCmt do 9º GBM' },
  unidadeEnergia: 'kWh',
}

export const comunicacaoPadrao: ItemQuantificado[] = [
  { quantidade: 1, genero: 'M', descricao: 'Rádio base fixa digital' },
  { quantidade: 2, genero: 'M', descricao: 'Rádios HT portáteis digitais' },
  { quantidade: 1, genero: 'M', descricao: 'Rádio ponto a ponto com carregador' },
  { quantidade: 1, genero: 'M', descricao: 'Smartphone Samsung com carregador' },
]

const op = { tipo: 'operante' } as const
const lc = (vtr: string, rn: LinhaCombustivel['recebiNivel'], rk: number | null, pn: LinhaCombustivel['passeiNivel'], pk: number | null, situacao: LinhaCombustivel['situacao'] = op): LinhaCombustivel => ({
  vtr, recebiNivel: rn, recebiKm: rk, passeiNivel: pn, passeiKm: pk, situacao,
})

export const combustivelExemplo: LinhaCombustivel[] = [
  lc('ABT-42', '3/4', 12500, '3/4', 12512),
  lc('ABTF-14', '4/4', 2200, '4/4', 2200),
  lc('AT-12', '4/4', 51800, '4/4', 51800),
  lc('ATT-02', '1/2', 68000, '1/2', 68000),
  lc('UR-119', '1/2', 13000, '4/4', 13064),
  lc('AR-129', '3/4', 48700, '3/4', 48731),
  lc('AR-145', '3/4', 21200, '—', null, { tipo: 'missao', destino: 'Anapu' }),
  lc('AR-146', '1/2', 8750, '1/2', 8750, { tipo: 'oficina' }),
  lc('ARL-51', '3/4', 64200, '3/4', 64215),
  lc('AFR-19', '3/4', 23600, '3/4', 23600),
  lc('APS-96', '1/2', 80300, '1/2', 80304),
  lc('APSL-17', '3/4', 15200, '3/4', 15200),
]

export const parteExemplo: Parte = {
  numero: 201,
  dataServico: '2026-10-14',
  autor: albuquerque,
  itens: {
    recebimento: { antecessor: teixeira },
    guarnicao: [
      { funcao: 'Adjunto ao CMT do SOS', militares: [pacheco] },
      { funcao: 'Condutor e Operador de VTR Inc/Salv', militares: [moura] },
      { funcao: 'Condutor da VTR UR-119', militares: [brandao] },
      { funcao: 'Socorristas', militares: [lima, prado] },
      { funcao: 'Guarnição de Incêndio', militares: [nogueira, castro] },
      { funcao: 'Guarnição de Salvamento', militares: [farias] },
    ],
    energia: { recebi: 5120, passei: 5127 },
    armamento: { itens: [] },
    comunicacao: comunicacaoPadrao,
    combustivel: combustivelExemplo,
    participacao: [
      { tipo: 'permuta', entra: farias, sai: rezende },
      { tipo: 'abastecimentoVtr', vtr: 'UR-119', litros: 45.5, combustivel: 'diesel S10', valor: 362.18, km: 13020, saldo: 437.82 },
      { tipo: 'deslocamento', vtr: 'AR-145', municipio: 'Anapu', militares: [vieira, cunha], missao: 'Defesa Civil', saida: '07:40' },
      { tipo: 'avaria', informante: moura, objeto: 'a VTR AR-146', descricao: 'está apresentando ruído nos freios dianteiros, tendo sido encaminhada à oficina' },
    ],
    juntada: [
      { quantidade: 1, genero: 'M', descricao: 'Mapa de Comunicação e Ronda' },
      { quantidade: 1, genero: 'M', descricao: 'Controle de Saída e Entrada de Viaturas' },
      { quantidade: 1, genero: 'M', descricao: 'Controle de Entrada e Saída de Civis e Militares' },
      { quantidade: 1, genero: 'F', descricao: 'Permuta' },
      { quantidade: 1, genero: 'F', descricao: 'Nota fiscal de abastecimento' },
      { quantidade: 3, genero: 'F', descricao: 'Fichas de APH' },
    ],
    ocorrencias: {
      incendio: [{ numeros: ['900101'], natureza: 'Fogo em vegetação' }],
      salvamento: [{ numeros: ['900105'], natureza: 'Captura de ofídio' }],
      aph: [
        { numeros: ['900110', '900118'], natureza: 'Emergência clínica' },
        { numeros: ['900112'], natureza: 'Sinistro de trânsito' },
      ],
    },
    passagem: { sucessor: rangel },
  },
}

interface OpcoesAnterior {
  numero: number
  dataServico: string
  autor: Militar
  antecessor: Militar
  sucessor: Militar
  consumo: number
  /** Km rodado por VTR no dia (somado ao índice para variar). */
  kmBase: number
  participacao: Parte['itens']['participacao']
  ocorrencias: Parte['itens']['ocorrencias']
}

/** Gera a Parte do serviço anterior, com Recebi/Passei encadeados (Passei dela = Recebi da seguinte). */
function anteriorDe(seguinte: Parte, o: OpcoesAnterior): Parte {
  return {
    numero: o.numero,
    dataServico: o.dataServico,
    autor: o.autor,
    itens: {
      ...seguinte.itens,
      recebimento: { antecessor: o.antecessor },
      passagem: { sucessor: o.sucessor },
      energia: { recebi: seguinte.itens.energia.recebi - o.consumo, passei: seguinte.itens.energia.recebi },
      combustivel: seguinte.itens.combustivel.map((l, i) => {
        const rodou = i % 3 === 2 ? 0 : o.kmBase + i * 2
        const passeiKm = l.recebiKm
        return {
          vtr: l.vtr,
          recebiNivel: l.recebiNivel,
          recebiKm: passeiKm === null ? null : Math.max(0, passeiKm - rodou),
          passeiNivel: l.recebiNivel,
          passeiKm,
          situacao: { tipo: 'operante' },
        }
      }),
      participacao: o.participacao,
      ocorrencias: o.ocorrencias,
    },
  }
}

/** Autores dos serviços 190 a 200 (o 201 é a Parte nova da demonstração, de Albuquerque). */
const AUTORES_DEMO: Militar[] = [vieira, rangel, teixeira, albuquerque, vieira, rangel, teixeira, albuquerque, rangel, vieira, teixeira]
const CONSUMO_DEMO = [8, 7, 9, 6, 8, 7, 9, 6, 8, 7] // 191..200 (kWh/dia)

const NATUREZAS_DEMO: Record<'incendio' | 'salvamento' | 'aph', string[]> = {
  incendio: ['Fogo em vegetação', 'Fogo em vegetação', 'Incêndio em rede elétrica', 'Vazamento de GLP'],
  salvamento: ['Captura de ofídio', 'Captura de animal', 'Avaliação de árvore', 'Animal silvestre'],
  aph: ['Emergência clínica', 'Sinistro de trânsito', 'Emergência clínica', 'Queda', 'Convulsão', 'Emergência clínica'],
}

/** Ocorrências variadas e determinísticas (sem sorteio) para o painel ter o que mostrar. */
function ocorrenciasDemo(k: number): Parte['itens']['ocorrencias'] {
  const num = (base: number, j: number) => String(900000 + k * 12 + base + j)
  const pega = (g: 'incendio' | 'salvamento' | 'aph', j: number) => NATUREZAS_DEMO[g][(k + j) % NATUREZAS_DEMO[g].length]
  return {
    incendio: k % 3 === 0 ? [] : [{ numeros: [num(1, 0)], natureza: pega('incendio', 0) }],
    salvamento: k % 2 === 0 ? [{ numeros: [num(4, 0)], natureza: pega('salvamento', 0) }] : [],
    aph: [
      { numeros: [num(7, 0), num(8, 0)].slice(0, 1 + (k % 2)), natureza: pega('aph', 0) },
      ...(k % 3 !== 1 ? [{ numeros: [num(10, 0)], natureza: pega('aph', 1) }] : []),
    ],
  }
}

/** Participação variada: abastecimentos, permutas, avaria e deslocamentos. */
function participacaoDemo(k: number): Parte['itens']['participacao'] {
  const vtrs = ['UR-119', 'AR-129', 'ABT-42', 'ARL-51', 'AR-145']
  const lista: Parte['itens']['participacao'] = []
  if (k % 2 === 0) {
    const litros = 38 + ((k * 7) % 22) + 0.5
    lista.push({ tipo: 'abastecimentoVtr', vtr: vtrs[k % vtrs.length], litros, combustivel: 'diesel S10', valor: Math.round(litros * 6.39 * 100) / 100, km: 12000 + k * 213, saldo: 900 - k * 40 })
  }
  if (k % 3 === 0) lista.push({ tipo: 'permuta', entra: lima, sai: prado })
  if (k % 4 === 1) lista.push({ tipo: 'avaria', informante: moura, objeto: k % 8 === 1 ? 'o ar-condicionado do alojamento' : 'a motosserra do almoxarifado', descricao: 'apresentou defeito e foi encaminhado(a) para manutenção' })
  if (k % 5 === 2) lista.push({ tipo: 'deslocamento', vtr: 'AR-145', municipio: 'Anapu', militares: [vieira, cunha], missao: 'Defesa Civil', saida: '07:40' })
  if (lista.length === 0) lista.push({ tipo: 'pernoite', quem: 'equipe de apoio da Defesa Civil estadual' })
  return lista
}

/**
 * Partes 191 a 200 para a demonstração: a nova Parte (nº 201) já nasce encadeada com a 200
 * e o painel do oficial tem histórico para mostrar.
 */
export function historicoDemo(): Parte[] {
  const partes: Parte[] = []
  let seguinte = parteExemplo
  for (let numero = 200; numero >= 191; numero--) {
    const k = numero - 191 // 0..9
    const idx = numero - 190 // posição em AUTORES_DEMO
    const dia = 13 - (200 - numero)
    const p = anteriorDe(seguinte, {
      numero, dataServico: `2026-10-${String(dia).padStart(2, '0')}`,
      autor: AUTORES_DEMO[idx], antecessor: AUTORES_DEMO[idx - 1], sucessor: AUTORES_DEMO[idx + 1] ?? albuquerque,
      consumo: CONSUMO_DEMO[k], kmBase: 8 + (k % 5) * 3,
      participacao: participacaoDemo(k), ocorrencias: ocorrenciasDemo(k),
    })
    const padrao = parteExemplo.itens.juntada.slice(0, 3)
    const permutas = p.itens.participacao.filter((a) => a.tipo === 'permuta').length
    const notas = p.itens.participacao.filter((a) => a.tipo === 'abastecimentoVtr').length
    const aph = p.itens.ocorrencias.aph.reduce((s, r) => s + r.numeros.length, 0)
    p.itens.juntada = [
      ...padrao,
      ...(permutas ? [{ quantidade: permutas, genero: 'F' as const, descricao: permutas === 1 ? 'Permuta' : 'Permutas' }] : []),
      ...(notas ? [{ quantidade: notas, genero: 'F' as const, descricao: notas === 1 ? 'Nota fiscal de abastecimento' : 'Notas fiscais de abastecimento' }] : []),
      ...(aph ? [{ quantidade: aph, genero: 'F' as const, descricao: aph === 1 ? 'Ficha de APH' : 'Fichas de APH' }] : []),
    ]
    partes.unshift(p)
    seguinte = p
  }
  return partes
}
