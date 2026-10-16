/**
 * Modelos prontos de participação, pensados para a rotina de um quartel de bombeiros (inspirados na parada
 * diária do CBMSC, nos livros de estação de outras corporações e no uso do 9º GBM). Cada modelo já vem com
 * o que dá para adivinhar; o autor completa o resto e pode reescrever tudo no lápis.
 */
import type { Alinea } from './tipos'

export type CategoriaModelo = 'Rotina' | 'Pessoal' | 'Viaturas e material' | 'Quartel' | 'Operações e apoio' | 'Documentos'

export const CATEGORIAS_MODELO: CategoriaModelo[] = ['Rotina', 'Pessoal', 'Viaturas e material', 'Quartel', 'Operações e apoio', 'Documentos']

export interface ModeloParticipacao {
  id: string
  categoria: CategoriaModelo
  titulo: string
  alinea: Alinea
}

const rotina = (p: Partial<Extract<Alinea, { tipo: 'rotina' }>>): Alinea => ({
  tipo: 'rotina', parada: false, bandeira: '', rolagem: false, alarme: false, horaAlarme: '', observacao: '', ...p,
})
const efetivo = (situacao: Extract<Alinea, { tipo: 'efetivo' }>['situacao']): Alinea => ({ tipo: 'efetivo', militar: null, situacao, hora: '', motivo: '' })
const estrutura = (objeto: string, providencia = ''): Alinea => ({ tipo: 'estrutura', objeto, inicio: '', fim: '', providencia })
const ordem = (documento: string): Alinea => ({ tipo: 'ordem', documento, numero: '', origem: '', assunto: '' })

export const MODELOS: ModeloParticipacao[] = [
  // Rotina
  { id: 'parada', categoria: 'Rotina', titulo: 'Parada diária completa', alinea: rotina({ parada: true, bandeira: 'hasteamento', rolagem: true, alarme: true, horaAlarme: '07:30' }) },
  { id: 'verifica-ok', categoria: 'Rotina', titulo: 'Verificação de material e viaturas, sem alteração', alinea: { tipo: 'verificacao', alteracoes: '' } },
  { id: 'verifica-alt', categoria: 'Rotina', titulo: 'Verificação com alteração', alinea: { tipo: 'verificacao', alteracoes: '[descreva a alteração]' } },
  { id: 'alarme', categoria: 'Rotina', titulo: 'Teste de alarme', alinea: rotina({ alarme: true }) },
  { id: 'arriamento', categoria: 'Rotina', titulo: 'Arriamento da bandeira', alinea: rotina({ bandeira: 'arriamento' }) },

  // Pessoal
  { id: 'permuta', categoria: 'Pessoal', titulo: 'Permuta de serviço', alinea: { tipo: 'permuta', entra: null, sai: null } },
  { id: 'substituicao', categoria: 'Pessoal', titulo: 'Substituição por determinação', alinea: { tipo: 'substituicao', entra: null, sai: null, determinacao: '' } },
  { id: 'faltou', categoria: 'Pessoal', titulo: 'Militar não compareceu', alinea: efetivo('faltou') },
  { id: 'atrasou', categoria: 'Pessoal', titulo: 'Militar com atraso', alinea: efetivo('atrasou') },
  { id: 'atestado', categoria: 'Pessoal', titulo: 'Militar com atestado médico', alinea: efetivo('atestado') },
  { id: 'dispensado', categoria: 'Pessoal', titulo: 'Militar dispensado do serviço', alinea: efetivo('dispensado') },
  { id: 'liberado', categoria: 'Pessoal', titulo: 'Militar liberado durante o serviço', alinea: efetivo('liberado') },
  { id: 'apresentou', categoria: 'Pessoal', titulo: 'Militar apresentou-se / retornou', alinea: efetivo('apresentou') },
  { id: 'saude', categoria: 'Pessoal', titulo: 'Saúde de militar (mal súbito, acidente em serviço)', alinea: { tipo: 'saudeMilitar', militar: null, ocorrido: '', providencia: '' } },

  // Viaturas e material
  { id: 'abast-vtr', categoria: 'Viaturas e material', titulo: 'Abastecimento de viatura', alinea: { tipo: 'abastecimentoVtr', vtr: '', litros: 0, combustivel: 'diesel S10', valor: 0, km: 0, saldo: 0 } },
  { id: 'abast-equip', categoria: 'Viaturas e material', titulo: 'Abastecimento de equipamentos (carote)', alinea: { tipo: 'abastecimentoEquip', litros: 0, combustivel: 'diesel S10', cartao: '', valor: 0, saldo: 0 } },
  { id: 'revisao', categoria: 'Viaturas e material', titulo: 'Revisão / manutenção preventiva de viatura', alinea: { tipo: 'revisao', vtr: '', km: 0, descricao: 'troca de óleo e filtros' } },
  { id: 'avaria-vtr', categoria: 'Viaturas e material', titulo: 'Avaria de viatura', alinea: { tipo: 'avaria', informante: null, objeto: 'a VTR ', descricao: 'apresentou defeito, tendo sido encaminhada à oficina' } },
  { id: 'avaria-equip', categoria: 'Viaturas e material', titulo: 'Avaria de equipamento (motosserra, motobomba, rádio...)', alinea: { tipo: 'avaria', informante: null, objeto: 'a motosserra', descricao: 'apresentou defeito e foi encaminhada para manutenção' } },
  { id: 'recebe-material', categoria: 'Viaturas e material', titulo: 'Recebimento de material', alinea: { tipo: 'recebimentoMaterial', descricao: '', local: 'almoxarifado' } },

  // Quartel
  { id: 'energia', categoria: 'Quartel', titulo: 'Falta de energia elétrica', alinea: estrutura('falta de energia elétrica', 'acionado o gerador') },
  { id: 'agua', categoria: 'Quartel', titulo: 'Falta de água', alinea: estrutura('falta de água', 'acionada a concessionária') },
  { id: 'internet', categoria: 'Quartel', titulo: 'Queda de internet', alinea: estrutura('queda do sinal de internet') },
  { id: 'radio', categoria: 'Quartel', titulo: 'Falha no sistema de rádio', alinea: estrutura('falha no sistema de rádio', 'utilizado o telefone como meio alternativo') },
  { id: 'avaria-quartel', categoria: 'Quartel', titulo: 'Avaria nas instalações (ar-condicionado, hidráulica, cozinha)', alinea: { tipo: 'avaria', informante: null, objeto: 'o ar-condicionado do alojamento', descricao: 'apresentou defeito' } },
  { id: 'visita', categoria: 'Quartel', titulo: 'Visita à Unidade', alinea: { tipo: 'visita', quem: '', hora: '', motivo: '' } },
  { id: 'instrucao', categoria: 'Quartel', titulo: 'Instrução / treinamento', alinea: { tipo: 'instrucao', tema: '', inicio: '', fim: '', participantes: 'toda a guarnição' } },
  { id: 'pernoite', categoria: 'Quartel', titulo: 'Pernoite na UBM', alinea: { tipo: 'pernoite', quem: '' } },

  // Operações e apoio
  { id: 'defesa-civil', categoria: 'Operações e apoio', titulo: 'Missão de Defesa Civil em município', alinea: { tipo: 'deslocamento', vtr: '', municipio: '', militares: [], missao: 'Defesa Civil', saida: '' } },
  { id: 'apoio', categoria: 'Operações e apoio', titulo: 'Apoio a outra instituição ou evento', alinea: { tipo: 'deslocamento', vtr: '', municipio: '', militares: [], missao: 'apoio', saida: '' } },
  { id: 'relevante', categoria: 'Operações e apoio', titulo: 'Ocorrência relevante (texto livre)', alinea: { tipo: 'livre', texto: 'Durante o serviço, ' } },

  // Documentos
  { id: 'oficio', categoria: 'Documentos', titulo: 'Ofício recebido', alinea: ordem('Ofício') },
  { id: 'memorando', categoria: 'Documentos', titulo: 'Memorando recebido', alinea: ordem('Memorando') },
  { id: 'os', categoria: 'Documentos', titulo: 'Ordem de Serviço recebida', alinea: ordem('Ordem de Serviço') },
  { id: 'boletim', categoria: 'Documentos', titulo: 'Boletim recebido', alinea: ordem('Boletim') },
]
