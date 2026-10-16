import { describe, expect, it } from 'vitest'
import type { ParteGuardada } from '../data/repositorio'
import { historicoDemo } from './exemplo'
import { calcularPainel } from './painel'

const guardadas: ParteGuardada[] = historicoDemo().map((parte, i) => ({
  id: `p${i}`, numero: parte.numero, ano: 2026, dataServico: parte.dataServico,
  status: parte.numero === 200 ? 'encerrada' : 'vistada', parte, atualizadaEm: '', retificacoes: [],
}))

describe('painel do oficial', () => {
  const p = calcularPainel(guardadas)

  it('energia: um ponto por Parte, total e média corretos', () => {
    expect(p.partes).toBe(10)
    expect(p.energia.pontos).toHaveLength(10)
    expect(p.energia.pontos[0]).toMatchObject({ numero: 191, consumo: 8 })
    expect(p.energia.total).toBe(75)
    expect(p.energia.media).toBe(7.5)
    expect(p.energia.maximo).toBe(9)
  })

  it('abastecimento: soma litros e valor e agrupa por VTR', () => {
    const soma = guardadas.flatMap((g) => g.parte.itens.participacao).reduce((s, a) => (a.tipo === 'abastecimentoVtr' ? s + a.litros : s), 0)
    expect(p.abastecimento.litros).toBeCloseTo(soma, 5)
    expect(p.abastecimento.valor).toBeGreaterThan(0)
    expect(p.abastecimento.precoMedio).toBeCloseTo(6.39, 1)
    expect(p.abastecimento.porVtr.reduce((s, l) => s + l.litros, 0)).toBeCloseTo(soma, 5)
    expect(p.abastecimento.porVtr[0].litros).toBeGreaterThanOrEqual(p.abastecimento.porVtr[p.abastecimento.porVtr.length - 1].litros)
  })

  it('ocorrências: conta cada número e ordena por quantidade', () => {
    const g = p.ocorrencias.porGrupo
    expect(g.incendio + g.salvamento + g.aph).toBe(p.ocorrencias.total)
    expect(p.ocorrencias.total).toBeGreaterThan(10)
    const qtds = p.ocorrencias.porNatureza.map((n) => n.quantidade)
    expect([...qtds].sort((a, b) => b - a)).toEqual(qtds)
    expect(p.ocorrencias.porNatureza.reduce((s, n) => s + n.quantidade, 0)).toBe(p.ocorrencias.total)
  })

  it('pendentes de visto e período', () => {
    expect(p.aguardandoVisto).toBe(1)
    expect(p.periodo).toEqual({ de: '2026-10-04', ate: '2026-10-13' })
    expect(p.pendencias?.numero).toBe(200)
  })

  it('filtra pelos últimos N dias a partir da Parte mais recente', () => {
    const q = calcularPainel(guardadas, 3)
    expect(q.energia.pontos.map((x) => x.numero)).toEqual([198, 199, 200])
  })

  it('rascunho não entra e painel vazio não quebra', () => {
    const r = calcularPainel([{ ...guardadas[0], status: 'rascunho' }])
    expect(r.partes).toBe(0)
    expect(r.energia.media).toBe(0)
    expect(r.periodo).toBeNull()
    expect(r.pendencias).toBeNull()
  })
})
