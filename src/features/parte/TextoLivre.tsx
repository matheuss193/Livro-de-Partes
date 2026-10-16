import { useState } from 'react'

/**
 * Permite ao autor reescrever à mão qualquer trecho da Parte (cabeçalho, itens, assinatura), como no
 * livro físico. O texto digitado substitui o texto automático; "Voltar ao automático" desfaz.
 */
export default function TextoLivre({ rotulo, automatico, manual, onChange }: {
  rotulo: string
  /** Linhas geradas automaticamente a partir dos campos. */
  automatico: string[]
  /** Linhas escritas à mão, se houver. */
  manual: string[] | undefined
  onChange: (linhas: string[] | undefined) => void
}) {
  const [confirmando, setConfirmando] = useState(false)

  if (!manual) {
    return (
      <button type="button" className="largo pequeno" style={{ marginTop: 10 }} onClick={() => onChange(automatico)}>
        ✎ Escrever {rotulo} à mão
      </button>
    )
  }
  return (
    <div className="cartao" style={{ marginTop: 10, borderColor: 'var(--cor-destaque)' }}>
      <strong>✎ {rotulo}: texto escrito à mão</strong>
      <p className="suave">O que você escrever aqui vale exatamente como está. Os campos deste item deixam de alterar o texto.</p>
      <textarea
        aria-label={`Texto escrito à mão: ${rotulo}`}
        style={{ minHeight: Math.min(420, 40 + manual.length * 26), fontFamily: 'Georgia, serif' }}
        value={manual.join('\n')}
        onChange={(e) => onChange(e.target.value.split('\n'))}
      />
      {!confirmando ? (
        <button type="button" className="pequeno" onClick={() => setConfirmando(true)}>Voltar ao texto automático</button>
      ) : (
        <div className="aviso">
          O texto escrito à mão será descartado e o automático volta.
          <div className="linha" style={{ marginTop: 6 }}>
            <button type="button" className="perigo pequeno" onClick={() => { setConfirmando(false); onChange(undefined) }}>Descartar meu texto</button>
            <button type="button" className="pequeno" onClick={() => setConfirmando(false)}>Manter</button>
          </div>
        </div>
      )}
    </div>
  )
}
