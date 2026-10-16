/** Gráficos simples em SVG/HTML (sem biblioteca): leves, funcionam offline e imprimem bem. */

export interface PontoBarra {
  rotulo: string
  valor: number
  /** Texto de apoio ao tocar/ler (acessibilidade). */
  detalhe?: string
}

/** Arredonda o topo da escala para um número "redondo" (ex.: 9,4 vira 10). */
function topoDaEscala(max: number): number {
  if (max <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(max)))
  const f = max / exp
  const passo = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10
  return passo * exp
}

export function BarrasVerticais({ titulo, pontos, cor, unidade, referencia }: {
  titulo: string
  pontos: PontoBarra[]
  cor: string
  unidade: string
  /** Linha tracejada de referência (ex.: limite usual de consumo). */
  referencia?: { valor: number; rotulo: string }
}) {
  const largura = 360
  const altura = 190
  const margem = { e: 30, d: 8, t: 16, b: 24 }
  const topo = topoDaEscala(Math.max(...pontos.map((p) => p.valor), referencia?.valor ?? 0))
  const area = { l: largura - margem.e - margem.d, a: altura - margem.t - margem.b }
  const passo = pontos.length ? area.l / pontos.length : area.l
  const larg = Math.min(26, passo * 0.64)
  const y = (v: number) => margem.t + area.a - (v / topo) * area.a
  const resumo = `${titulo}: ${pontos.map((p) => `${p.rotulo}: ${p.valor.toLocaleString('pt-BR')} ${unidade}`).join('; ')}`

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={resumo} className="grafico">
      <title>{resumo}</title>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={margem.e} x2={largura - margem.d} y1={y(topo * f)} y2={y(topo * f)} stroke="#d8d2c6" strokeWidth="1" />
          <text x={margem.e - 4} y={y(topo * f) + 4} textAnchor="end" fontSize="10" fill="#5c5c5c">{Math.round(topo * f * 10) / 10}</text>
        </g>
      ))}
      {pontos.map((p, i) => {
        const x = margem.e + i * passo + (passo - larg) / 2
        const h = Math.max(1, margem.t + area.a - y(p.valor))
        return (
          <g key={i}>
            <rect x={x} y={margem.t + area.a - h} width={larg} height={h} rx="3" fill={cor}><title>{`${p.rotulo}: ${p.valor.toLocaleString('pt-BR')} ${unidade}${p.detalhe ? ` · ${p.detalhe}` : ''}`}</title></rect>
            {pontos.length <= 14 && <text x={x + larg / 2} y={margem.t + area.a - h - 3} textAnchor="middle" fontSize="9" fill="#1b1b1b">{Math.round(p.valor * 10) / 10}</text>}
            <text x={x + larg / 2} y={altura - 8} textAnchor="middle" fontSize="9.5" fill="#5c5c5c">{p.rotulo}</text>
          </g>
        )
      })}
      {referencia && (
        <g>
          <line x1={margem.e} x2={largura - margem.d} y1={y(referencia.valor)} y2={y(referencia.valor)} stroke="#b3261e" strokeWidth="1.2" strokeDasharray="5 4" />
          <text x={largura - margem.d} y={y(referencia.valor) - 3} textAnchor="end" fontSize="9" fill="#b3261e">{referencia.rotulo}</text>
        </g>
      )}
    </svg>
  )
}

export interface LinhaBarra {
  rotulo: string
  valor: number
  cor: string
  /** Texto à direita da barra (ex.: "12 · 31%"). */
  texto?: string
}

/** Barras horizontais em HTML (o texto quebra bem no celular e é lido por leitores de tela). */
export function BarrasHorizontais({ linhas }: { linhas: LinhaBarra[] }) {
  const max = Math.max(1, ...linhas.map((l) => l.valor))
  return (
    <div className="barras-h">
      {linhas.map((l) => (
        <div className="barra-h" key={l.rotulo}>
          <div className="barra-h-rotulo">{l.rotulo}</div>
          <div className="barra-h-trilho" aria-hidden>
            <div className="barra-h-preenchida" style={{ width: `${(l.valor / max) * 100}%`, background: l.cor }} />
          </div>
          <div className="barra-h-valor">{l.texto ?? l.valor}</div>
        </div>
      ))}
    </div>
  )
}
