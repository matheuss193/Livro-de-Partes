/**
 * Campo de escolha com busca: a pessoa começa a digitar e aparecem só as opções que combinam
 * (sem ligar para acento ou maiúscula), em vez de rolar uma lista grande.
 */
import { useEffect, useRef, useState } from 'react'
import { normalizar } from '../domain/busca'

export interface OpcaoBusca {
  id: string
  rotulo: string
}

export default function BuscaLista({ rotulo, opcoes, selecionado, aoEscolher, aoOutro, aoLimpar, placeholder = 'Digite para buscar…' }: {
  rotulo: string
  opcoes: OpcaoBusca[]
  /** Texto do que já está escolhido (aparece no campo enquanto não se digita). */
  selecionado?: string
  aoEscolher: (id: string) => void
  /** Mostra a opção "Outro (digitar o nome)" no fim da lista. */
  aoOutro?: () => void
  /** Mostra o botão de limpar. */
  aoLimpar?: () => void
  placeholder?: string
}) {
  const [aberto, setAberto] = useState(false)
  const [texto, setTexto] = useState('')
  const raiz = useRef<HTMLDivElement>(null)
  const idLista = useRef(`busca-${Math.random().toString(36).slice(2, 8)}`).current

  useEffect(() => {
    if (!aberto) return
    const fora = (e: PointerEvent) => { if (!raiz.current?.contains(e.target as Node)) setAberto(false) }
    document.addEventListener('pointerdown', fora)
    return () => document.removeEventListener('pointerdown', fora)
  }, [aberto])

  const palavras = normalizar(texto).split(/\s+/).filter(Boolean)
  const filtradas = opcoes.filter((o) => palavras.every((p) => normalizar(o.rotulo).includes(p))).slice(0, 40)

  const escolher = (id: string) => { aoEscolher(id); setAberto(false); setTexto('') }

  return (
    <div className="busca-lista" ref={raiz}>
      <label>{rotulo}</label>
      <div className="busca-campo">
        <input
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          autoComplete="off"
          value={aberto ? texto : selecionado ?? ''}
          placeholder={selecionado ? selecionado : placeholder}
          onFocus={() => { setAberto(true); setTexto('') }}
          onChange={(e) => { setTexto(e.target.value); setAberto(true) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtradas[0]) { e.preventDefault(); escolher(filtradas[0].id) }
            if (e.key === 'Escape') setAberto(false)
          }}
        />
        {aoLimpar && selecionado && !aberto && (
          <button type="button" className="limpar" aria-label="Limpar escolha" onClick={aoLimpar}>×</button>
        )}
      </div>
      {aberto && (
        <ul className="lista-busca" id={idLista} role="listbox">
          {filtradas.length === 0 && <li className="vazio">Nenhum resultado para "{texto}".</li>}
          {filtradas.map((o) => (
            <li key={o.id} role="option" aria-selected={false}>
              <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => escolher(o.id)}>{o.rotulo}</button>
            </li>
          ))}
          {aoOutro && (
            <li role="option" aria-selected={false}>
              <button type="button" className="outro" onPointerDown={(e) => e.preventDefault()} onClick={() => { aoOutro(); setAberto(false); setTexto('') }}>✎ Outro (digitar o nome)</button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
