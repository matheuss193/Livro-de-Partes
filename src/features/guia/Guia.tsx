/**
 * Guia de primeiro acesso: (1) boas-vindas e compatibilidade, (2) instalar no aparelho,
 * (3) onde salvar os arquivos, (4) proteger os dados (armazenamento fixo e backup).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { avaliarCompatibilidade, detectarDispositivo, type Dispositivo } from '../../domain/dispositivo'
import {
  compartilharArquivo, escolherPasta, esquecerPasta, pastaEscolhida, pastaSuportada, podeCompartilharArquivos, salvarArquivo, textoResultado,
} from '../../pdf/destino'
import { aoMudarInstalacao, estaInstalado, instalarAgora, podeInstalarAgora } from '../../ui/instalar'
import { instrucaoArquivos, instrucaoInstalacao, type Instrucao } from './instrucoes'

export function dispositivoAtual(): Dispositivo {
  return detectarDispositivo({
    userAgent: navigator.userAgent,
    plataforma: navigator.platform,
    toquesMaximos: navigator.maxTouchPoints,
    standalone: estaInstalado(),
  })
}

const NOMES_SO = { ios: 'iPhone/iPad', android: 'Android', windows: 'Windows', mac: 'Mac', linux: 'Linux', outro: 'este aparelho' } as const
const NOMES_NAV = { safari: 'Safari', chrome: 'Chrome', samsung: 'Samsung Internet', firefox: 'Firefox', edge: 'Edge', opera: 'Opera', outro: 'o navegador' } as const

function ListaPassos({ i }: { i: Instrucao }) {
  return (
    <>
      <h3>{i.titulo}</h3>
      <ol className="passos-guia">
        {i.passos.map((p, k) => <li key={k}>{p}</li>)}
      </ol>
      {i.nota && <div className="aviso">{i.nota}</div>}
    </>
  )
}

export default function Guia({ aoConcluir, exportarBackup, importarBackup }: {
  aoConcluir: () => void
  exportarBackup: () => Promise<Blob>
  importarBackup: (texto: string) => Promise<{ partes: number }>
}) {
  const d = useMemo(dispositivoAtual, [])
  const compat = useMemo(() => avaliarCompatibilidade(d), [d])
  const [passo, setPasso] = useState(0)
  const [conviteNovo, setConviteNovo] = useState(0)
  const [pasta, setPasta] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [protegido, setProtegido] = useState<string>('')
  const arquivoRef = useRef<HTMLInputElement>(null)
  // Pasta fixa só no computador: celulares (Android e iPhone) não oferecem essa função aos sites.
  const noComputador = pastaSuportada() && !d.celular && d.so !== 'ios' && d.so !== 'android'

  useEffect(() => aoMudarInstalacao(() => setConviteNovo((n) => n + 1)), [])
  useEffect(() => { void pastaEscolhida().then(setPasta) }, [])
  useEffect(() => {
    void navigator.storage?.persisted?.().then((p) => setProtegido(p ? 'Armazenamento protegido: ativo.' : ''))
  }, [])

  const TOTAL = 4
  const podeConvite = conviteNovo >= 0 && podeInstalarAgora()

  async function testar(compartilhar: boolean) {
    setMsg('')
    try {
      const blob = new Blob(['Teste do Livro de Partes: se você abriu este arquivo, o local de salvamento está funcionando.'], { type: 'text/plain' })
      const r = compartilhar ? await compartilharArquivo(blob, 'Teste-Livro-de-Partes.txt', 'Teste do Livro de Partes') : await salvarArquivo(blob, 'Teste-Livro-de-Partes.txt')
      setMsg(textoResultado(r))
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setMsg('Não foi possível salvar o arquivo de teste.')
    }
  }

  async function backupAgora() {
    setMsg('')
    try {
      const blob = await exportarBackup()
      const nome = `Livro-de-Partes-backup-${new Date().toISOString().slice(0, 10)}.json`
      const r = await salvarArquivo(blob, nome)
      setMsg(`Backup feito. ${textoResultado(r)}`)
    } catch {
      setMsg('Não foi possível gerar o backup.')
    }
  }

  async function restaurar(arquivo: File | undefined) {
    if (!arquivo) return
    if (!window.confirm('Restaurar o backup substitui os dados deste aparelho pelos do arquivo. Continuar?')) return
    try {
      const r = await importarBackup(await arquivo.text())
      setMsg(`Backup restaurado: ${r.partes} Parte(s).`)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Não foi possível restaurar.')
    }
    if (arquivoRef.current) arquivoRef.current.value = ''
  }

  return (
    <div className="guia" role="dialog" aria-modal="true" aria-label="Guia de primeiro acesso">
      <header className="topo"><div className="marca"><h1>Primeiros passos</h1></div><span>{passo + 1} de {TOTAL}</span></header>
      <main className="pagina">
        <div className="barra-progresso" aria-hidden><div style={{ width: `${((passo + 1) / TOTAL) * 100}%` }} /></div>

        {passo === 0 && (
          <div className="cartao">
            <h2>Bem-vindo ao Livro de Partes Digital</h2>
            <p>Em 3 passos rápidos você deixa o aplicativo pronto neste aparelho: <strong>instalar</strong>, escolher <strong>onde salvar os arquivos</strong> e <strong>proteger os dados</strong>.</p>
            <p className="suave">Aparelho detectado: {NOMES_SO[d.so]}{d.versaoSo ? ` ${d.versaoSo}` : ''} · {NOMES_NAV[d.navegador]}{d.versaoNavegador ? ` ${d.versaoNavegador}` : ''}{d.instalado ? ' · app instalado' : ''}.</p>
            {compat.nivel === 'plena' && <p className="ok">Este aparelho é compatível com todos os recursos.</p>}
            {compat.nivel !== 'plena' && (
              <div className={`aviso ${compat.nivel === 'antigo' ? 'forte' : ''}`}>
                <strong>{compat.nivel === 'antigo' ? 'Aparelho ou navegador antigo.' : 'Compatível, com algumas limitações.'}</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{compat.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        )}

        {passo === 1 && (
          <div className="cartao">
            <h2>1. Instalar no aparelho</h2>
            <p className="suave">Instalado, o app abre pelo ícone, em tela cheia, e funciona sem internet.</p>
            {podeConvite && !d.instalado && (
              <button className="primario largo" style={{ marginBottom: 10 }} onClick={async () => { const r = await instalarAgora(); setMsg(r === 'accepted' ? 'Instalado! Procure o ícone na tela inicial.' : '') }}>Instalar agora</button>
            )}
            <ListaPassos i={instrucaoInstalacao(d)} />
          </div>
        )}

        {passo === 2 && (
          <div className="cartao">
            <h2>2. Onde salvar os arquivos</h2>
            <p className="suave">PDFs das Partes e backups.</p>
            <ListaPassos i={instrucaoArquivos(d, noComputador)} />
            {noComputador && (
              <div style={{ marginTop: 8 }}>
                {pasta && <p>Pasta escolhida: <strong>{pasta}</strong></p>}
                <div className="linha">
                  <button className="primario" onClick={async () => { try { setPasta(await escolherPasta()); setMsg('') } catch { /* cancelou */ } }}>{pasta ? 'Trocar a pasta' : 'Escolher a pasta'}</button>
                  {pasta && <button className="fixo" onClick={async () => { await esquecerPasta(); setPasta(null) }}>Usar downloads do navegador</button>}
                </div>
              </div>
            )}
            <div className="linha" style={{ marginTop: 10 }}>
              <button onClick={() => testar(false)}>Salvar um arquivo de teste</button>
              {podeCompartilharArquivos() && <button onClick={() => testar(true)}>Testar "Compartilhar"</button>}
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="cartao">
            <h2>3. Proteger os dados</h2>
            <p>Os dados ficam <strong>somente neste aparelho</strong> (nada vai para servidor). Por isso:</p>
            <ul className="passos-guia">
              <li>Instale o app na tela inicial (passo 1). No iPhone, isso evita que o Safari apague os dados por falta de uso.</li>
              <li>Faça um <strong>backup</strong> de vez em quando e guarde o arquivo em local seguro.</li>
            </ul>
            <div className="linha">
              <button onClick={async () => { const ok = (await navigator.storage?.persist?.()) ?? false; setProtegido(ok ? 'Armazenamento protegido: ativo.' : 'O navegador não concedeu. Instalar o app na tela inicial ajuda.') }}>Proteger o armazenamento</button>
              <button className="primario" onClick={backupAgora}>Fazer backup agora</button>
            </div>
            {protegido && <p className="suave">{protegido}</p>}
            <p className="suave" style={{ marginBottom: 4 }}>Já tem um backup? Restaure aqui (substitui os dados deste aparelho):</p>
            <input ref={arquivoRef} type="file" accept="application/json,.json" onChange={(e) => restaurar(e.target.files?.[0])} />
          </div>
        )}

        {msg && <div className="aviso" role="status">{msg}</div>}
      </main>

      <nav className="rodape-fixo">
        {passo > 0 ? <button onClick={() => { setPasso(passo - 1); setMsg('') }}>← Voltar</button> : <button onClick={aoConcluir}>Pular</button>}
        {passo < TOTAL - 1 ? <button className="primario" onClick={() => { setPasso(passo + 1); setMsg('') }}>Próximo →</button> : <button className="primario" onClick={aoConcluir}>Concluir</button>}
      </nav>
    </div>
  )
}
