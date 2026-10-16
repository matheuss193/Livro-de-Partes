/**
 * Regras de validação (docs/ESPECIFICACAO.md, seção 4).
 * Regra de ouro: validar AVISA, nunca corrige sozinho um dado oficial.
 */
import { consumoEnergia, letraAlinea } from './textos'
import type { Alinea, Aviso, Parte } from './tipos'

export interface ConfigValidacao {
  /** Faixa usual de consumo diário de energia (configurável). */
  faixaEnergia: { min: number; max: number }
  /** Km rodado acima do qual uma VTR sem deslocamento/ocorrência gera aviso leve. */
  kmAltoSemRegistro: number
}

export const CONFIG_PADRAO: ConfigValidacao = { faixaEnergia: { min: 0, max: 20 }, kmAltoSemRegistro: 100 }

export function validarEnergia(
  energia: { recebi: number; passei: number },
  anterior: { passei: number } | undefined,
  cfg: ConfigValidacao = CONFIG_PADRAO,
): Aviso[] {
  const avisos: Aviso[] = []
  if (energia.passei < energia.recebi) {
    avisos.push({ codigo: 'energia-passei-menor', gravidade: 'bloqueia', mensagem: 'Energia: a leitura "Passei" não pode ser menor que "Recebi".' })
    return avisos
  }
  if (anterior && anterior.passei !== energia.recebi) {
    avisos.push({ codigo: 'energia-continuidade', gravidade: 'aviso', mensagem: `Energia: "Recebi" (${energia.recebi}) é diferente do "Passei" da Parte anterior (${anterior.passei}).` })
  }
  const consumo = consumoEnergia(energia.recebi, energia.passei)
  if (consumo < cfg.faixaEnergia.min || consumo > cfg.faixaEnergia.max) {
    avisos.push({ codigo: 'energia-faixa', gravidade: 'aviso', mensagem: `Energia: consumo de ${consumo} fora da faixa usual (${cfg.faixaEnergia.min} a ${cfg.faixaEnergia.max}).` })
  }
  return avisos
}

export function validarCombustivel(parte: Parte, anterior: Parte | undefined, cfg: ConfigValidacao = CONFIG_PADRAO): Aviso[] {
  const avisos: Aviso[] = []
  const deslocadas = new Set<string>()
  for (const a of parte.itens.participacao) {
    if (a.tipo === 'deslocamento') deslocadas.add(a.vtr)
  }
  for (const l of parte.itens.combustivel) {
    if (l.recebiKm !== null && l.passeiKm !== null) {
      if (l.passeiKm < l.recebiKm) {
        avisos.push({ codigo: 'km-menor', gravidade: 'forte', mensagem: `${l.vtr}: Km "Passei" (${l.passeiKm}) menor que "Recebi" (${l.recebiKm}). Confirme antes de encerrar.` })
      } else if (l.passeiKm - l.recebiKm > cfg.kmAltoSemRegistro && !deslocadas.has(l.vtr)) {
        avisos.push({ codigo: 'km-alto-sem-registro', gravidade: 'leve', mensagem: `${l.vtr}: ${l.passeiKm - l.recebiKm} km rodados sem deslocamento registrado na Participação.` })
      }
    }
    const ant = anterior?.itens.combustivel.find((x) => x.vtr === l.vtr)
    if (ant && (ant.passeiKm !== l.recebiKm || ant.passeiNivel !== l.recebiNivel)) {
      avisos.push({ codigo: 'combustivel-continuidade', gravidade: 'aviso', mensagem: `${l.vtr}: "Recebi" difere do "Passei" da Parte anterior.` })
    }
  }
  return avisos
}

export function validarNumeracao(numero: number, anterior: number | undefined, jaUsados: number[]): Aviso[] {
  if (jaUsados.includes(numero)) {
    return [{ codigo: 'numero-duplicado', gravidade: 'bloqueia', mensagem: `Já existe a Parte nº ${numero} nesta unidade neste ano.` }]
  }
  if (anterior !== undefined && numero !== anterior + 1) {
    return [{ codigo: 'numero-sequencia', gravidade: 'aviso', mensagem: `Numeração: esperado nº ${anterior + 1}, informado nº ${numero}.` }]
  }
  return []
}

export function validarContinuidadePessoas(parte: Parte, anterior: Parte | undefined): Aviso[] {
  const antecessor = parte.itens.recebimento.antecessor
  if (anterior && antecessor && anterior.autor.id !== antecessor.id) {
    return [{ codigo: 'antecessor-diferente', gravidade: 'aviso', mensagem: 'O antecessor informado não é o autor da Parte anterior.' }]
  }
  return []
}

/** Confere permutas e notas de abastecimento citadas na Participação com a Juntada. */
export function validarJuntada(parte: Parte): Aviso[] {
  const avisos: Aviso[] = []
  const permutas = parte.itens.participacao.filter((a) => a.tipo === 'permuta').length
  const abast = parte.itens.participacao.filter((a) => a.tipo === 'abastecimentoVtr' || a.tipo === 'abastecimentoEquip').length
  const conta = (trecho: string) =>
    parte.itens.juntada.filter((j) => j.descricao.toLowerCase().includes(trecho)).reduce((s, j) => s + j.quantidade, 0)
  if (conta('permuta') !== permutas) {
    avisos.push({ codigo: 'juntada-permutas', gravidade: 'aviso', mensagem: `Participação cita ${permutas} permuta(s), mas a Juntada tem ${conta('permuta')}.` })
  }
  if (conta('abastecimento') !== abast) {
    avisos.push({ codigo: 'juntada-abastecimentos', gravidade: 'aviso', mensagem: `Participação cita ${abast} abastecimento(s), mas a Juntada tem ${conta('abastecimento')} nota(s).` })
  }
  return avisos
}

const vazio = (t: string) => t.trim() === ''

function alineaIncompleta(a: Alinea): boolean {
  switch (a.tipo) {
    case 'permuta': return !a.entra || !a.sai
    case 'substituicao': return !a.entra || !a.sai || vazio(a.determinacao)
    case 'abastecimentoVtr': return vazio(a.vtr) || vazio(a.combustivel) || !(a.litros > 0) || !(a.valor > 0)
    case 'abastecimentoEquip': return vazio(a.cartao) || vazio(a.combustivel) || !(a.litros > 0) || !(a.valor > 0)
    case 'deslocamento': return vazio(a.vtr) || vazio(a.municipio) || vazio(a.missao) || vazio(a.saida) || a.militares.length === 0
    case 'pernoite': return vazio(a.quem)
    case 'avaria': return !a.informante || vazio(a.vtr) || vazio(a.descricao)
    case 'recebimentoMaterial': return vazio(a.descricao) || vazio(a.local)
    case 'livre': return vazio(a.texto)
  }
}

/** Campos obrigatórios dos itens I a X: bloqueiam o encerramento. */
export function validarObrigatorios(parte: Parte): Aviso[] {
  const it = parte.itens
  const faltas: string[] = []
  if (!it.recebimento.antecessor) faltas.push('Item I: informe o antecessor.')
  if (!it.passagem.sucessor) faltas.push('Item X: informe o sucessor.')
  if (!(it.energia.recebi > 0) || !(it.energia.passei > 0)) faltas.push('Item III: informe as leituras de energia (Recebi e Passei).')
  for (const l of it.combustivel) {
    const faltando = [
      l.recebiNivel !== '—' && l.recebiKm === null ? '"Recebi"' : '',
      l.passeiNivel !== '—' && l.passeiKm === null ? '"Passei"' : '',
    ].filter(Boolean)
    if (faltando.length) faltas.push(`Item VI: ${l.vtr}, informe o Km ${faltando.join(' e ')}.`)
  }
  it.participacao.forEach((a, i) => {
    if (alineaIncompleta(a)) faltas.push(`Item VII, alínea ${letraAlinea(i)}: preencha todos os campos.`)
  })
  return faltas.map((mensagem, i) => ({ codigo: `obrigatorio-${i}`, gravidade: 'bloqueia' as const, mensagem }))
}

export interface ContextoValidacao {
  anterior?: Parte
  numerosUsados?: number[]
  config?: ConfigValidacao
}

export function validarParte(parte: Parte, ctx: ContextoValidacao = {}): Aviso[] {
  const cfg = ctx.config ?? CONFIG_PADRAO
  return [
    ...validarObrigatorios(parte),
    ...validarNumeracao(parte.numero, ctx.anterior?.numero, ctx.numerosUsados ?? []),
    ...validarEnergia(parte.itens.energia, ctx.anterior ? { passei: ctx.anterior.itens.energia.passei } : undefined, cfg),
    ...validarCombustivel(parte, ctx.anterior, cfg),
    ...validarContinuidadePessoas(parte, ctx.anterior),
    ...validarJuntada(parte),
  ]
}

export const podeEncerrar = (avisos: Aviso[]): boolean => !avisos.some((a) => a.gravidade === 'bloqueia')
