/**
 * Onde os arquivos (PDF da Parte, backup) são salvos.
 *
 * - Computador com Chrome/Edge: o usuário escolhe UMA PASTA e os arquivos vão direto para ela
 *   (File System Access API; a escolha fica guardada neste aparelho).
 * - Celular (Android e iPhone): os navegadores não deixam o site escolher pastas. O arquivo vai para a
 *   pasta de downloads do aparelho, ou o usuário usa "Compartilhar" > "Salvar em Arquivos" / Drive.
 *   O guia de primeiro acesso ensina a escolher o local nas configurações do próprio celular.
 */
import Dexie, { type Table } from 'dexie'

class BancoPreferencias extends Dexie {
  prefs!: Table<{ chave: string; valor: unknown }, string>
  constructor() {
    super('livro-de-partes-prefs')
    this.version(1).stores({ prefs: 'chave' })
  }
}

let banco: BancoPreferencias | undefined
const db = () => (banco ??= new BancoPreferencias())

interface PastaHandle {
  name: string
  queryPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>
  requestPermission?: (o: { mode: 'readwrite' }) => Promise<PermissionState>
  getFileHandle: (nome: string, o: { create: boolean }) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }> }>
}

export function pastaSuportada(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext && typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === 'function'
}

export async function escolherPasta(): Promise<string> {
  const pick = (window as unknown as { showDirectoryPicker: (o: object) => Promise<PastaHandle> }).showDirectoryPicker
  const handle = await pick.call(window, { id: 'livro-de-partes', mode: 'readwrite', startIn: 'documents' })
  await db().prefs.put({ chave: 'pasta', valor: handle })
  return handle.name
}

export async function pastaEscolhida(): Promise<string | null> {
  try {
    const h = (await db().prefs.get('pasta'))?.valor as PastaHandle | undefined
    return h?.name ?? null
  } catch {
    return null
  }
}

export async function esquecerPasta(): Promise<void> {
  await db().prefs.delete('pasta')
}

export type ResultadoSalvar = { onde: 'pasta'; pasta: string } | { onde: 'download' } | { onde: 'compartilhado' }

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Salva na pasta escolhida (se houver e se o navegador permitir); senão, baixa pelo navegador. */
export async function salvarArquivo(blob: Blob, nome: string): Promise<ResultadoSalvar> {
  if (pastaSuportada()) {
    try {
      const h = (await db().prefs.get('pasta'))?.valor as PastaHandle | undefined
      if (h) {
        let permissao = (await h.queryPermission?.({ mode: 'readwrite' })) ?? 'granted'
        if (permissao !== 'granted') permissao = (await h.requestPermission?.({ mode: 'readwrite' })) ?? 'denied'
        if (permissao === 'granted') {
          const arq = await h.getFileHandle(nome, { create: true })
          const w = await arq.createWritable()
          await w.write(blob)
          await w.close()
          return { onde: 'pasta', pasta: h.name }
        }
      }
    } catch {
      // pasta apagada/sem permissão: cai no download comum
    }
  }
  baixar(blob, nome)
  return { onde: 'download' }
}

/** Abre a folha de compartilhamento do celular (WhatsApp, e-mail, "Salvar em Arquivos", Drive...). */
export async function compartilharArquivo(blob: Blob, nome: string, titulo: string): Promise<ResultadoSalvar> {
  const arquivo = new File([blob], nome, { type: blob.type || 'application/octet-stream' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title: titulo })
    return { onde: 'compartilhado' }
  }
  return salvarArquivo(blob, nome)
}

export const podeCompartilharArquivos = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

export function textoResultado(r: ResultadoSalvar): string {
  if (r.onde === 'pasta') return `Arquivo salvo na pasta "${r.pasta}".`
  if (r.onde === 'compartilhado') return 'Arquivo enviado pela folha de compartilhamento.'
  return 'Arquivo baixado: procure em "Downloads" (Android) ou em "Arquivos > Downloads" (iPhone), ou na barra de downloads do navegador.'
}
