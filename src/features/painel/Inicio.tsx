import { useCallback, useEffect, useState } from 'react'
import type { ParteGuardada } from '../../data/repositorio'
import { dataPorExtenso } from '../../domain/formatacao'
import { useApp } from '../../ui/contexto'
import { criarParteNova } from '../parte/novaParte'

export default function Inicio({ abrirEditor, abrirLeitura }: { abrirEditor: (id: string) => void; abrirLeitura: (id: string) => void }) {
  const { repo, cad, usuario } = useApp()
  const [partes, setPartes] = useState<ParteGuardada[] | null>(null)
  const [erro, setErro] = useState('')

  const carregar = useCallback(() => { repo.listarPartes().then(setPartes) }, [repo])
  useEffect(carregar, [carregar])

  if (!partes) return <main className="pagina">Carregando…</main>

  const rascunho = partes.find((p) => p.status === 'rascunho')

  async function criar() {
    setErro('')
    try {
      const ultima = await repo.ultimaEncerrada()
      const nova = await repo.salvarRascunho(criarParteNova(usuario, cad, ultima))
      abrirEditor(nova.id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a Parte.')
    }
  }

  return (
    <main className="pagina">
      <div className="cartao">
        <h2>Parte de hoje</h2>
        {rascunho ? (
          <>
            <p>Há um rascunho em andamento: <strong>Parte nº {rascunho.numero}</strong> de {dataPorExtenso(rascunho.dataServico)}.</p>
            <button className="primario largo" onClick={() => abrirEditor(rascunho.id)}>Continuar a Parte nº {rascunho.numero}</button>
          </>
        ) : (
          <>
            <p className="suave">Os campos virão pré-preenchidos com a Parte anterior.</p>
            <button className="primario largo" onClick={criar}>Começar nova Parte</button>
          </>
        )}
        {erro && <div className="aviso bloqueia">{erro}</div>}
      </div>

      <div className="cartao">
        <h2>Últimas Partes</h2>
        {partes.filter((p) => p.status !== 'rascunho').length === 0 && <p className="suave">Nenhuma Parte encerrada ainda.</p>}
        {partes.filter((p) => p.status !== 'rascunho').map((p) => (
          <button key={p.id} className="largo" style={{ marginBottom: 8, textAlign: 'left' }} onClick={() => abrirLeitura(p.id)}>
            Parte nº {p.numero} · {dataPorExtenso(p.dataServico)}
            {p.retificacoes.length > 0 && ` · ${p.retificacoes.length} retificação(ões)`}
          </button>
        ))}
      </div>
    </main>
  )
}
