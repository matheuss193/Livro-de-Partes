import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { albuquerque, andrade, parteExemplo } from '../domain/exemplo'
import { LocalRepo } from './localRepo'

let n = 0
let repo: LocalRepo
beforeEach(() => {
  repo = new LocalRepo(`teste-${++n}`)
})

describe('LocalRepo', () => {
  it('semeia os cadastros fictícios', async () => {
    expect((await repo.listarViaturas()).map((v) => v.prefixo)[0]).toBe('ABT-42')
    expect((await repo.listarViaturas()).length).toBe(12)
    expect((await repo.obterUnidade()).cidade).toBe('Altamira-PA')
  })

  it('salva rascunho, atualiza e bloqueia número duplicado', async () => {
    const a = await repo.salvarRascunho(parteExemplo)
    const a2 = await repo.salvarRascunho({ ...parteExemplo, itens: { ...parteExemplo.itens, energia: { recebi: 1, passei: 2 } } }, a.id)
    expect(a2.id).toBe(a.id)
    expect((await repo.listarPartes()).length).toBe(3) // 199 e 200 de demonstração + o rascunho
    await expect(repo.salvarRascunho(parteExemplo)).rejects.toThrow(/Já existe a Parte nº 201/)
  })

  it('encerrar congela: gera hash e impede nova edição', async () => {
    const r = await repo.salvarRascunho(parteExemplo)
    const e = await repo.encerrar(r.id, 'Albuquerque')
    expect(e.status).toBe('encerrada')
    expect(e.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(e.textoFinal).toContain('Parte nº 201 de 14 de outubro de 2026')
    await expect(repo.salvarRascunho(parteExemplo, r.id)).rejects.toThrow(/encerrada/)
    await expect(repo.encerrar(r.id, 'x')).rejects.toThrow()
    expect((await repo.ultimaEncerrada())?.id).toBe(r.id)
  })

  it('retificação é anexada e o original fica intacto', async () => {
    const r = await repo.salvarRascunho(parteExemplo)
    const e = await repo.encerrar(r.id, 'Albuquerque')
    await expect(repo.adicionarRetificacao(r.id, { tipo: 'errata', item: 'VII', leiaSe: 'x', motivo: 'y', autor: 'A' })).resolves.toBeTruthy()
    const depois = (await repo.obterParte(r.id))!
    expect(depois.retificacoes).toHaveLength(1)
    expect(depois.retificacoes[0].hash).toMatch(/^[0-9a-f]{64}$/)
    expect(depois.hash).toBe(e.hash)
    expect(depois.textoFinal).toBe(e.textoFinal)
    expect(depois.parte).toEqual(e.parte)
  })

  it('demonstração já traz as Partes 199 (vistada) e 200 (aguarda visto), encadeadas', async () => {
    const todas = await repo.listarPartes()
    expect(todas.map((p) => [p.numero, p.status])).toEqual([[200, 'encerrada'], [199, 'vistada']])
    const p200 = todas[0].parte
    expect(parteExemplo.itens.energia.recebi).toBe(p200.itens.energia.passei)
    expect(parteExemplo.itens.combustivel[0].recebiKm).toBe(p200.itens.combustivel[0].passeiKm)
  })

  it('só oficial dá o visto; o conteúdo original não muda', async () => {
    const [p200] = await repo.listarPartes()
    await expect(repo.vistar(p200.id, albuquerque, { alineas: {} })).rejects.toThrow(/oficial/)
    const v = await repo.vistar(p200.id, andrade, { despacho: 'Ciente.', alineas: { a: { ciente: true } } })
    expect(v.status).toBe('vistada')
    expect(v.visto?.oficial).toBe('1º TEN QOBM Andrade')
    expect(v.hash).toBe(p200.hash)
    expect(v.textoFinal).toBe(p200.textoFinal)
    await expect(repo.vistar(p200.id, andrade, { alineas: {} })).rejects.toThrow(/já foi vistada/)
  })

  it('oficial solicita retificação sem editar a Parte', async () => {
    const [p200] = await repo.listarPartes()
    const s = await repo.solicitarRetificacao(p200.id, andrade, 'Conferir o Km da ABT-42.')
    expect(s.solicitacoes).toHaveLength(1)
    expect(s.parte).toEqual(p200.parte)
    await expect(repo.solicitarRetificacao(p200.id, albuquerque, 'x')).rejects.toThrow(/oficial/)
  })

  it('reiniciar demonstração volta ao estado inicial', async () => {
    await repo.salvarRascunho(parteExemplo)
    await repo.reiniciarDemonstracao()
    expect((await repo.listarPartes()).map((p) => p.numero)).toEqual([200, 199])
  })

  it('rascunho não pode ser retificado e tudo é auditado', async () => {
    const r = await repo.salvarRascunho(parteExemplo)
    await expect(repo.adicionarRetificacao(r.id, { tipo: 'adendo', item: 'I', leiaSe: 'x', motivo: 'y', autor: 'A' })).rejects.toThrow()
    await repo.encerrar(r.id, 'Albuquerque')
    expect((await repo.listarAuditoria(r.id)).map((a) => a.acao)).toEqual(['criou-rascunho', 'encerrou'])
  })
})
