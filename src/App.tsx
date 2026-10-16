import { useEffect, useMemo, useState } from 'react'
import { LocalRepo } from './data/localRepo'
import type { Militar } from './domain/tipos'
import { tratamento } from './domain/formatacao'
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

  useEffect(() => {
    let vivo = true
    Promise.all([
      repo.obterUnidade(), repo.listarMilitares(), repo.listarViaturas(),
      repo.listarEquipamentos(), repo.listarDocumentosPadrao(), repo.listarNaturezas(),
    ]).then(([unidade, militares, viaturas, equipamentos, documentos, naturezas]) => {
      if (vivo) setCad({ unidade, militares, viaturas, equipamentos, documentos, naturezas })
    })
    return () => { vivo = false }
  }, [repo])

  if (!cad) return <div className="pagina">Carregando…</div>

  const usuario: Militar | undefined = cad.militares.find((m) => m.id === usuarioId)

  if (!usuario) {
    return (
      <>
        <header className="topo"><h1>Livro de Partes Digital</h1></header>
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
    <ProvedorApp value={{ repo, cad, usuario }}>
      <header className="topo">
        <h1>Livro de Partes · {cad.unidade.nome}</h1>
        <select aria-label="Usuário" value={usuario.id} onChange={(e) => { setUsuarioId(e.target.value); gravarUsuario(e.target.value) }}>
          {cad.militares.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
        </select>
      </header>
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
