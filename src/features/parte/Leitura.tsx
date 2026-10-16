import { useCallback, useEffect, useState } from 'react'
import { formatarDataHora } from '../../data/localRepo'
import type { AnexoMeta, ParteGuardada, TipoRetificacao, Visto } from '../../data/repositorio'
import { abrirAnexo } from './Anexos'
import { podeCompartilharArquivos, textoResultado } from '../../pdf/destino'
import { ehOficial } from '../../domain/formatacao'
import { pendenciasDaParte } from '../../domain/pendencias'
import { letraAlinea, textoAlinea } from '../../domain/textos'
import { pinValido } from '../../domain/assinatura'
import { CampoPin, CampoTexto, Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'
import { TextoRico } from '../../ui/CaixaTexto'

const NUMERAIS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const ROTULO_TIPO: Record<TipoRetificacao, string> = { retificacao: 'Retificação', errata: 'Errata', adendo: 'Adendo' }

export default function Leitura({ id, voltar }: { id: string; voltar: () => void }) {
  const { repo, usuario } = useApp()
  const [g, setG] = useState<ParteGuardada | undefined>()
  const [aberto, setAberto] = useState(false)
  const carregar = useCallback(() => { repo.obterParte(id).then(setG) }, [repo, id])
  useEffect(carregar, [carregar])

  if (!g) return <main className="pagina">Carregando…</main>
  const oficial = ehOficial(usuario)
  const pendencias = pendenciasDaParte(g.parte)

  return (
    <main className="pagina">
      <button className="pequeno" onClick={voltar}>← Início</button>
      <div className="cartao" style={{ marginTop: 10 }}>
        <h2>
          Parte nº {g.numero}/{g.ano}{' '}
          <span className={`selo ${g.status}`}>{g.status === 'encerrada' ? 'Aguarda visto' : g.status === 'vistada' ? 'Vistada' : 'Rascunho'}</span>
        </h2>
        {g.encerradaEm && <p className="suave">Encerrada em {formatarDataHora(g.encerradaEm)} · hash {g.hash?.slice(0, 8)}</p>}
        <div className="texto-oficial">{g.textoFinal ? <TextoRico linhas={g.textoFinal.split('\n')} /> : 'Parte ainda em rascunho.'}</div>
      </div>

      <BotoesPdf g={g} />

      {pendencias.length > 0 && (
        <div className="cartao alerta">
          <h2>Atenção</h2>
          {pendencias.map((p, i) => <div className="aviso forte" key={i}>{p.texto}</div>)}
        </div>
      )}

      {g.visto && <ResumoVisto visto={g.visto} g={g} />}

      {g.solicitacoes && g.solicitacoes.length > 0 && (
        <div className="cartao alerta">
          <h2>Retificação solicitada pelo oficial</h2>
          {g.solicitacoes.map((s) => (
            <div className="item-lista" key={s.numero}>
              <strong>{s.oficial} · {formatarDataHora(s.em)}</strong>
              <div>{s.motivo}</div>
            </div>
          ))}
          <p className="suave">O autor responde registrando uma retificação, errata ou adendo abaixo. A Parte original não muda.</p>
        </div>
      )}

      {oficial && g.status === 'encerrada' && (
        <PainelVisto g={g} aoSalvar={carregar} />
      )}
      {oficial && g.status !== 'rascunho' && <SolicitarRetificacao g={g} aoSalvar={carregar} />}

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

      {usuario.id === g.parte.autor.id && g.status !== 'rascunho' && (
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

function ResumoVisto({ visto, g }: { visto: Visto; g: ParteGuardada }) {
  const alineas = Object.entries(visto.alineas).filter(([, v]) => v.ciente || v.providencia)
  return (
    <div className="cartao" style={{ borderColor: 'var(--cor-principal)' }}>
      <h2>Visto</h2>
      <p>
        Visto assinado eletronicamente por <strong>{visto.assinaturaNome ?? visto.oficial}</strong> em {formatarDataHora(visto.em)}.
      </p>
      {visto.hash && <p className="suave">Código de verificação do visto: {visto.hash.slice(0, 8)}</p>}
      {visto.despacho && <div className="texto-oficial">Despacho: {visto.despacho}</div>}
      {alineas.map(([letra, v]) => {
        const idx = letra.charCodeAt(0) - 97
        const al = g.parte.itens.participacao[idx]
        return (
          <div className="item-lista" key={letra}>
            <strong>Alínea {letra})</strong> {v.ciente ? '· ciente' : ''} {al && <span className="suave">— {textoAlinea(al).slice(0, 80)}…</span>}
            {v.providencia && <div>Providência: {v.providencia}</div>}
          </div>
        )
      })}
    </div>
  )
}

function PainelVisto({ g, aoSalvar }: { g: ParteGuardada; aoSalvar: () => void }) {
  const { repo, usuario } = useApp()
  const alineas = g.parte.ajustes?.secoes?.VII ? [] : g.parte.itens.participacao
  const [ciente, setCiente] = useState<Record<string, boolean>>({})
  const [prov, setProv] = useState<Record<string, string>>({})
  const [despacho, setDespacho] = useState('')
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  return (
    <div className="cartao destaque">
      <h2>Visto do SubComandante</h2>
      <p className="suave">Assinatura eletrônica: substitui a rubrica no livro e aparece no PDF abaixo da assinatura do Comandante do Socorro. O conteúdo da Parte não é alterado.</p>
      {alineas.length > 0 && <label>Participação (item VII): ciente / providência</label>}
      {alineas.map((a, i) => {
        const letra = letraAlinea(i)
        return (
          <div className="item-lista" key={letra}>
            <div className="suave">{letra}) {textoAlinea(a).slice(0, 110)}{textoAlinea(a).length > 110 ? '…' : ''}</div>
            <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
              <input type="checkbox" checked={!!ciente[letra]} onChange={(e) => setCiente({ ...ciente, [letra]: e.target.checked })} />
              Ciente
            </label>
            <CampoTexto rotulo="Providência (opcional)" valor={prov[letra] ?? ''} onChange={(v) => setProv({ ...prov, [letra]: v })} />
          </div>
        )
      })}
      <CampoTexto longo rotulo="Despacho geral (opcional)" valor={despacho} onChange={setDespacho} />
      <CampoPin valor={pin} onChange={setPin} />
      {erro && <div className="aviso bloqueia">{erro}</div>}
      <button className="primario largo" disabled={ocupado || !pinValido(pin)} onClick={async () => {
        setOcupado(true); setErro('')
        try {
          const registro: Visto['alineas'] = {}
          alineas.forEach((_, i) => {
            const letra = letraAlinea(i)
            if (ciente[letra] || prov[letra]?.trim()) registro[letra] = { ciente: !!ciente[letra], providencia: prov[letra]?.trim() || undefined }
          })
          await repo.vistar(g.id, usuario, { despacho, alineas: registro })
          aoSalvar()
        } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao registrar o visto') }
        setOcupado(false)
      }}>Assinar o visto eletronicamente</button>
    </div>
  )
}

function SolicitarRetificacao({ g, aoSalvar }: { g: ParteGuardada; aoSalvar: () => void }) {
  const { repo, usuario } = useApp()
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState('')
  if (!aberto) return <button className="largo" style={{ marginBottom: 12 }} onClick={() => setAberto(true)}>Solicitar retificação ao autor</button>
  return (
    <div className="cartao">
      <h2>Solicitar retificação</h2>
      <CampoTexto longo rotulo="O que deve ser corrigido" valor={motivo} onChange={setMotivo} />
      {erro && <div className="aviso bloqueia">{erro}</div>}
      <div className="linha" style={{ marginTop: 8 }}>
        <button onClick={() => setAberto(false)}>Cancelar</button>
        <button className="primario" disabled={!motivo.trim()} onClick={async () => {
          try { await repo.solicitarRetificacao(g.id, usuario, motivo); setAberto(false); setMotivo(''); aoSalvar() }
          catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao solicitar') }
        }}>Enviar pedido</button>
      </div>
    </div>
  )
}

function BotoesPdf({ g }: { g: ParteGuardada }) {
  const { cad, repo } = useApp()
  const [anexos, setAnexos] = useState<AnexoMeta[]>([])
  useEffect(() => { repo.listarAnexos(g.id).then(setAnexos) }, [repo, g.id])
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const podeCompartilhar = podeCompartilharArquivos()
  const [salvo, setSalvo] = useState('')

  async function executar(acao: 'baixar' | 'compartilhar', comAnexos: boolean) {
    setOcupado(true); setErro(''); setSalvo('')
    try {
      const { baixarPdf, compartilharPdf } = await import('../../pdf/gerarPdf')
      const completos = comAnexos ? (await Promise.all(anexos.map((a) => repo.obterAnexo(a.id)))).flatMap((x) => (x ? [x] : [])) : []
      const r = acao === 'baixar' ? await baixarPdf(g, cad.unidade, completos) : await compartilharPdf(g, cad.unidade, completos)
      setSalvo(textoResultado(r))
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setErro(e instanceof Error ? e.message : 'Não foi possível gerar o PDF.')
    }
    setOcupado(false)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div className="linha">
        <button className="primario" disabled={ocupado} onClick={() => executar('baixar', anexos.length > 0)}>{ocupado ? 'Gerando PDF…' : anexos.length ? 'Baixar PDF completo (com anexos)' : 'Baixar PDF'}</button>
        {podeCompartilhar && <button disabled={ocupado} onClick={() => executar('compartilhar', anexos.length > 0)}>Compartilhar</button>}
      </div>
      {salvo && <div className="aviso" role="status">{salvo}</div>}
      {anexos.length > 0 && (
        <div className="cartao" style={{ marginTop: 8 }}>
          <h3>Documentos anexados ({anexos.length})</h3>
          {anexos.map((a) => (
            <div className="item-lista" key={a.id}>
              <strong>{a.nome}</strong>
              <div className="suave">{a.rotulo ?? 'Outro documento'} · {a.sha256.slice(0, 8)}</div>
              <button type="button" className="pequeno" onClick={() => abrirAnexo(() => repo.obterAnexo(a.id))}>Abrir</button>
            </div>
          ))}
          <button type="button" className="pequeno" disabled={ocupado} onClick={() => executar('baixar', false)}>Baixar só a Parte (sem anexos)</button>
        </div>
      )}
      {erro && <div className="aviso bloqueia">{erro}</div>}
    </div>
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
