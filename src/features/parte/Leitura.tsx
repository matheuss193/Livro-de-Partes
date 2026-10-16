import { useCallback, useEffect, useState } from 'react'
import { formatarDataHora } from '../../data/localRepo'
import type { ParteGuardada, TipoRetificacao } from '../../data/repositorio'
import { CampoTexto, Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'

const NUMERAIS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const ROTULO_TIPO: Record<TipoRetificacao, string> = { retificacao: 'Retificação', errata: 'Errata', adendo: 'Adendo' }

export default function Leitura({ id, voltar }: { id: string; voltar: () => void }) {
  const { repo, usuario } = useApp()
  const [g, setG] = useState<ParteGuardada | undefined>()
  const [aberto, setAberto] = useState(false)
  const carregar = useCallback(() => { repo.obterParte(id).then(setG) }, [repo, id])
  useEffect(carregar, [carregar])

  if (!g) return <main className="pagina">Carregando…</main>

  return (
    <main className="pagina">
      <button className="pequeno" onClick={voltar}>← Início</button>
      <div className="cartao" style={{ marginTop: 10 }}>
        <h2>Parte nº {g.numero}/{g.ano} <span className={`selo ${g.status}`}>{g.status === 'encerrada' ? 'Encerrada' : g.status === 'vistada' ? 'Vistada' : 'Rascunho'}</span></h2>
        {g.encerradaEm && <p className="suave">Encerrada em {formatarDataHora(g.encerradaEm)} · hash {g.hash?.slice(0, 8)}</p>}
        <div className="texto-oficial">{g.textoFinal ?? 'Parte ainda em rascunho.'}</div>
      </div>

      {g.retificacoes.length > 0 && (
        <div className="cartao">
          <h2>Retificações, erratas e adendos</h2>
          {g.retificacoes.map((r) => (
            <div className="item-lista" key={r.numero}>
              <strong>{ROTULO_TIPO[r.tipo].toUpperCase()} nº {r.numero} – em {formatarDataHora(r.em)} – {r.autor}</strong>
              <div className="texto-oficial" style={{ border: 0, padding: '4px 0' }}>
                {r.tipo === 'adendo'
                  ? `Acrescente-se ao item ${r.item}${r.alinea ? `, alínea ${r.alinea}` : ''}: ${r.leiaSe}`
                  : `No item ${r.item}${r.alinea ? `, alínea ${r.alinea}` : ''}, onde se lê: "${r.ondeSeLe ?? ''}", leia-se: "${r.leiaSe}".`}
                {'\n'}Motivo: {r.motivo}
              </div>
              <span className="suave">hash {r.hash.slice(0, 8)}</span>
            </div>
          ))}
        </div>
      )}

      {g.status !== 'rascunho' && (
        aberto ? (
          <FormRetificacao
            autor={usuario.nomeGuerra}
            cancelar={() => setAberto(false)}
            salvar={async (r) => { await repo.adicionarRetificacao(id, r); setAberto(false); carregar() }}
          />
        ) : (
          <button className="largo" onClick={() => setAberto(true)}>Retificar / errata / adendo</button>
        )
      )}
    </main>
  )
}

function FormRetificacao({ autor, cancelar, salvar }: {
  autor: string
  cancelar: () => void
  salvar: (r: { tipo: TipoRetificacao; item: string; alinea?: string; ondeSeLe?: string; leiaSe: string; motivo: string; autor: string }) => Promise<void>
}) {
  const [tipo, setTipo] = useState<TipoRetificacao>('retificacao')
  const [item, setItem] = useState('VII')
  const [alinea, setAlinea] = useState('')
  const [ondeSeLe, setOnde] = useState('')
  const [leiaSe, setLeia] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  const valido = leiaSe.trim() && motivo.trim() && (tipo === 'adendo' || ondeSeLe.trim())
  return (
    <div className="cartao">
      <h2>Nova correção</h2>
      <p className="suave">A Parte original não é alterada: a correção é anexada ao final.</p>
      <Rotulo texto="Tipo">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoRetificacao)}>
          {(Object.keys(ROTULO_TIPO) as TipoRetificacao[]).map((t) => <option key={t} value={t}>{ROTULO_TIPO[t]}</option>)}
        </select>
      </Rotulo>
      <div className="linha">
        <Rotulo texto="Item">
          <select value={item} onChange={(e) => setItem(e.target.value)}>{NUMERAIS.map((n) => <option key={n}>{n}</option>)}</select>
        </Rotulo>
        <CampoTexto rotulo="Alínea (se houver)" valor={alinea} onChange={setAlinea} placeholder="b" />
      </div>
      {tipo !== 'adendo' && <CampoTexto rotulo="Onde se lê" valor={ondeSeLe} onChange={setOnde} />}
      <CampoTexto longo rotulo={tipo === 'adendo' ? 'Acrescente-se' : 'Leia-se'} valor={leiaSe} onChange={setLeia} />
      <CampoTexto longo rotulo="Motivo" valor={motivo} onChange={setMotivo} />
      {erro && <div className="aviso bloqueia">{erro}</div>}
      <div className="linha" style={{ marginTop: 10 }}>
        <button onClick={cancelar}>Cancelar</button>
        <button className="primario" disabled={!valido} onClick={async () => {
          try { await salvar({ tipo, item, alinea: alinea.trim() || undefined, ondeSeLe: tipo === 'adendo' ? undefined : ondeSeLe.trim(), leiaSe: leiaSe.trim(), motivo: motivo.trim(), autor }) }
          catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao salvar') }
        }}>Registrar</button>
      </div>
    </div>
  )
}
