import { useCallback, useEffect, useMemo, useState } from 'react'
import { LocalRepo } from './data/localRepo'
import type { Militar } from './domain/tipos'
import { ordenarPorHierarquia, tratamento } from './domain/formatacao'
import { ProvedorApp, type Cadastros } from './ui/contexto'
import Inicio from './features/painel/Inicio'
import Editor from './features/parte/Editor'
import Leitura from './features/parte/Leitura'
import Painel from './features/painel/Painel'
import Guia from './features/guia/Guia'

type Tela = { nome: 'inicio' } | { nome: 'painel' } | { nome: 'editor'; id: string } | { nome: 'ler'; id: string }

const CHAVE_USUARIO = 'lp.usuarioId'
const CHAVE_GUIA = 'lp.guiaVisto'

function guiaJaVisto(): boolean {
  try { return localStorage.getItem(CHAVE_GUIA) === '1' } catch { return false }
}
function marcarGuiaVisto() {
  try { localStorage.setItem(CHAVE_GUIA, '1') } catch { /* sem armazenamento: o guia aparece de novo */ }
}

function lerUsuarioSalvo(): string | null {
  try { return localStorage.getItem(CHAVE_USUARIO) } catch { return null }
}
function gravarUsuario(id: string) {
  try { localStorage.setItem(CHAVE_USUARIO, id) } catch { /* sem armazenamento: ok */ }
}

export default function App() {
  const repo = useMemo(() => new LocalRepo(), [])
  const [cad, setCad] = useState<Cadastros | null>(null)
  const [usuarioId, setUsuarioId] = useState<string | null>(lerUsuarioSalvo())
  const [tela, setTela] = useState<Tela>({ nome: 'inicio' })
  const [guia, setGuia] = useState(!guiaJaVisto())

  const carregar = useCallback(async () => {
    const [unidade, militares, viaturas, equipamentos, documentos, naturezas] = await Promise.all([
      repo.obterUnidade(), repo.listarMilitares(), repo.listarViaturas(),
      repo.listarEquipamentos(), repo.listarDocumentosPadrao(), repo.listarNaturezas(),
    ])
    setCad({ unidade, militares: ordenarPorHierarquia(militares), viaturas, equipamentos, documentos, naturezas })
  }, [repo])

  useEffect(() => { void carregar() }, [carregar])

  const reiniciarDemo = async () => {
    await repo.reiniciarDemonstracao()
    await carregar()
    setTela({ nome: 'inicio' })
  }

  const exportarBackup = () => repo.exportarBackup()
  const importarBackup = async (texto: string) => {
    const r = await repo.importarBackup(texto)
    await carregar()
    setTela({ nome: 'inicio' })
    return r
  }

  if (!cad) return <div className="pagina">Carregando…</div>

  if (guia) {
    return (
      <Guia
        aoConcluir={() => { marcarGuiaVisto(); setGuia(false) }}
        exportarBackup={exportarBackup}
        importarBackup={importarBackup}
      />
    )
  }

  const usuario: Militar | undefined = cad.militares.find((m) => m.id === usuarioId)

  if (!usuario) {
    return (
      <>
        <header className="topo"><div className="marca"><img src={`${import.meta.env.BASE_URL}logo-cbmpa.png`} alt="CBMPA" /><h1>Livro de Partes Digital</h1></div></header>
        <main className="pagina">
          <div className="cartao">
            <h2>Quem é você?</h2>
            <p className="suave">Protótipo de demonstração: escolha um militar fictício para continuar.</p>
            <select value="" onChange={(e) => { setUsuarioId(e.target.value); gravarUsuario(e.target.value) }}>
              <option value="">— selecione —</option>
              {cad.militares.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
            </select>
          </div>
        </main>
      </>
    )
  }

  return (
    <ProvedorApp value={{ repo, cad, usuario, recarregar: carregar, reiniciarDemo, exportarBackup, importarBackup }}>
      <header className="topo">
        <div className="marca"><img src={`${import.meta.env.BASE_URL}logo-cbmpa.png`} alt="CBMPA" /><h1>Livro de Partes</h1></div>
        <select aria-label="Usuário" value={usuario.id} onChange={(e) => { setUsuarioId(e.target.value); gravarUsuario(e.target.value) }}>
          {cad.militares.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
        </select>
      </header>
      <div className="faixa-demo">Demonstração · dados fictícios · nada é enviado a servidor</div>
      {tela.nome === 'inicio' && (
        <Inicio abrirEditor={(id) => setTela({ nome: 'editor', id })} abrirLeitura={(id) => setTela({ nome: 'ler', id })} abrirPainel={() => setTela({ nome: 'painel' })} abrirGuia={() => setGuia(true)} />
      )}
      {tela.nome === 'editor' && (
        <Editor id={tela.id} voltar={() => setTela({ nome: 'inicio' })} aoEncerrar={(id) => setTela({ nome: 'ler', id })} />
      )}
      {tela.nome === 'painel' && <Painel voltar={() => setTela({ nome: 'inicio' })} abrirLeitura={(id) => setTela({ nome: 'ler', id })} />}
      {tela.nome === 'ler' && <Leitura id={tela.id} voltar={() => setTela({ nome: 'inicio' })} />}
    </ProvedorApp>
  )
}
