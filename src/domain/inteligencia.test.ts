import { describe, expect, it } from 'vitest'
import type { ParteGuardada } from '../data/repositorio'
import { viaturasSeed } from '../data/seed'
import { buscar, destacar, normalizar } from './busca'
import { avisosConsumo, consumoPorVtr } from './consumo'
import { EQUIPES_DEMO, historicoDemo, parteExemplo, unidadeExemplo } from './exemplo'
import { equipeAnterior, equipeDoComandante, equipeDoDia, equipeParaParte, equipeSeguinte, guarnicaoDaEquipe } from './escala'
import { avisosRevisao, statusRevisoes, type ParteDatada } from './manutencao'
import { MODELOS, CATEGORIAS_MODELO } from './modelos'
import { sugerirParticipacoes, sugestoesDeContexto } from './sugestoes'
import { gerarTextoOficial, linhaQuantificada, textoAlinea } from './textos'
import type { Parte } from './tipos'

const historico = historicoDemo()
const guardadas: ParteGuardada[] = historico.map((parte, i) => ({
  id: `p${i}`, numero: parte.numero, ano: 2026, dataServico: parte.dataServico, status: 'vistada', parte, atualizadaEm: '',
  textoFinal: gerarTextoOficial(parte, unidadeExemplo), retificacoes: [],
}))
const datadas: ParteDatada[] = guardadas.map((g) => ({ dataServico: g.dataServico, numero: g.numero, parte: g.parte }))
const atual: ParteDatada = { dataServico: parteExemplo.dataServico, numero: parteExemplo.numero, parte: parteExemplo }

describe('revisão por Km', () => {
  const status = statusRevisoes(viaturasSeed, datadas, atual)

  it('avisa as viaturas perto de vencer (faltam até 500 Km) e as demais ficam em dia', () => {
    const proximas = status.filter((s) => s.situacao === 'proxima').map((s) => s.vtr).sort()
    expect(proximas).toEqual(['APS-96', 'ATT-02'])
    expect(status.find((s) => s.vtr === 'ATT-02')).toMatchObject({ kmAtual: 68000, ultimaRevisaoKm: 58200, proximaKm: 68200, faltamKm: 200 })
    expect(status.find((s) => s.vtr === 'ABT-42')?.situacao).toBe('em-dia')
  })

  it('revisão registrada numa Parte reinicia a contagem (AR-129 foi revisada na Parte 195)', () => {
    const ar = status.find((s) => s.vtr === 'AR-129')!
    expect(ar.ultimaRevisaoKm).toBeGreaterThan(40000)
    expect(ar.situacao).toBe('em-dia')
  })

  it('registrar a revisão na Parte atual resolve o aviso; passar do Km marca vencida', () => {
    const comRevisao: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, participacao: [...parteExemplo.itens.participacao, { tipo: 'revisao', vtr: 'ATT-02', km: 68000, descricao: 'óleo' }] } }
    const s = statusRevisoes(viaturasSeed, datadas, { ...atual, parte: comRevisao })
    expect(s.find((x) => x.vtr === 'ATT-02')?.situacao).toBe('em-dia')
    const vencida = statusRevisoes([{ ...viaturasSeed[3], ultimaRevisaoKm: 50000 }], datadas, atual)
    expect(vencida[0]).toMatchObject({ situacao: 'vencida', faltamKm: -8000 })
    expect(avisosRevisao(vencida)[0].mensagem).toMatch(/vencida há 8\.000 Km/)
  })

  it('os avisos citam a viatura e o Km; sem dados não avisa', () => {
    const av = avisosRevisao(status)
    expect(av.map((a) => a.codigo).sort()).toEqual(['revisao-APS-96', 'revisao-ATT-02'])
    expect(av[0].gravidade).toBe('aviso')
    expect(statusRevisoes([{ ...viaturasSeed[0], ultimaRevisaoKm: undefined }], [], undefined)[0].situacao).toBe('sem-dados')
  })
})

describe('consumo L/100 Km', () => {
  const consumo = consumoPorVtr(datadas)

  it('calcula entre abastecimentos consecutivos e acha a viatura fora do padrão', () => {
    const alertas = consumo.filter((c) => c.alerta)
    expect(alertas.map((c) => c.vtr)).toEqual(['AR-129'])
    expect(alertas[0].desvio).toBeGreaterThan(0.4)
    expect(alertas[0].desvio).toBeLessThan(0.6)
    const ur = consumo.find((c) => c.vtr === 'UR-119')!
    expect(ur.pontos.length).toBe(4)
    expect(ur.alerta).toBe(false)
    expect(ur.ultimo).toBeGreaterThan(12)
    expect(ur.ultimo).toBeLessThan(16)
  })

  it('o aviso aparece na Parte do abastecimento anômalo e não nas outras', () => {
    const p198 = datadas.find((d) => d.numero === 198)!
    expect(avisosConsumo(datadas, p198).map((a) => a.codigo)).toEqual(['consumo-AR-129'])
    expect(avisosConsumo(datadas, datadas.find((d) => d.numero === 196)!)).toEqual([])
  })

  it('sem histórico suficiente não dá alerta', () => {
    expect(consumoPorVtr([datadas[1]]).every((c) => !c.alerta && c.ultimo === null)).toBe(true)
  })
})

describe('busca no histórico', () => {
  it('ignora acento e maiúscula e diz em que item achou', () => {
    const r = buscar(guardadas, 'OFIDIO')
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].trechos[0]).toMatchObject({ item: 'IX' })
    expect(r[0].trechos[0].texto).toMatch(/ofídio/)
    expect(normalizar('Ação — Óleo')).toBe('acao — oleo')
  })

  it('várias palavras precisam estar na mesma linha; termo curto não busca', () => {
    expect(buscar(guardadas, 'ar-condicionado alojamento').length).toBeGreaterThan(0)
    expect(buscar(guardadas, 'motosserra ofidio')).toEqual([])
    expect(buscar(guardadas, 'a')).toEqual([])
    const ordem = buscar(guardadas, 'avaria defeito').map((x) => x.dataServico)
    expect([...ordem].sort().reverse()).toEqual(ordem)
  })

  it('procura também em retificações, pedidos e despacho do visto', () => {
    const g: ParteGuardada = {
      ...guardadas[0],
      retificacoes: [{ numero: 1, tipo: 'errata', item: 'VII', ondeSeLe: 'freio', leiaSe: 'freios', motivo: 'digitação', autor: 'x', em: '', hash: 'a' }],
      visto: { oficialId: 'm15', oficial: 'x', em: '', despacho: 'Providenciar a manutenção da motosserra', alineas: {} },
    }
    expect(buscar([g], 'freios')[0].trechos[0].item).toBe('Retificação')
    expect(buscar([g], 'motosserra')[0].trechos.some((t) => t.item === 'Visto')).toBe(true)
  })

  it('destaca as palavras achadas mesmo com acento', () => {
    expect(destacar('Captura de ofídio', 'OFIDIO')).toEqual([{ texto: 'Captura de ', marcado: false }, { texto: 'ofídio', marcado: true }])
  })
})

describe('sugestões de participação', () => {
  it('sugere o que mais se repete e deixa de fora abastecimento, permuta e revisão', () => {
    const s = sugerirParticipacoes(datadas, [])
    expect(s[0]).toMatchObject({ vezes: 2 })
    expect(s[0].alinea.tipo).toBe('avaria')
    expect(s.some((x) => ['abastecimentoVtr', 'permuta', 'revisao'].includes(x.alinea.tipo))).toBe(false)
    expect(s.length).toBeLessThanOrEqual(6)
  })

  it('não repete o que já está na Parte e devolve cópia independente', () => {
    const [primeira] = sugerirParticipacoes(datadas, [])
    expect(sugerirParticipacoes(datadas, [primeira.alinea]).some((x) => x.texto === primeira.texto)).toBe(false)
    primeira.alinea.tipo === 'avaria' && (primeira.alinea.descricao = 'mudou')
    expect(sugerirParticipacoes(datadas, [])[0].alinea).not.toEqual(primeira.alinea)
  })
})

describe('escala', () => {
  it('rodízio de quatro equipes ancorado na equipe do exemplo oficial', () => {
    const e = (d: string) => equipeDoDia(EQUIPES_DEMO, d).nome
    expect(e('2026-10-14')).toBe('Equipe 2')
    expect(e('2026-10-13')).toBe('Equipe 1')
    expect(e('2026-10-15')).toBe('Equipe 3')
    expect(e('2026-10-16')).toBe('Equipe 4')
    expect(e('2026-10-17')).toBe('Equipe 1')
    expect(e('2026-10-10')).toBe('Equipe 2')
  })

  it('as Partes de demonstração seguem a escala (autor = comandante da equipe do dia)', () => {
    for (const p of historico) expect(equipeDoDia(EQUIPES_DEMO, p.dataServico).comandante.id).toBe(p.autor.id)
  })

  it('antecessor e sucessor da Equipe 2 são Teixeira e Rangel, como no exemplo oficial', () => {
    const eq = equipeDoComandante(EQUIPES_DEMO, parteExemplo.autor)!
    expect(equipeAnterior(EQUIPES_DEMO, eq).comandante.nomeGuerra).toBe('Teixeira')
    expect(equipeSeguinte(EQUIPES_DEMO, eq).comandante.nomeGuerra).toBe('Rangel')
    expect(guarnicaoDaEquipe(eq)).toEqual(parteExemplo.itens.guarnicao)
  })

  it('quem comanda uma equipe redige com a equipe dele, em qualquer data', () => {
    expect(equipeParaParte(EQUIPES_DEMO, '2026-12-25', EQUIPES_DEMO[2].comandante).nome).toBe('Equipe 3')
  })

  it('cada militar aparece em uma única equipe', () => {
    const ids = EQUIPES_DEMO.flatMap((e) => [e.comandante.id, ...e.guarnicao.flatMap((f) => f.militares.map((m) => m.id))])
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(36)
  })
})

describe('sugestões para este serviço (lêem o que já foi preenchido)', () => {
  const vazia: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, participacao: [] } }

  it('aponta viatura em oficina sem avaria e tanque que subiu sem abastecimento', () => {
    const sug = sugestoesDeContexto(vazia, EQUIPES_DEMO)
    const tipos = sug.map((x) => x.alinea.tipo)
    expect(tipos).toContain('avaria')
    expect(tipos).toContain('abastecimentoVtr')
    expect(sug.find((x) => x.alinea.tipo === 'avaria')?.motivo).toMatch(/AR-146 está em oficina/)
    const abast = sug.find((x) => x.alinea.tipo === 'abastecimentoVtr')!
    expect(abast.motivo).toMatch(/UR-119.*1\/2 para 4\/4/)
    expect(abast.alinea).toMatchObject({ vtr: 'UR-119', km: 13064 })
  })

  it('não repete o que já foi participado', () => {
    expect(sugestoesDeContexto(parteExemplo, EQUIPES_DEMO).map((x) => x.alinea.tipo)).toEqual([])
  })

  it('militar da escala fora da guarnição vira sugestão de alteração de efetivo', () => {
    const semFarias: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, guarnicao: parteExemplo.itens.guarnicao.map((f) => ({ ...f, militares: f.militares.filter((m) => m.nomeGuerra !== 'Farias') })) } }
    const sug = sugestoesDeContexto(semFarias, EQUIPES_DEMO)
    expect(sug.some((x) => x.alinea.tipo === 'efetivo' && x.alinea.militar?.nomeGuerra === 'Farias')).toBe(true)
  })
})

describe('modelos prontos e observação por item', () => {
  it('todos os modelos têm id único e geram uma frase sem quebrar', () => {
    expect(new Set(MODELOS.map((m) => m.id)).size).toBe(MODELOS.length)
    for (const m of MODELOS) expect(typeof textoAlinea(m.alinea)).toBe('string')
    expect(MODELOS.length).toBeGreaterThanOrEqual(30)
    expect(new Set(MODELOS.map((m) => m.categoria))).toEqual(new Set(CATEGORIAS_MODELO))
  })

  it('observação no item de armamento ou comunicação sai logo depois da descrição', () => {
    expect(linhaQuantificada({ quantidade: 2, genero: 'M', descricao: 'Rádios HT portáteis digitais', observacao: 'bateria fraca' })).toBe('02 (dois) Rádios HT portáteis digitais – bateria fraca')
    expect(linhaQuantificada({ quantidade: 1, genero: 'M', descricao: 'Rádio base fixa digital', observacao: '  ' })).toBe('01 (um) Rádio base fixa digital')
  })
})
