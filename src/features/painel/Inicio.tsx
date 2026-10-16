import { useCallback, useEffect, useState } from 'react'
import type { ParteGuardada } from '../../data/repositorio'
import { dataPorExtenso, ehOficial } from '../../domain/formatacao'
import { pendenciasDaParte } from '../../domain/pendencias'
import { useApp } from '../../ui/contexto'
import { criarParteNova } from '../parte/novaParte'

const ROTULO_STATUS = { rascunho: 'Rascunho', encerrada: 'Aguarda visto', vistada: 'Vistada' } as const

export default function Inicio({ abrirEditor, abrirLeitura, abrirPainel, abrirGuia, abrirBusca }: { abrirEditor: (id: string) => void; abrirLeitura: (id: string) => void; abrirPainel: () => void; abrirGuia: () => void; abrirBusca: () => void }) {
  const { repo, cad, usuario, reiniciarDemo } = useApp()
  const [partes, setPartes] = useState<ParteGuardada[] | null>(null)
  const [erro, setErro] = useState('')
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false)
  const [verTodas, setVerTodas] = useState(false)

  const carregar = useCallback(() => { repo.listarPartes().then(setPartes) }, [repo])
  useEffect(carregar, [carregar])

  if (!partes) return <main className="pagina">Carregando…</main>

  const oficial = ehOficial(usuario)
  const rascunho = partes.find((p) => p.status === 'rascunho')
  const encerradas = partes.filter((p) => p.status !== 'rascunho')
  const aguardandoVisto = encerradas.filter((p) => p.status === 'encerrada')
  const pendencias = encerradas[0] ? pendenciasDaParte(encerradas[0].parte) : []

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
      <div className="logos-inicio">
        <img src={`${import.meta.env.BASE_URL}logo-cbmpa.png`} alt="Corpo de Bombeiros Militar do Pará" />
        <img src={`${import.meta.env.BASE_URL}logo-defesa-civil.png`} alt="Defesa Civil do Pará" />
      </div>

      <button className="largo" style={{ marginBottom: 12 }} onClick={abrirBusca}>🔍 Buscar no histórico</button>

      {oficial && <button className="primario largo" style={{ marginBottom: 12 }} onClick={abrirPainel}>Painel do comando (gráficos)</button>}

      {oficial && aguardandoVisto.length > 0 && (
        <div className="cartao destaque">
          <h2>Aguardando seu visto ({aguardandoVisto.length})</h2>
          {aguardandoVisto.map((p) => (
            <button key={p.id} className="primario largo" style={{ marginBottom: 8, textAlign: 'left' }} onClick={() => abrirLeitura(p.id)}>
              Parte nº {p.numero} · {dataPorExtenso(p.dataServico)}
            </button>
          ))}
        </div>
      )}

      {!oficial && (
        <div className="cartao">
          <h2>Parte de hoje</h2>
          {rascunho ? (
            <>
              <p>Há um rascunho em andamento: <strong>Parte nº {rascunho.numero}</strong> de {dataPorExtenso(rascunho.dataServico)}.</p>
              <button className="primario largo" onClick={() => abrirEditor(rascunho.id)}>Continuar a Parte nº {rascunho.numero}</button>
            </>
          ) : (
            <>
              <p className="suave">Os campos já vêm preenchidos com a Parte anterior (antecessor, energia, Km, equipamentos).</p>
              <button className="primario largo" onClick={criar}>Começar nova Parte</button>
            </>
          )}
          {erro && <div className="aviso bloqueia">{erro}</div>}
        </div>
      )}
      {oficial && <p className="suave">Você entrou como oficial: lê as Partes, dá o visto e pede retificação. Para redigir uma Parte, escolha um sargento no topo.</p>}

      {pendencias.length > 0 && (
        <div className="cartao alerta">
          <h2>Atenção · última Parte (nº {encerradas[0].numero})</h2>
          {pendencias.map((p, i) => <div className="aviso forte" key={i}>{p.texto}</div>)}
        </div>
      )}

      <div className="cartao">
        <h2>Últimas Partes</h2>
        {encerradas.length === 0 && <p className="suave">Nenhuma Parte encerrada ainda.</p>}
        {(verTodas ? encerradas : encerradas.slice(0, 5)).map((p) => (
          <button key={p.id} className="largo item-parte" onClick={() => abrirLeitura(p.id)}>
            <span><strong>Parte nº {p.numero}</strong> · {dataPorExtenso(p.dataServico)}</span>
            <span className={`selo ${p.status}`}>{ROTULO_STATUS[p.status]}</span>
          </button>
        ))}
      </div>

      {encerradas.length > 5 && <button className="largo pequeno" style={{ marginBottom: 12 }} onClick={() => setVerTodas(!verTodas)}>{verTodas ? 'Mostrar só as 5 últimas' : `Ver todas as ${encerradas.length} Partes`}</button>}

      <div className="cartao">
        <h3>Aparelho e arquivos</h3>
        <p className="suave">Instalar o app, escolher onde salvar os PDFs e fazer backup dos dados.</p>
        <button className="largo" onClick={abrirGuia}>Guia de instalação, arquivos e backup</button>
      </div>

      <div className="cartao">
        <h3>Demonstração</h3>
        {!confirmandoReinicio ? (
          <button className="pequeno" onClick={() => setConfirmandoReinicio(true)}>Reiniciar demonstração</button>
        ) : (
          <div className="aviso">
            Apaga tudo o que foi feito neste aparelho e volta às Partes nº 199 e 200 de exemplo.
            <div className="linha" style={{ marginTop: 6 }}>
              <button className="perigo pequeno" onClick={async () => { await reiniciarDemo(); carregar(); setConfirmandoReinicio(false) }}>Apagar e reiniciar</button>
              <button className="pequeno" onClick={() => setConfirmandoReinicio(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
