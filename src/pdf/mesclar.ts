/** Junta os anexos (PDF ou foto) ao PDF da Parte, na ordem em que foram anexados. */
import { PDFDocument } from 'pdf-lib'

export interface AnexoParaMesclar {
  nome: string
  tipo: string
  blob: Blob
}

const A4 = { largura: 595.28, altura: 841.89, margem: 36 }

/** WEBP não é aceito pelo pdf-lib: converte para PNG pelo navegador. */
async function webpParaPng(blob: Blob): Promise<Uint8Array> {
  const bmp = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width
  canvas.height = bmp.height
  canvas.getContext('2d')!.drawImage(bmp, 0, 0)
  const png = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'))
  if (!png) throw new Error('Não foi possível converter a imagem.')
  return new Uint8Array(await png.arrayBuffer())
}

export async function mesclarAnexos(basePdf: Uint8Array, anexos: AnexoParaMesclar[]): Promise<Uint8Array> {
  if (anexos.length === 0) return basePdf
  const doc = await PDFDocument.load(basePdf)
  for (const a of anexos) {
    if (a.tipo === 'application/pdf') {
      const origem = await PDFDocument.load(await a.blob.arrayBuffer(), { ignoreEncryption: true })
      const paginas = await doc.copyPages(origem, origem.getPageIndices())
      paginas.forEach((p) => doc.addPage(p))
      continue
    }
    const bytes = a.tipo === 'image/webp' ? await webpParaPng(a.blob) : new Uint8Array(await a.blob.arrayBuffer())
    const imagem = a.tipo === 'image/jpeg' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes)
    const pagina = doc.addPage([A4.largura, A4.altura])
    const caixa = { l: A4.largura - 2 * A4.margem, a: A4.altura - 2 * A4.margem }
    const escala = Math.min(caixa.l / imagem.width, caixa.a / imagem.height, 1)
    const l = imagem.width * escala
    const alt = imagem.height * escala
    pagina.drawImage(imagem, { x: (A4.largura - l) / 2, y: A4.altura - A4.margem - alt, width: l, height: alt })
  }
  return doc.save()
}
