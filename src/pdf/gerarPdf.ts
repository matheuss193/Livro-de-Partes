/** Geração do PDF no navegador. O pdfmake (pesado) só é carregado quando o usuário pede o PDF. */
import type { AnexoMeta, ParteGuardada } from '../data/repositorio'
import type { Unidade } from '../domain/tipos'
import { compartilharArquivo, salvarArquivo, type ResultadoSalvar } from './destino'
import { mesclarAnexos } from './mesclar'
import { montarDocumento, type Logos } from './montarDocumento'

export interface AnexoCompleto {
  meta: AnexoMeta
  blob: Blob
}

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

export async function gerarPdfBlob(g: ParteGuardada, unidade: Unidade, anexos: AnexoCompleto[] = []): Promise<Blob> {
  const [{ default: pdfMake }, { default: vfs }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  pdfMake.addVirtualFileSystem(vfs)
  const base: Blob = await pdfMake.createPdf(montarDocumento(g, unidade, await carregarLogos(), anexos.map((a) => a.meta))).getBlob()
  if (anexos.length === 0) return base
  const bytes = await mesclarAnexos(new Uint8Array(await base.arrayBuffer()), anexos.map((a) => ({ nome: a.meta.nome, tipo: a.meta.tipo, blob: a.blob })))
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}

/** Abre a folha de compartilhamento do celular (WhatsApp, e-mail, "Salvar em Arquivos"...) com o PDF. */
export async function compartilharPdf(g: ParteGuardada, unidade: Unidade, anexos: AnexoCompleto[] = []): Promise<ResultadoSalvar> {
  return compartilharArquivo(await gerarPdfBlob(g, unidade, anexos), nomeArquivo(g), `Parte nº ${g.numero}/${g.ano}`)
}

/** Gera o PDF e salva na pasta escolhida (computador) ou baixa pelo navegador (celular). */
export async function baixarPdf(g: ParteGuardada, unidade: Unidade, anexos: AnexoCompleto[] = []): Promise<ResultadoSalvar> {
  return salvarArquivo(await gerarPdfBlob(g, unidade, anexos), nomeArquivo(g))
}
