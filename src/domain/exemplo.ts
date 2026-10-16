/** Dados FICTÍCIOS de demonstração, reproduzindo docs/EXEMPLO_PARTE.md. Nenhum dado real. */
import type { Equipe, ItemQuantificado, LinhaCombustivel, Militar, Parte, Unidade } from './tipos'

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

// --- Mais militares FICTÍCIOS, para completar quatro equipes de escala (nomes inventados) ---
const sgt = (id: string, g: string, completo: string, f: 'M' | 'F' = 'M') => m(id, '3º SGT', 'QBM', g, f, completo)
const cb = (id: string, g: string, completo: string, f: 'M' | 'F' = 'M') => m(id, 'CB', 'BM', g, f, completo)
const sd = (id: string, g: string, completo: string, f: 'M' | 'F' = 'M') => m(id, 'SD', 'BM', g, f, completo)

const cavalcante = sgt('m16', 'Cavalcante', 'Paulo Henrique Cavalcante Lins')
const nascimento = sgt('m17', 'Nascimento', 'Rodrigo Alves Nascimento')
const tavares = cb('m18', 'Tavares', 'Carlos Eduardo Tavares')
const pinheiro = sd('m19', 'Pinheiro', 'Lucas Pinheiro Matos')
const siqueira = sd('m20', 'Siqueira', 'Davi Siqueira Costa')
const valadares = sd('m21', 'Valadares', 'Pedro Valadares Reis')
const quintela = sd('m22', 'Quintela', 'Mateus Quintela Bastos')
const barros = sgt('m23', 'Barros', 'Fernando Barros Pires')
const dutra = sgt('m24', 'Dutra', 'André Dutra Lopes')
const esteves = cb('m25', 'Esteves', 'Gustavo Esteves Prado Filho')
const fontes = sd('m26', 'Fontes', 'Juliana Fontes Araújo', 'F')
const gusmao = sd('m27', 'Gusmão', 'Bruno Gusmão Teles')
const holanda = sd('m28', 'Holanda', 'Rafael Holanda Neri')
const ibiapina = sd('m29', 'Ibiapina', 'Camila Ibiapina Souza', 'F')
const jordao = sgt('m30', 'Jordão', 'Thiago Jordão Marques')
const klein = sgt('m31', 'Klein', 'Marcelo Klein Duarte')
const lacerda = cb('m32', 'Lacerda', 'Eduardo Lacerda Viana')
const medeiros = sd('m33', 'Medeiros', 'Renata Medeiros Campos', 'F')
const neves = sd('m34', 'Neves', 'Vitor Neves Ramos')
const otero = sd('m35', 'Otero', 'Henrique Otero Dias')
const paiva = sd('m36', 'Paiva', 'Leonardo Paiva Cunha Filho')
const queiroz = sd('m37', 'Queiroz', 'Samuel Queiroz Brito')

/** Funções da guarnição, na ordem do modelo (o Comandante do Socorro é sempre o autor). */
export const FUNCOES_GUARNICAO = [
  'Adjunto ao CMT do SOS',
  'Condutor e Operador de VTR Inc/Salv',
  'Condutor da VTR UR-119',
  'Socorristas',
  'Guarnição de Incêndio',
  'Guarnição de Salvamento',
]

const equipe = (nome: string, cmt: Militar, adj: Militar, cond: Militar, ur: Militar, soc: Militar[], inc: Militar[], salv: Militar[]): Equipe => ({
  nome,
  comandante: cmt,
  guarnicao: [[adj], [cond], [ur], soc, inc, salv].map((militares, i) => ({ funcao: FUNCOES_GUARNICAO[i], militares })),
})

/**
 * Escala fictícia de demonstração: quatro equipes em rodízio de 24 h (Equipe 1, 2, 3, 4, 1...).
 * A equipe 2 é a do exemplo oficial (Albuquerque, com Teixeira antes dela e Rangel depois).
 */
export const EQUIPES_DEMO: Equipe[] = [
  equipe('Equipe 1', teixeira, cavalcante, nascimento, tavares, [rezende, pinheiro], [siqueira, valadares], [quintela]),
  equipe('Equipe 2', albuquerque, pacheco, moura, brandao, [lima, prado], [nogueira, castro], [farias]),
  equipe('Equipe 3', rangel, barros, dutra, esteves, [cunha, fontes], [gusmao, holanda], [ibiapina]),
  equipe('Equipe 4', vieira, jordao, klein, lacerda, [medeiros, neves], [otero, paiva], [queiroz]),
]

/** Todos os militares fictícios da demonstração (os 4 Comandantes de Socorro, as guarnições e o oficial). */
export const militaresDemo: Militar[] = [
  ...EQUIPES_DEMO.flatMap((e) => [e.comandante, ...e.guarnicao.flatMap((f) => f.militares)]),
  andrade,
  // sem equipe fixa no rodízio, mas usados nos exemplos:
]

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
        const rodou = i % 4 === 3 ? 0 : o.kmBase + i * 2
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

/**
 * Autores dos serviços 190 a 200, em rodízio das equipes (Teixeira, Albuquerque, Rangel, Vieira):
 * o 200 é de Teixeira e o 201 (a Parte nova) é de Albuquerque, como no exemplo oficial.
 */
const AUTORES_DEMO: Militar[] = [rangel, vieira, teixeira, albuquerque, rangel, vieira, teixeira, albuquerque, rangel, vieira, teixeira]
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

/** Participação variada (sem os abastecimentos, que dependem dos Km e são gerados depois). */
function participacaoDemo(k: number): Parte['itens']['participacao'] {
  const lista: Parte['itens']['participacao'] = []
  if (k % 3 === 0) lista.push({ tipo: 'permuta', entra: lima, sai: prado })
  if (k % 4 === 1) lista.push({ tipo: 'avaria', informante: moura, objeto: k % 8 === 1 ? 'o ar-condicionado do alojamento' : 'a motosserra do almoxarifado', descricao: 'apresentou defeito e foi encaminhado(a) para manutenção' })
  if (k % 5 === 2) lista.push({ tipo: 'deslocamento', vtr: 'AR-145', municipio: 'Anapu', militares: [vieira, cunha], missao: 'Defesa Civil', saida: '07:40' })
  if (k === 3) lista.push({ tipo: 'visita', quem: 'equipe da Defesa Civil estadual', hora: '09:15', motivo: 'para conhecer as instalações' })
  if (k === 5) lista.push({ tipo: 'estrutura', objeto: 'falta de energia elétrica', inicio: '14:10', fim: '15:00', providencia: 'acionado o gerador do quartel' })
  if (k === 4) lista.push({ tipo: 'revisao', vtr: 'AR-129', km: 0, descricao: 'troca de óleo e filtros' }) // o Km é preenchido depois
  if (lista.length === 0) lista.push({ tipo: 'rotina', parada: true, bandeira: 'hasteamento', rolagem: true, alarme: true, horaAlarme: '07:30', observacao: '' })
  return lista
}

/** Consumo de cada viatura (L/100 Km) e dia (índice k) de cada abastecimento: três VTR, uma por dia, em rodízio. */
const CONSUMO_VTR: Record<string, number> = { 'UR-119': 14, 'AR-129': 32, 'ABT-42': 38 }
const ABASTECE: Record<number, string> = { 0: 'UR-119', 1: 'AR-129', 2: 'ABT-42', 3: 'UR-119', 4: 'AR-129', 5: 'ABT-42', 6: 'UR-119', 7: 'AR-129', 8: 'ABT-42', 9: 'UR-119' }
const ANOMALIA_K = 7 // o último abastecimento da AR-129 consome 50% a mais (para o alerta do painel)

/** Gera os abastecimentos de cada Parte com Km e litros coerentes com os Km rodados entre um abastecimento e o seguinte. */
function aplicarAbastecimentos(partes: Parte[]): void {
  const ultimoKm: Record<string, number> = {}
  partes.forEach((p, k) => {
    const vtr = ABASTECE[k]
    const km = p.itens.combustivel.find((l) => l.vtr === vtr)?.passeiKm ?? 0
    const anterior = ultimoKm[vtr]
    let litros = 40.5 // primeiro abastecimento conhecido da VTR: sem Km de referência
    if (anterior !== undefined && km > anterior) {
      litros = ((km - anterior) * CONSUMO_VTR[vtr]) / 100
      if (k === ANOMALIA_K) litros *= 1.5
    }
    litros = Math.round(litros * 2) / 2 // meio litro
    ultimoKm[vtr] = km
    p.itens.participacao = [
      { tipo: 'abastecimentoVtr', vtr, litros, combustivel: 'diesel S10', valor: Math.round(litros * 6.39 * 100) / 100, km, saldo: 900 - k * 55 },
      ...p.itens.participacao,
    ]
    for (const a of p.itens.participacao) if (a.tipo === 'revisao') a.km = p.itens.combustivel.find((l) => l.vtr === a.vtr)?.passeiKm ?? a.km
  })
}

/** Guarnição de cada Parte = a equipe do seu Comandante do Socorro. */
function guarnicaoDe(autor: Militar) {
  const e = EQUIPES_DEMO.find((x) => x.comandante.id === autor.id)
  return e ? e.guarnicao.map((f) => ({ funcao: f.funcao, militares: [...f.militares] })) : parteExemplo.itens.guarnicao
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
      consumo: CONSUMO_DEMO[k], kmBase: 25 + (k % 5) * 8,
      participacao: participacaoDemo(k), ocorrencias: ocorrenciasDemo(k),
    })
    p.itens.guarnicao = guarnicaoDe(p.autor)
    partes.unshift(p)
    seguinte = p
  }
  aplicarAbastecimentos(partes)
  for (const p of partes) {
    const padrao = parteExemplo.itens.juntada.slice(0, 3)
    const permutas = p.itens.participacao.filter((a) => a.tipo === 'permuta').length
    const notas = p.itens.participacao.filter((a) => a.tipo === 'abastecimentoVtr').length
    const aph = p.itens.ocorrencias.aph.reduce((s2, r) => s2 + r.numeros.length, 0)
    p.itens.juntada = [
      ...padrao,
      ...(permutas ? [{ quantidade: permutas, genero: 'F' as const, descricao: permutas === 1 ? 'Permuta' : 'Permutas' }] : []),
      ...(notas ? [{ quantidade: notas, genero: 'F' as const, descricao: notas === 1 ? 'Nota fiscal de abastecimento' : 'Notas fiscais de abastecimento' }] : []),
      ...(aph ? [{ quantidade: aph, genero: 'F' as const, descricao: aph === 1 ? 'Ficha de APH' : 'Fichas de APH' }] : []),
    ]
  }
  return partes
}
