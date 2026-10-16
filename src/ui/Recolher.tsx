import { useState } from 'react'

/**
 * Bloco que começa fechado e abre só se a pessoa quiser: deixa a tela limpa e rápida.
 * O cabeçalho mostra um resumo (ex.: "3 sugestões") para saber o que tem dentro sem abrir.
 */
export default function Recolher({ titulo, resumo, inicialmenteAberto = false, destaque = false, children }: {
  titulo: string
  resumo?: string
  inicialmenteAberto?: boolean
  /** Realça o cabeçalho (há algo que merece atenção lá dentro). */
  destaque?: boolean
  children: React.ReactNode
}) {
  const [aberto, setAberto] = useState(inicialmenteAberto)
  return (
    <div className={`recolher ${aberto ? 'aberto' : ''} ${destaque ? 'destaque' : ''}`}>
      <button type="button" className="recolher-cab" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <span className="recolher-seta" aria-hidden>{aberto ? '▾' : '▸'}</span>
        <span className="recolher-titulo">{titulo}</span>
        {resumo && <span className="recolher-resumo">{resumo}</span>}
      </button>
      {aberto && <div className="recolher-corpo">{children}</div>}
    </div>
  )
}
