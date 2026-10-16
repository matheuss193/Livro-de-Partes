import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { LocalRepo } from '../../data/localRepo'
import { albuquerque, parteExemplo, rangel } from '../../domain/exemplo'
import { validarParte } from '../../domain/validacoes'
import { criarParteNova } from './novaParte'
import type { Cadastros } from '../../ui/contexto'

async function cadastros(repo: LocalRepo): Promise<Cadastros> {
  const [unidade, militares, viaturas, equipamentos, documentos, naturezas] = await Promise.all([
    repo.obterUnidade(), repo.listarMilitares(), repo.listarViaturas(), repo.listarEquipamentos(), repo.listarDocumentosPadrao(), repo.listarNaturezas(),
  ])
  return { unidade, militares, viaturas, equipamentos, documentos, naturezas }
}

describe('criarParteNova', () => {
  it('sem Parte anterior: começa no nº 1, vazia e com avisos até preencher', async () => {
    const repo = new LocalRepo('np-1')
    const cad = await cadastros(repo)
    const p = criarParteNova(rangel, cad, undefined, '2026-10-15')
    expect(p.numero).toBe(1)
    expect(p.itens.combustivel).toHaveLength(12)
    expect(p.itens.comunicacao).toHaveLength(4)
    expect(validarParte(p).some((a) => a.gravidade === 'forte')).toBe(true)
  })

  it('continuidade: número +1, antecessor, energia e Km vêm da Parte anterior', async () => {
    const repo = new LocalRepo('np-2')
    const cad = await cadastros(repo)
    const g = await repo.salvarRascunho(parteExemplo)
    const encerrada = await repo.encerrar(g.id, 'Albuquerque')
    const p = criarParteNova(rangel, cad, encerrada, '2026-10-15')
    expect(p.numero).toBe(202)
    expect(p.itens.recebimento.antecessor?.id).toBe(albuquerque.id)
    expect(p.itens.energia.recebi).toBe(5127)
    const ur = p.itens.combustivel.find((l) => l.vtr === 'UR-119')!
    expect(ur).toMatchObject({ recebiNivel: '4/4', recebiKm: 13064, passeiKm: null })
  })
})
