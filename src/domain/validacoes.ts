/**
 * Regras de validação (docs/ESPECIFICACAO.md, seção 4).
 * Regra de ouro: validar AVISA, nunca corrige sozinho um dado oficial.
 */
import { consumoEnergia } from './textos'
import type { Aviso, Parte } from './tipos'

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
  if (anterior && anterior.autor.id !== parte.itens.recebimento.antecessor.id) {
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

export interface ContextoValidacao {
  anterior?: Parte
  numerosUsados?: number[]
  config?: ConfigValidacao
}

export function validarParte(parte: Parte, ctx: ContextoValidacao = {}): Aviso[] {
  const cfg = ctx.config ?? CONFIG_PADRAO
  return [
    ...validarNumeracao(parte.numero, ctx.anterior?.numero, ctx.numerosUsados ?? []),
    ...validarEnergia(parte.itens.energia, ctx.anterior ? { passei: ctx.anterior.itens.energia.passei } : undefined, cfg),
    ...validarCombustivel(parte, ctx.anterior, cfg),
    ...validarContinuidadePessoas(parte, ctx.anterior),
    ...validarJuntada(parte),
  ]
}

export const podeEncerrar = (avisos: Aviso[]): boolean => !avisos.some((a) => a.gravidade === 'bloqueia')
