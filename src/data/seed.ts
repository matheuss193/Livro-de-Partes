/** Dados FICTÍCIOS iniciais do protótipo (nada real). Fonte: docs/EXEMPLO_PARTE.md. */
import * as ex from '../domain/exemplo'
import type { Equipamento, ItemDocumentoPadrao, Natureza, Viatura } from './repositorio'

export const militaresSeed = ex.militaresDemo

/** Siglas conforme o livro; significado e combustível A CONFIRMAR com o comando. */
const PREFIXOS = ['ABT-42', 'ABTF-14', 'AT-12', 'ATT-02', 'UR-119', 'AR-129', 'AR-145', 'AR-146', 'ARL-51', 'AFR-19', 'APS-96', 'APSL-17']

/**
 * Km da última revisão (FICTÍCIO), escolhido para a demonstração: ATT-02 e APS-96 estão perto de vencer a
 * revisão (intervalo de 10.000 Km). O intervalo real por viatura é A CONFIRMAR com o comando.
 */
const ULTIMA_REVISAO_KM: Record<string, number> = {
  'ABT-42': 5000, 'ABTF-14': 0, 'AT-12': 45000, 'ATT-02': 58200, 'UR-119': 5000, 'AR-129': 40000,
  'AR-145': 15000, 'AR-146': 0, 'ARL-51': 60000, 'AFR-19': 20000, 'APS-96': 70500, 'APSL-17': 10000,
}

export const viaturasSeed: Viatura[] = PREFIXOS.map((prefixo, i) => ({
  id: `v${i + 1}`, prefixo, tipo: '', combustivel: 'diesel S10', ordem: i + 1, ativa: true,
  intervaloRevisaoKm: 10000, ultimaRevisaoKm: ULTIMA_REVISAO_KM[prefixo],
}))

export const equipamentosSeed: Equipamento[] = ex.comunicacaoPadrao.map((e, i) => ({
  id: `e${i + 1}`, descricao: e.descricao, genero: e.genero, quantidadePadrao: e.quantidade, ordem: i + 1,
}))

export const documentosPadraoSeed: ItemDocumentoPadrao[] = [
  { id: 'd1', descricao: 'Mapa de Comunicação e Ronda', genero: 'M', quantidadePadrao: 1 },
  { id: 'd2', descricao: 'Controle de Saída e Entrada de Viaturas', genero: 'M', quantidadePadrao: 1 },
  { id: 'd3', descricao: 'Controle de Entrada e Saída de Civis e Militares', genero: 'M', quantidadePadrao: 1 },
]

const nat = (grupo: Natureza['grupo'], lista: string[]): Natureza[] =>
  lista.map((descricao, i) => ({ id: `${grupo}-${i + 1}`, grupo, descricao }))

export const naturezasSeed: Natureza[] = [
  ...nat('incendio', ['Fogo em vegetação', 'Incêndio em rede elétrica', 'Incêndio em edificação', 'Vazamento de GLP']),
  ...nat('salvamento', ['Captura de animal', 'Captura de ofídio', 'Animal silvestre', 'Avaliação de árvore']),
  ...nat('aph', [
    'Sinistro de trânsito', 'Emergência clínica', 'Emergência obstétrica', 'Paciente psiquiátrico', 'Agressão física',
    'Ferimento por arma branca', 'Queda', 'Convulsão', 'PCR', 'Óbito', 'Apoio à PM', 'Apoio a militar',
    'Prevenção', 'Instrução', 'Missão de Defesa Civil',
  ]),
]
