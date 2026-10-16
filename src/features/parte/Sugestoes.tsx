/**
 * Painel recolhido de sugestões de participação: "para este serviço" (o app lê o que foi preenchido),
 * "do histórico" (o que mais se repetiu) e "modelos prontos" (rotina típica de um quartel).
 */
import { useMemo, useState } from 'react'
import { normalizar } from '../../domain/busca'
import type { ParteDatada } from '../../domain/manutencao'
import { CATEGORIAS_MODELO, MODELOS } from '../../domain/modelos'
import { clonarAlinea, sugerirParticipacoes, sugestoesDeContexto } from '../../domain/sugestoes'
import { textoAlinea } from '../../domain/textos'
import type { Alinea, Parte } from '../../domain/tipos'
import Recolher from '../../ui/Recolher'
import { useApp } from '../../ui/contexto'

type Aba = 'servico' | 'historico' | 'modelos'

export default function Sugestoes({ parte, historico, aoAdicionar }: {
  parte: Parte
  historico: ParteDatada[]
  aoAdicionar: (a: Alinea) => void
}) {
  const { cad } = useApp()
  const lista = parte.itens.participacao
  const contexto = useMemo(() => sugestoesDeContexto(parte, cad.equipes), [parte, cad.equipes])
  const doHistorico = useMemo(() => sugerirParticipacoes(historico, lista, 12), [historico, lista])
  const [aba, setAba] = useState<Aba | null>(null)
  const [busca, setBusca] = useState('')
  const [adicionado, setAdicionado] = useState('')

  const abaAtual: Aba = aba ?? (contexto.length ? 'servico' : 'modelos')
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  const casa = (t: string) => palavras.every((p) => normalizar(t).includes(p))
  const adicionar = (a: Alinea, id: string) => { aoAdicionar(clonarAlinea(a)); setAdicionado(id); setTimeout(() => setAdicionado((x) => (x === id ? '' : x)), 1800) }

  const total = contexto.length + doHistorico.length + MODELOS.length
  const resumo = contexto.length ? `${contexto.length} para este serviço · ${total} no total` : `${total} sugestões e modelos`

  return (
    <Recolher titulo="💡 Sugestões e modelos prontos" resumo={resumo} destaque={contexto.length > 0}>
      <div className="abas" role="tablist">
        {([['servico', `Para este serviço (${contexto.length})`], ['historico', `Histórico (${doHistorico.length})`], ['modelos', `Modelos (${MODELOS.length})`]] as [Aba, string][]).map(([k, rot]) => (
          <button key={k} type="button" role="tab" aria-selected={abaAtual === k} className={abaAtual === k ? 'primario pequeno' : 'pequeno'} onClick={() => setAba(k)}>{rot}</button>
        ))}
      </div>
      {abaAtual !== 'servico' && (
        <input type="search" aria-label="Buscar sugestão" placeholder="Buscar (ex.: avaria, energia, atestado)…" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ marginBottom: 8 }} />
      )}

      {abaAtual === 'servico' && (
        <>
          {contexto.length === 0 && <p className="suave">Nada a sugerir por enquanto. Conforme você preenche os itens (viaturas, guarnição...), o app aponta o que parece faltar aqui.</p>}
          {contexto.map((c, i) => (
            <div className="item-lista" key={i}>
              <div className="suave">{c.motivo}</div>
              <div>{textoAlinea(c.alinea)}</div>
              <button type="button" className="pequeno" style={{ marginTop: 6 }} onClick={() => adicionar(c.alinea, `c${i}`)}>{adicionado === `c${i}` ? '✓ Adicionada' : '+ Adicionar e completar'}</button>
            </div>
          ))}
        </>
      )}

      {abaAtual === 'historico' && (
        <>
          {doHistorico.filter((s) => casa(s.texto)).length === 0 && <p className="suave">Nada encontrado no histórico.</p>}
          {doHistorico.filter((s) => casa(s.texto)).map((s, i) => (
            <div className="item-lista" key={i}>
              <div>{s.texto}</div>
              <div className="suave">usada {s.vezes} {s.vezes === 1 ? 'vez' : 'vezes'} · última em {s.ultimaData.split('-').reverse().join('/')}</div>
              <button type="button" className="pequeno" style={{ marginTop: 6 }} onClick={() => adicionar(s.alinea, `h${i}`)}>{adicionado === `h${i}` ? '✓ Adicionada' : '+ Adicionar'}</button>
            </div>
          ))}
        </>
      )}

      {abaAtual === 'modelos' && (
        <>
          {CATEGORIAS_MODELO.map((cat) => {
            const itens = MODELOS.filter((m) => m.categoria === cat && casa(`${m.titulo} ${cat}`))
            if (itens.length === 0) return null
            return (
              <div key={cat}>
                <div className="rotulo-texto">{cat}</div>
                {itens.map((m) => (
                  <button key={m.id} type="button" className="modelo-linha" onClick={() => adicionar(m.alinea, m.id)}>
                    <span>{m.titulo}</span>
                    <span className="mais">{adicionado === m.id ? '✓' : '+'}</span>
                  </button>
                ))}
              </div>
            )
          })}
        </>
      )}
    </Recolher>
  )
}
