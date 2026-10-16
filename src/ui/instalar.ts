/** Instalação do app (PWA): guarda o convite do navegador (Android/Chrome/Edge) e informa se já está instalado. */
interface EventoInstalar extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let convite: EventoInstalar | null = null
const ouvintes = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    convite = e as EventoInstalar
    ouvintes.forEach((f) => f())
  })
  window.addEventListener('appinstalled', () => {
    convite = null
    ouvintes.forEach((f) => f())
  })
}

export const podeInstalarAgora = (): boolean => convite !== null

export function aoMudarInstalacao(f: () => void): () => void {
  ouvintes.add(f)
  return () => { ouvintes.delete(f) }
}

export async function instalarAgora(): Promise<'accepted' | 'dismissed' | 'indisponivel'> {
  if (!convite) return 'indisponivel'
  await convite.prompt()
  const r = await convite.userChoice
  convite = null
  return r.outcome
}

export function estaInstalado(): boolean {
  if (typeof window === 'undefined') return false
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}
