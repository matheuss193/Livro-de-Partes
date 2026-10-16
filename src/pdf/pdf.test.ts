import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ParteGuardada } from '../data/repositorio'
import { parteExemplo, unidadeExemplo } from '../domain/exemplo'
import { montarDocumento } from './montarDocumento'

const require = createRequire(import.meta.url)

const guardada: ParteGuardada = {
  id: 'x', numero: 201, ano: 2026, dataServico: '2026-10-14', status: 'encerrada', parte: parteExemplo,
  atualizadaEm: '2026-10-15T10:58:00Z', encerradaEm: '2026-10-15T10:58:00Z', hash: 'ab12cd34ef56'.repeat(5),
  textoFinal: '',
  retificacoes: [{
    numero: 1, tipo: 'retificacao', item: 'VII', alinea: 'b', ondeSeLe: '45,50 litros', leiaSe: '45,05 litros',
    motivo: 'erro de digitação na quantidade, conforme nota fiscal anexa.', autor: '2º SGT QBM Albuquerque',
    em: '2026-10-15T13:12:00Z', hash: '99aa88bb77cc'.repeat(5),
  }],
}

const logo = (n: string) => `data:image/png;base64,${readFileSync(`public/${n}`).toString('base64')}`
const logos = { cbmpa: logo('logo-cbmpa.png'), defesaCivil: logo('logo-defesa-civil.png') }

describe('PDF', () => {
  it('gera um PDF válido da Parte de exemplo', async () => {
    const pdfmake = require('pdfmake')
    const raiz = 'node_modules/pdfmake/build/fonts/Roboto/'
    pdfmake.setFonts({ Roboto: { normal: raiz + 'Roboto-Regular.ttf', bold: raiz + 'Roboto-Medium.ttf', italics: raiz + 'Roboto-Italic.ttf', bolditalics: raiz + 'Roboto-MediumItalic.ttf' } })
    const buf: Buffer = await pdfmake.createPdf(montarDocumento(guardada, unidadeExemplo, logos)).getBuffer()
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(5000)
    if (process.env.LP_PDF_OUT) writeFileSync(process.env.LP_PDF_OUT, buf)
  })
})
