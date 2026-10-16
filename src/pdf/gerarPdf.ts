/** Geração do PDF no navegador. O pdfmake (pesado) só é carregado quando o usuário pede o PDF. */
import type { ParteGuardada } from '../data/repositorio'
import type { Unidade } from '../domain/tipos'
import { montarDocumento, type Logos } from './montarDocumento'

export function nomeArquivo(g: ParteGuardada): string {
  return `Parte-${String(g.numero).padStart(3, '0')}-${g.dataServico}.pdf`
}

async function dataUri(caminho: string): Promise<string | undefined> {
  try {
    const resp = await fetch(`${import.meta.env.BASE_URL}${caminho}`)
    if (!resp.ok) return undefined
    const blob = await resp.blob()
    return await new Promise<string>((ok, erro) => {
      const leitor = new FileReader()
      leitor.onload = () => ok(String(leitor.result))
      leitor.onerror = () => erro(leitor.error)
      leitor.readAsDataURL(blob)
    })
  } catch {
    return undefined // sem o brasão o PDF sai igual, só sem a imagem
  }
}

async function carregarLogos(): Promise<Logos> {
  const [cbmpa, defesaCivil] = await Promise.all([dataUri('logo-cbmpa.png'), dataUri('logo-defesa-civil.png')])
  return { cbmpa, defesaCivil }
}

export async function gerarPdfBlob(g: ParteGuardada, unidade: Unidade): Promise<Blob> {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  pdfMake.addVirtualFileSystem(vfs)
  return pdfMake.createPdf(montarDocumento(g, unidade, await carregarLogos())).getBlob()
}

/** Abre a folha de compartilhamento do celular (WhatsApp, e-mail etc.) com o PDF anexado. */
export async function compartilharPdf(g: ParteGuardada, unidade: Unidade): Promise<void> {
  const blob = await gerarPdfBlob(g, unidade)
  const arquivo = new File([blob], nomeArquivo(g), { type: 'application/pdf' })
  if (navigator.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title: `Parte nº ${g.numero}/${g.ano}` })
  } else {
    await baixarPdf(g, unidade)
  }
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
