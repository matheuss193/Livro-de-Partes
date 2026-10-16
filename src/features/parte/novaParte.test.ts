import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { LocalRepo } from '../../data/localRepo'
import { albuquerque, parteExemplo, rangel } from '../../domain/exemplo'
import { podeEncerrar, validarParte } from '../../domain/validacoes'
import { criarParteNova } from './novaParte'
import type { Cadastros } from '../../ui/contexto'

async function cadastros(repo: LocalRepo): Promise<Cadastros> {
  const [unidade, militares, viaturas, equipamentos, documentos, naturezas, equipes] = await Promise.all([
    repo.obterUnidade(), repo.listarMilitares(), repo.listarViaturas(), repo.listarEquipamentos(), repo.listarDocumentosPadrao(), repo.listarNaturezas(), repo.obterEscala(),
  ])
  return { unidade, militares, viaturas, equipamentos, documentos, naturezas, equipes }
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

  it('Parte em branco (sem dados de viatura) pode ser encerrada: nada bloqueia e o texto sai com marcadores', async () => {
    const repo = new LocalRepo('np-3')
    const cad = await cadastros(repo)
    const p = criarParteNova(rangel, cad, undefined, '2026-10-15')
    expect(podeEncerrar(validarParte(p))).toBe(true)
    const g = await repo.salvarRascunho(p)
    const e = await repo.encerrar(g.id, 'Rangel')
    expect(e.status).toBe('encerrada')
    expect(e.textoFinal).toContain('antecessor legal, o 2º SGT QBM Albuquerque') // vindo da escala
    expect(e.textoFinal).toMatch(/ABT-42 \| 4\/4 \| — \| 4\/4 \| — \| Operante/)
  })

  it('escala: guarnição, antecessor e sucessor já vêm da equipe de serviço', async () => {
    const repo = new LocalRepo('np-4')
    const cad = await cadastros(repo)
    const p = criarParteNova(rangel, cad, undefined, '2026-10-15')
    expect(p.itens.guarnicao.map((f) => f.funcao)).toEqual(['Adjunto ao CMT do SOS', 'Condutor e Operador de VTR Inc/Salv', 'Condutor da VTR UR-119', 'Socorristas', 'Guarnição de Incêndio', 'Guarnição de Salvamento'])
    expect(p.itens.guarnicao[0].militares[0].nomeGuerra).toBe('Barros') // Equipe 3, a da Rangel
    expect(p.itens.guarnicao[3].militares.map((m) => m.nomeGuerra)).toEqual(['Cunha', 'Fontes'])
    expect(p.itens.recebimento.antecessor?.nomeGuerra).toBe('Albuquerque')
    expect(p.itens.passagem.sucessor?.nomeGuerra).toBe('Vieira')
    const doExemplo = criarParteNova(albuquerque, cad, undefined, '2026-10-14')
    expect(doExemplo.itens.guarnicao).toEqual(parteExemplo.itens.guarnicao)
    expect(doExemplo.itens.passagem.sucessor?.nomeGuerra).toBe('Rangel')
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
