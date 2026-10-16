/**
 * Caixa do texto oficial com um lápis no canto: tocar no lápis transforma o texto em campo de edição
 * no próprio lugar (o autor escreve como se fosse à mão). O botão ↺ volta ao texto automático.
 */
import { juntarDitado, BotaoMic } from './voz'

/** Linhas "VTR | Recebi | Km | ..." viram tabela; o resto é texto corrido. */
export function TextoRico({ linhas }: { linhas: string[] }) {
  const blocos: ({ tipo: 'texto'; linha: string } | { tipo: 'tabela'; cab: string[]; corpo: string[][] })[] = []
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].startsWith('VTR | Recebi')) {
      const corpo: string[][] = []
      let j = i + 1
      while (j < linhas.length && linhas[j].split(' | ').length === 6) { corpo.push(linhas[j].split(' | ')); j++ }
      blocos.push({ tipo: 'tabela', cab: linhas[i].split(' | '), corpo })
      i = j - 1
    } else blocos.push({ tipo: 'texto', linha: linhas[i] })
  }
  return (
    <>
      {blocos.map((b, k) =>
        b.tipo === 'texto' ? (
          <div key={k} className="linha-texto">{b.linha || ' '}</div>
        ) : (
          <div className="tabela-rolagem" key={k}>
            <table className="tab-oficial">
              <thead><tr>{b.cab.map((c, n) => <th key={n}>{c}</th>)}</tr></thead>
              <tbody>{b.corpo.map((l, n) => <tr key={n}>{l.map((c, m) => <td key={m}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ),
      )}
    </>
  )
}

export default function CaixaTexto({ titulo, linhas, manual, onAtivar, onChange, onRestaurar, alinhamento = 'esquerda', semLapis }: {
  /** Título do item, ex.: "I – Recebimento do Serviço:" (fica fora da área editável). */
  titulo?: string
  linhas: string[]
  manual: boolean
  /** Chamado ao tocar no lápis: deve gravar o texto atual como texto manual. */
  onAtivar: () => void
  onChange: (linhas: string[]) => void
  onRestaurar: () => void
  alinhamento?: 'esquerda' | 'centro' | 'direita'
  semLapis?: boolean
}) {
  const texto = linhas.join('\n')
  return (
    <div className={`caixa-texto ${manual ? 'manual' : ''}`}>
      {!semLapis && (
        manual ? (
          <button type="button" className="lapis ativo" aria-label="Voltar ao texto automático" title="Voltar ao texto automático"
            onClick={() => { if (window.confirm('Voltar ao texto automático? O que você escreveu à mão será descartado.')) onRestaurar() }}>↺</button>
        ) : (
          <button type="button" className="lapis" aria-label="Escrever este texto à mão" title="Escrever à mão" onClick={onAtivar}>✎</button>
        )
      )}
      <div className="texto-oficial" style={{ textAlign: alinhamento === 'centro' ? 'center' : alinhamento === 'direita' ? 'right' : 'left' }}>
        {titulo && <div className="linha-texto" style={{ fontWeight: 700 }}>{titulo}</div>}
        {manual ? (
          <>
            <textarea
              aria-label="Texto escrito à mão"
              className="area-manual"
              style={{ minHeight: Math.min(420, 52 + linhas.length * 26) }}
              value={texto}
              onChange={(e) => onChange(e.target.value.split('\n'))}
            />
            <BotaoMic onTexto={(t) => onChange(juntarDitado(texto, t).split('\n'))} />
          </>
        ) : (
          <TextoRico linhas={linhas} />
        )}
      </div>
    </div>
  )
}
