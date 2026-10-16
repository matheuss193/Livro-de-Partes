/**
 * Monta a definição do PDF (pdfmake) no layout do livro físico (docs/ESPECIFICACAO.md, seção 7):
 * A4, cabeçalho em quadro com a área diagonal "Visto do SubCmt", coluna esquerda com o numeral
 * romano do item, coluna direita reservada ao visto do oficial, tabela do item VI com bordas,
 * rodapé com hash e retificações em seção própria.
 * Função pura (sem navegador): fácil de testar.
 */
import type { Content } from 'pdfmake'
import { formatarDataHora } from '../data/localRepo'
import type { ParteGuardada } from '../data/repositorio'
import { cabecalhoLinhas, gerarSecoes, textoAssinatura, textoSituacao } from '../domain/textos'
import type { Unidade } from '../domain/tipos'

export type DefinicaoPdf = Parameters<typeof import('pdfmake').createPdf>[0]

const COR_LINHA = '#444444'

/** Tabela sem bordas, exceto a linha vertical que separa a coluna do visto (margem direita). */
const LAYOUT_ITEM = {
  hLineWidth: () => 0,
  vLineWidth: (i: number) => (i === 2 ? 0.6 : 0),
  vLineColor: () => COR_LINHA,
  paddingTop: () => 1.5,
  paddingBottom: () => 1.5,
  paddingLeft: () => 3,
  paddingRight: () => 3,
}

export interface Logos {
  /** Brasão do CBMPA (data URI PNG). */
  cbmpa?: string
  /** Logo da Defesa Civil do Pará (data URI PNG). */
  defesaCivil?: string
}

/**
 * Cabeçalho: faixa com os brasões e as 3 primeiras linhas centralizadas, seguida do quadro com a área
 * diagonal "Visto do SubCmt" à esquerda e, à direita, as demais linhas (Parte nº, Do, Ao).
 */
function cabecalho(g: ParteGuardada, unidade: Unidade, logos: Logos): Content {
  const linhas = cabecalhoLinhas(g.parte, unidade)
  const faixa = linhas.slice(0, 3)
  const quadro = linhas.slice(3)
  // Altura aproximada do quadro (11 pt, 3 linhas ≈ 53 pt): a diagonal acompanha as linhas do texto.
  const alturaQuadro = Math.max(44, quadro.length * 13 + 14)
  const imagem = (src: string | undefined, largura: number): Content =>
    src ? ({ image: src, width: largura } as Content) : ({ text: '' } as Content)

  return {
    stack: [
      {
        columns: [
          { width: 62, stack: [imagem(logos.cbmpa, 56)] },
          { width: '*', stack: faixa.map((l, i) => ({ text: l, bold: i !== 1, alignment: 'center', fontSize: i === 1 ? 10.5 : 12 })), margin: [0, 6, 0, 0] },
          { width: 62, stack: [imagem(logos.defesaCivil, 56)], alignment: 'right' },
        ],
        columnGap: 4,
        margin: [0, 0, 0, 6],
      },
      {
        table: {
          widths: [112, '*'],
          body: [[
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: alturaQuadro - 4, x2: 106, y2: 0, lineWidth: 0.8, lineColor: COR_LINHA }] },
                { text: 'Visto do SubCmt', fontSize: 9, margin: [0, -16, 0, 0] },
                ...(g.status === 'vistada' ? [{ text: 'Visto registrado', fontSize: 8 }] : []),
              ],
            },
            { stack: quadro.map((l, i) => ({ text: l, bold: i === 0, fontSize: 11 })), margin: [4, 4, 0, 4] },
          ]],
        },
        layout: { hLineWidth: () => 1, vLineWidth: () => 1, hLineColor: () => '#000', vLineColor: () => '#000' },
        margin: [0, 0, 0, 10],
      },
    ],
  } as Content
}

/** Linhas de um item: a primeira traz numeral + título; a coluna direita fica em branco para o visto. */
function tabelaItem(numeral: string, titulo: string, linhas: Content[], tituloInline?: string): Content {
  const corpo: Content[][] = [[
    { text: numeral, bold: true },
    { text: tituloInline ? [{ text: `${titulo}: `, bold: true }, tituloInline] : { text: `${titulo}:`, bold: true } } as Content,
    '',
  ]]
  for (const l of linhas) corpo.push(['', l, ''])
  return { table: { widths: [26, '*', 46], body: corpo, dontBreakRows: true, headerRows: 1, keepWithHeaderRows: 1 }, layout: LAYOUT_ITEM, margin: [0, 0, 0, 6] } as Content
}

function tabelaCombustivel(g: ParteGuardada): Record<string, unknown> {
  const cab = ['VTR', 'Recebi', 'Km', 'Passei', 'Km', 'Situação'].map((t) => ({ text: t, bold: true, fillColor: '#eeeeee' }))
  const km = (v: number | null) => (v === null ? '—' : String(v))
  const corpo = g.parte.itens.combustivel.map((l) => [
    l.vtr, l.recebiNivel, km(l.recebiKm), l.passeiNivel, km(l.passeiKm), textoSituacao(l.situacao),
  ])
  return {
    table: { headerRows: 1, widths: [58, 38, 44, 38, 44, '*'], body: [cab, ...corpo] },
    layout: { hLineWidth: () => 0.5, vLineWidth: () => 0.5, hLineColor: () => COR_LINHA, vLineColor: () => COR_LINHA },
    fontSize: 9.5,
    margin: [0, 2, 0, 2],
  }
}

export function montarDocumento(g: ParteGuardada, unidade: Unidade, logos: Logos = {}): DefinicaoPdf {
  const rascunho = g.status === 'rascunho'
  const assinatura = g.encerradaEm ? `assinado eletronicamente em ${formatarDataHora(g.encerradaEm)}` : undefined
  const secoes = gerarSecoes(g.parte, unidade)
  const hashCurto = g.hash ? g.hash.slice(0, 8) : 'sem hash'

  const itens: Content[] = secoes.map((s) => {
    if (s.numeral === 'VI' && !s.manual) {
      // Título e tabela ficam juntos na mesma página; a tabela respeita a margem do visto (46 pt).
      return {
        unbreakable: true,
        stack: [tabelaItem(s.numeral, s.titulo, []), { ...tabelaCombustivel(g), margin: [26, 0, 46, 8] } as Content],
      } as Content
    }
    if (s.mesmaLinha && !s.manual) return tabelaItem(s.numeral, s.titulo, [], s.linhas[0])
    const subtitulos = ['Incêndio:', 'Salvamento:', 'Prevenção, Auxílio e APH:']
    return tabelaItem(s.numeral, s.titulo, s.linhas.map((l) => ({ text: l, bold: s.numeral === 'IX' && subtitulos.includes(l) })))
  })

  const assin = textoAssinatura(g.parte, unidade, assinatura)
  const manualAssin = !!g.parte.ajustes?.assinatura
  const bloco: Content = {
    stack: manualAssin
      ? assin.map((l, i) => ({ text: l, margin: i === 0 ? [0, 14, 0, 6] : [0, 0, 0, 0] }))
      : [
          { text: assin[0], margin: [0, 14, 0, 14] },
          { text: assin[1], fontSize: 10 },
          { text: assin[2], bold: true },
          { text: assin[3] },
        ],
    alignment: 'right',
    unbreakable: true,
  }

  const retif: Content[] = g.retificacoes.length === 0 ? [] : [
    { text: 'RETIFICAÇÕES, ERRATAS E ADENDOS', bold: true, margin: [0, 18, 0, 6], pageBreak: undefined },
    ...g.retificacoes.map((r) => ({
      unbreakable: true,
      margin: [0, 0, 0, 8],
      stack: [
        { text: `${{ retificacao: 'RETIFICAÇÃO', errata: 'ERRATA', adendo: 'ADENDO' }[r.tipo]} nº ${r.numero} – em ${formatarDataHora(r.em)} – ${r.autor}`, bold: true },
        {
          text: r.tipo === 'adendo'
            ? `Acrescente-se ao item ${r.item}${r.alinea ? `, alínea ${r.alinea}` : ''}: ${r.leiaSe}`
            : `No item ${r.item}${r.alinea ? `, alínea ${r.alinea}` : ''}, onde se lê: "${r.ondeSeLe ?? ''}", leia-se: "${r.leiaSe}".`,
        },
        { text: `Motivo: ${r.motivo}`, italics: true },
        { text: `hash ${r.hash.slice(0, 8)}`, fontSize: 8, color: '#666' },
      ],
    } as Content)),
  ]

  return {
    pageSize: 'A4',
    pageMargins: [48, 40, 40, 50],
    defaultStyle: { font: 'Roboto', fontSize: 11, lineHeight: 1.15 },
    info: { title: `Parte nº ${g.numero}/${g.ano} – ${unidade.nome}`, subject: 'Parte do Comandante do Socorro' },
    background: rascunho
      ? () => ({ text: 'RASCUNHO', color: '#dddddd', fontSize: 90, bold: true, angle: 45, absolutePosition: { x: 110, y: 380 } }) as Content
      : undefined,
    content: [cabecalho(g, unidade, logos), ...itens, bloco, ...retif],
    footer: (pagina: number, total: number) => ({
      text: `Documento gerado eletronicamente – Parte nº ${g.numero}/${g.ano} – hash ${hashCurto} – página ${pagina}/${total}`,
      alignment: 'center',
      fontSize: 8,
      color: '#555',
      margin: [40, 12, 40, 0],
    }) as Content,
  }
}
