import { useEffect, useMemo, useState } from 'react'
import type { ParteGuardada } from '../../data/repositorio'
import { buscar, destacar } from '../../domain/busca'
import { dataPorExtenso } from '../../domain/formatacao'
import { gerarTextoOficial } from '../../domain/textos'
import { useApp } from '../../ui/contexto'

const ROTULO_STATUS = { rascunho: 'Rascunho', encerrada: 'Aguarda visto', vistada: 'Vistada' } as const
const SUGESTOES = ['motosserra', 'freio', 'ar-condicionado', 'abastecida', 'permuta', 'visita', 'alarme']

function Destacado({ texto, termo }: { texto: string; termo: string }) {
  return <>{destacar(texto, termo).map((p, i) => (p.marcado ? <mark key={i}>{p.texto}</mark> : <span key={i}>{p.texto}</span>))}</>
}

export default function Busca({ voltar, abrirLeitura }: { voltar: () => void; abrirLeitura: (id: string) => void }) {
  const { repo, cad } = useApp()
  const [partes, setPartes] = useState<ParteGuardada[]>([])
  const [termo, setTermo] = useState('')
  useEffect(() => { repo.listarPartes().then(setPartes) }, [repo])

  const resultados = useMemo(
    () => buscar(partes, termo, (g) => gerarTextoOficial(g.parte, cad.unidade)),
    [partes, termo, cad.unidade],
  )
  const total = resultados.reduce((s, r) => s + r.total, 0)

  return (
    <main className="pagina">
      <button className="pequeno" onClick={voltar}>← Início</button>
      <h2 style={{ margin: '10px 0 2px' }}>Buscar no histórico</h2>
      <p className="suave" style={{ marginTop: 0 }}>Procura em todas as Partes, retificações e vistos. Não importa acento nem maiúscula; várias palavras precisam estar na mesma linha.</p>
      <input
        type="search"
        autoFocus
        aria-label="Palavra ou frase para buscar"
        placeholder="Ex.: freio, motosserra, ar-condicionado, Anapu"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
      />
      <div className="chips" style={{ marginTop: 8 }}>
        {SUGESTOES.map((s) => <button key={s} className="pequeno" onClick={() => setTermo(s)}>{s}</button>)}
      </div>

      {termo.trim().length >= 2 && (
        <p className="suave" role="status">
          {resultados.length === 0 ? 'Nada encontrado.' : `${total} ocorrência(s) em ${resultados.length} Parte(s).`}
        </p>
      )}

      {resultados.map((r) => (
        <div className="cartao" key={r.id}>
          <button className="largo item-parte" onClick={() => abrirLeitura(r.id)}>
            <span><strong>Parte nº {r.numero}</strong> · {dataPorExtenso(r.dataServico)}</span>
            <span className={`selo ${r.status}`}>{ROTULO_STATUS[r.status]}</span>
          </button>
          {r.trechos.map((t, i) => (
            <div className="trecho" key={i}>
              <span className="selo">{t.item}</span> <Destacado texto={t.texto} termo={termo} />
            </div>
          ))}
          {r.total > r.trechos.length && <p className="suave">+ {r.total - r.trechos.length} outras linhas nesta Parte.</p>}
        </div>
      ))}
    </main>
  )
}
