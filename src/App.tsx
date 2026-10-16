import { useCallback, useEffect, useMemo, useState } from 'react'
import { LocalRepo } from './data/localRepo'
import type { Militar } from './domain/tipos'
import { ordenarPorHierarquia, tratamento } from './domain/formatacao'
import { ProvedorApp, type Cadastros } from './ui/contexto'
import Inicio from './features/painel/Inicio'
import Editor from './features/parte/Editor'
import Leitura from './features/parte/Leitura'

type Tela = { nome: 'inicio' } | { nome: 'editor'; id: string } | { nome: 'ler'; id: string }

const CHAVE_USUARIO = 'lp.usuarioId'

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

  if (!cad) return <div className="pagina">Carregando…</div>

  const usuario: Militar | undefined = cad.militares.find((m) => m.id === usuarioId)

  if (!usuario) {
    return (
      <>
        <header className="topo"><div className="marca"><img src="/logo-cbmpa.png" alt="CBMPA" /><h1>Livro de Partes Digital</h1></div></header>
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
    <ProvedorApp value={{ repo, cad, usuario, recarregar: carregar, reiniciarDemo }}>
      <header className="topo">
        <div className="marca"><img src="/logo-cbmpa.png" alt="CBMPA" /><h1>Livro de Partes</h1></div>
        <select aria-label="Usuário" value={usuario.id} onChange={(e) => { setUsuarioId(e.target.value); gravarUsuario(e.target.value) }}>
          {cad.militares.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
        </select>
      </header>
      <div className="faixa-demo">Demonstração · dados fictícios · nada é enviado a servidor</div>
      {tela.nome === 'inicio' && (
        <Inicio abrirEditor={(id) => setTela({ nome: 'editor', id })} abrirLeitura={(id) => setTela({ nome: 'ler', id })} />
      )}
      {tela.nome === 'editor' && (
        <Editor id={tela.id} voltar={() => setTela({ nome: 'inicio' })} aoEncerrar={(id) => setTela({ nome: 'ler', id })} />
      )}
      {tela.nome === 'ler' && <Leitura id={tela.id} voltar={() => setTela({ nome: 'inicio' })} />}
    </ProvedorApp>
  )
}
