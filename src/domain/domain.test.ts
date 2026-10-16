import { describe, expect, it } from 'vitest'
import { extenso, quantidadeExtenso } from './extenso'
import { albuquerque, parteExemplo, rangel, teixeira, unidadeExemplo } from './exemplo'
import { dataPorExtenso, decimalBR, somarDias } from './formatacao'
import { hashDoConteudo } from './hash'
import { gerarSecoes, gerarTextoOficial, textoPassagem, textoRecebimento } from './textos'
import { podeEncerrar, validarEnergia, validarNumeracao, validarParte } from './validacoes'
import type { Parte } from './tipos'

describe('extenso', () => {
  it('concorda em gênero', () => {
    expect(quantidadeExtenso(1, 'M')).toBe('01 (um)')
    expect(quantidadeExtenso(1, 'F')).toBe('01 (uma)')
    expect(quantidadeExtenso(2, 'F')).toBe('02 (duas)')
    expect(quantidadeExtenso(5, 'F')).toBe('05 (cinco)')
    expect(quantidadeExtenso(2, 'M')).toBe('02 (dois)')
  })

  it('cobre de 0 a 99 sem lacunas', () => {
    expect(extenso(11)).toBe('onze')
    expect(extenso(20)).toBe('vinte')
    expect(extenso(21, 'F')).toBe('vinte e uma')
    expect(extenso(32, 'F')).toBe('trinta e duas')
    expect(extenso(99)).toBe('noventa e nove')
    for (let n = 0; n <= 99; n++) {
      expect(extenso(n)).toMatch(/^[a-zçê ]+$/)
    }
    expect(() => extenso(100)).toThrow()
  })
})

describe('formatação', () => {
  it('data por extenso e dia seguinte', () => {
    expect(dataPorExtenso('2026-10-14')).toBe('14 de outubro de 2026')
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01')
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(somarDias('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('números no padrão brasileiro', () => {
    expect(decimalBR(45.5)).toBe('45,50')
    expect(decimalBR(1234.5)).toBe('1.234,50')
  })
})

describe('frases padrão', () => {
  it('antecessor/sucessor com concordância de gênero', () => {
    expect(textoRecebimento({ militar: teixeira })).toBe(
      'No horário previsto assumi o serviço de Comandante do Socorro, do meu antecessor legal, o 2º SGT QBM Teixeira, com todas as ordens em vigor.',
    )
    expect(textoRecebimento({ militar: { ...teixeira, genero: 'F' } })).toContain('da minha antecessora legal, a 2º SGT QBM Teixeira')
    expect(textoPassagem({ militar: rangel })).toBe(
      'No horário previsto passei o serviço de Comandante do Socorro à minha sucessora legal, a 2º SGT QBM Rangel, com todas as ordens em vigor.',
    )
    expect(textoPassagem({ militar: teixeira })).toContain('ao meu sucessor legal, o 2º SGT QBM Teixeira')
  })

  it('opções: gênero escolhido, nome digitado e horário diferente do previsto', () => {
    expect(textoRecebimento({ militar: teixeira, genero: 'F' })).toContain('da minha antecessora legal, a 2º SGT QBM Teixeira')
    expect(textoRecebimento({ militar: null, texto: 'SD BM Fulano de Tal', genero: 'M' })).toContain('do meu antecessor legal, o SD BM Fulano de Tal')
    expect(textoRecebimento({ militar: teixeira, horario: { tipo: 'atraso', hora: '07:40' } })).toBe(
      'Às 07:40 h, com atraso, assumi o serviço de Comandante do Socorro, do meu antecessor legal, o 2º SGT QBM Teixeira, com todas as ordens em vigor.',
    )
    expect(textoPassagem({ militar: rangel, horario: { tipo: 'antes', hora: '06:50' } })).toContain('Às 06:50 h, antes do horário previsto, passei o serviço')
    expect(textoPassagem({ militar: null })).toContain('o [a informar]')
  })
})

describe('Parte de exemplo (docs/EXEMPLO_PARTE.md)', () => {
  const secoes = gerarSecoes(parteExemplo, unidadeExemplo)
  const texto = gerarTextoOficial(parteExemplo, unidadeExemplo, { assinatura: 'assinado eletronicamente em 15/10/2026 07:58' })

  it('tem sempre os dez itens, na ordem', () => {
    expect(secoes.map((s) => s.numeral)).toEqual(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'])
  })

  it('cabeçalho', () => {
    expect(texto.startsWith(
      'Corpo de Bombeiros Militar do Pará\nCoordenadoria Estadual de Defesa Civil\n9º Grupamento Bombeiro Militar\n' +
      'Parte nº 201 de 14 de outubro de 2026\n' +
      'Do: 2º SGT QBM Albuquerque – Comandante do Socorro\n' +
      'Ao: Sr. 1º TEN QOBM Andrade – SubCmt do 9º GBM',
    )).toBe(true)
  })

  it('guarnição, energia e armamento', () => {
    expect(secoes[1].linhas).toEqual([
      'Comandante do Socorro: 2º SGT QBM Albuquerque',
      'Adjunto ao CMT do SOS: 3º SGT QBM Pacheco',
      'Condutor e Operador de VTR Inc/Salv: 3º SGT QBM Moura',
      'Condutor da VTR UR-119: CB BM Brandão',
      'Socorristas: SD BM Lima e SD BM Prado',
      'Guarnição de Incêndio: SD BM Nogueira e SD BM Castro',
      'Guarnição de Salvamento: SD BM Farias',
    ])
    expect(secoes[2].linhas).toEqual(['Recebi: 5120 kWh', 'Passei: 5127 kWh', 'Consumo total: 07 kWh'])
    expect(texto).toContain('IV – Armamento e Munição: Não houve.')
  })

  it('participação', () => {
    expect(secoes[6].linhas).toEqual([
      'Participo a V. Sª que:',
      'a) O SD BM Farias montou serviço em substituição ao SD BM Rezende, conforme permuta em anexo.',
      'b) A VTR UR-119 foi abastecida com 45,50 litros de diesel S10 no valor de R$ 362,18, Km 13020, ficando um saldo disponível de R$ 437,82.',
      'c) Deslocaram-se na VTR AR-145 para o Município de Anapu o 2º SGT QBM Vieira e o SD BM Cunha para missão de Defesa Civil às 07:40 h.',
      'd) O 3º SGT QBM Moura informou que a VTR AR-146 está apresentando ruído nos freios dianteiros, tendo sido encaminhada à oficina.',
    ])
  })

  it('juntada e ocorrências', () => {
    expect(secoes[7].linhas).toEqual([
      '01 (um) Mapa de Comunicação e Ronda',
      '01 (um) Controle de Saída e Entrada de Viaturas',
      '01 (um) Controle de Entrada e Saída de Civis e Militares',
      '01 (uma) Permuta',
      '01 (uma) Nota fiscal de abastecimento',
      '03 (três) Fichas de APH',
    ])
    expect(secoes[8].linhas).toEqual([
      'Incêndio:', '900101 – Fogo em vegetação',
      'Salvamento:', '900105 – Captura de ofídio',
      'Prevenção, Auxílio e APH:', '900110, 900118 – Emergência clínica', '900112 – Sinistro de trânsito',
    ])
  })

  it('assinatura usa o dia seguinte', () => {
    expect(texto.endsWith(
      'Altamira-PA, 15 de outubro de 2026\n[assinado eletronicamente em 15/10/2026 07:58]\n' +
      'Ricardo Albuquerque Neves – 2º SGT QBM\nComandante do Socorro',
    )).toBe(true)
  })

  it('exemplo não gera avisos graves', () => {
    const avisos = validarParte(parteExemplo)
    expect(podeEncerrar(avisos)).toBe(true)
    expect(avisos).toEqual([])
  })

  it('sem participação usa a frase configurável', () => {
    const vazia: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, participacao: [] } }
    expect(gerarSecoes(vazia, unidadeExemplo)[6].linhas).toEqual(['Participo a V. Sª que: nada houve digno de registro.'])
  })
})

describe('validações', () => {
  it('energia do livro real: cálculo correto', () => {
    expect(validarEnergia({ recebi: 4447, passei: 4454 }, undefined)).toEqual([])
    expect(validarEnergia({ recebi: 4599, passei: 4608 }, undefined)).toEqual([])
  })

  it('energia: Passei menor é aviso forte (não bloqueia); continuidade avisa', () => {
    expect(validarEnergia({ recebi: 10, passei: 5 }, undefined).map((a) => a.gravidade)).toEqual(['forte'])
    const av = validarEnergia({ recebi: 4554, passei: 4560 }, { passei: 4553 })
    expect(av.map((a) => a.codigo)).toEqual(['energia-continuidade'])
  })

  it('Km menor gera aviso forte (caso AT-12 do livro)', () => {
    const p: Parte = {
      ...parteExemplo,
      itens: {
        ...parteExemplo.itens,
        combustivel: [{ vtr: 'AT-12', recebiNivel: '4/4', recebiKm: 51781, passeiNivel: '4/4', passeiKm: 51771, situacao: { tipo: 'operante' } }],
      },
    }
    const av = validarParte(p)
    expect(av.some((a) => a.codigo === 'km-menor' && a.gravidade === 'forte')).toBe(true)
  })

  it('numeração: duplicada bloqueia, fora de sequência avisa', () => {
    expect(validarNumeracao(168, 167, [167, 168])[0].gravidade).toBe('bloqueia')
    expect(validarNumeracao(210, 201, [201])[0].gravidade).toBe('aviso')
    expect(validarNumeracao(202, 201, [201])).toEqual([])
  })

  it('juntada x participação', () => {
    const p: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, juntada: [] } }
    const codigos = validarParte(p).map((a) => a.codigo)
    expect(codigos).toContain('juntada-permutas')
    expect(codigos).toContain('juntada-abastecimentos')
  })

  it('continuidade: antecessor deve ser o autor da Parte anterior', () => {
    const anterior: Parte = { ...parteExemplo, numero: 200, autor: albuquerque }
    const av = validarParte(parteExemplo, { anterior })
    expect(av.map((a) => a.codigo)).toContain('antecessor-diferente')
  })
})

describe('liberdade de edição (ajustes manuais)', () => {
  it('o autor reescreve um item à mão e o texto gerado deixa de valer', () => {
    const p: Parte = { ...parteExemplo, ajustes: { secoes: { III: ['Leitura conforme relógio: 5127 kWh (relógio trocado).'] } } }
    const secoes = gerarSecoes(p, unidadeExemplo)
    expect(secoes[2]).toMatchObject({ numeral: 'III', manual: true, linhas: ['Leitura conforme relógio: 5127 kWh (relógio trocado).'] })
    expect(secoes[0].manual).toBeUndefined()
    expect(gerarTextoOficial(p, unidadeExemplo)).toContain('III – Consumo de Energia:\nLeitura conforme relógio')
  })

  it('cabeçalho e assinatura também podem ser reescritos', () => {
    const p: Parte = { ...parteExemplo, ajustes: { cabecalho: ['Linha 1', 'Linha 2'], assinatura: ['Altamira-PA, hoje', 'Assinado'] } }
    const texto = gerarTextoOficial(p, unidadeExemplo)
    expect(texto.startsWith('Linha 1\nLinha 2\n\nI – ')).toBe(true)
    expect(texto.endsWith('Altamira-PA, hoje\nAssinado')).toBe(true)
  })

  it('item reescrito não gera aviso e falta de dado nunca bloqueia', () => {
    const vazia: Parte = { ...parteExemplo, itens: { ...parteExemplo.itens, energia: { recebi: 0, passei: 0 }, passagem: { sucessor: null } } }
    const avisos = validarParte(vazia)
    expect(avisos.some((a) => a.item === 'III')).toBe(true)
    expect(podeEncerrar(avisos)).toBe(true)
    const livre = validarParte({ ...vazia, ajustes: { secoes: { III: ['x'], X: ['y'] } } })
    expect(livre.filter((a) => a.item === 'III' || a.item === 'X')).toEqual([])
  })
})

describe('hash', () => {
  it('é estável e sensível a mudanças', async () => {
    const a = await hashDoConteudo({ x: 1, y: [1, 2] })
    const b = await hashDoConteudo({ y: [1, 2], x: 1 })
    const c = await hashDoConteudo({ x: 2, y: [1, 2] })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
