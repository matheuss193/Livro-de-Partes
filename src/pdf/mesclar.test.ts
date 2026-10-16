import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { mesclarAnexos } from './mesclar'

// PNG 1x1 transparente
const PNG_1X1 = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0))

async function pdfComPaginas(n: number): Promise<Uint8Array> {
  const d = await PDFDocument.create()
  for (let i = 0; i < n; i++) d.addPage()
  return d.save()
}

describe('mesclarAnexos', () => {
  it('sem anexos devolve o mesmo PDF', async () => {
    const base = await pdfComPaginas(2)
    expect(await mesclarAnexos(base, [])).toBe(base)
  })

  it('acrescenta as páginas dos PDFs e uma página por foto, na ordem', async () => {
    const base = await pdfComPaginas(3)
    const anexoPdf = await pdfComPaginas(2)
    const saida = await mesclarAnexos(base, [
      { nome: 'mapa.pdf', tipo: 'application/pdf', blob: new Blob([anexoPdf as BlobPart]) },
      { nome: 'foto.png', tipo: 'image/png', blob: new Blob([PNG_1X1 as BlobPart]) },
    ])
    expect((await PDFDocument.load(saida)).getPageCount()).toBe(3 + 2 + 1)
  })
})
