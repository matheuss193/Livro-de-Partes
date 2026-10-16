/**
 * Ditado por voz (Web Speech API, pt-BR). Funciona no Chrome/Edge e no Chrome do Android;
 * o reconhecimento é feito pelo navegador e costuma exigir internet. Onde não houver suporte, o botão some.
 */
import { useRef, useState } from 'react'

interface ReconhecedorVoz {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start: () => void
  stop: () => void
}
type ConstrutorVoz = new () => ReconhecedorVoz

function construtor(): ConstrutorVoz | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as { SpeechRecognition?: ConstrutorVoz; webkitSpeechRecognition?: ConstrutorVoz }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const MENSAGENS: Record<string, string> = {
  'not-allowed': 'O microfone foi bloqueado. Permita o uso do microfone no navegador.',
  'service-not-allowed': 'O ditado não está liberado neste navegador.',
  'no-speech': 'Não ouvi nada. Tente de novo, falando perto do microfone.',
  network: 'O ditado precisa de internet.',
}

/** Junta o texto ditado ao que já existe, com espaço e a primeira letra maiúscula no começo. */
export function juntarDitado(atual: string, novo: string): string {
  const t = novo.trim()
  if (!t) return atual
  if (!atual.trim()) return t.charAt(0).toUpperCase() + t.slice(1)
  return `${atual.replace(/\s+$/, '')} ${t}`
}

export function BotaoMic({ onTexto, aoIniciar, rotulo = 'Ditar por voz' }: { onTexto: (texto: string) => void; aoIniciar?: () => void; rotulo?: string }) {
  const [ouvindo, setOuvindo] = useState(false)
  // Sempre a versão mais recente: o ditado contínuo dispara vários resultados depois do clique.
  const textoRef = useRef(onTexto)
  textoRef.current = onTexto
  const [erro, setErro] = useState('')
  const ref = useRef<ReconhecedorVoz | null>(null)
  const Construtor = construtor()
  if (!Construtor) return null

  function alternar() {
    if (ouvindo) { ref.current?.stop(); return }
    setErro('')
    aoIniciar?.()
    const rec = new Construtor!()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      let t = ''
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) t += e.results[i][0].transcript
      if (t) textoRef.current(t)
    }
    rec.onend = () => setOuvindo(false)
    rec.onerror = (e) => { setOuvindo(false); setErro(MENSAGENS[e.error] ?? 'Não foi possível usar o ditado.') }
    ref.current = rec
    rec.start()
    setOuvindo(true)
  }

  return (
    <span className="mic-wrap">
      <button type="button" className={`mic ${ouvindo ? 'ouvindo' : ''}`} aria-pressed={ouvindo} aria-label={ouvindo ? 'Parar o ditado' : rotulo} title={ouvindo ? 'Parar o ditado' : rotulo} onClick={alternar}>
        {ouvindo ? '■' : '🎤'}
      </button>
      {ouvindo && <span className="suave">Ouvindo… fale e toque em ■ para parar.</span>}
      {erro && <span className="suave" style={{ color: 'var(--cor-erro)' }}>{erro}</span>}
    </span>
  )
}

export const vozDisponivel = (): boolean => !!construtor()
