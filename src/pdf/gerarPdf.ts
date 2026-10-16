/** Geração do PDF no navegador. O pdfmake (pesado) só é carregado quando o usuário pede o PDF. */
import type { ParteGuardada } from '../data/repositorio'
import type { Unidade } from '../domain/tipos'
import { montarDocumento } from './montarDocumento'

export function nomeArquivo(g: ParteGuardada): string {
  return `Parte-${String(g.numero).padStart(3, '0')}-${g.dataServico}.pdf`
}

export async function gerarPdfBlob(g: ParteGuardada, unidade: Unidade): Promise<Blob> {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  pdfMake.addVirtualFileSystem(vfs)
  return pdfMake.createPdf(montarDocumento(g, unidade)).getBlob()
}

/** Gera e baixa o PDF (no celular, o navegador oferece abrir ou salvar). */
export async function baixarPdf(g: ParteGuardada, unidade: Unidade): Promise<void> {
  const blob = await gerarPdfBlob(g, unidade)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo(g)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
