import { useEffect, useMemo, useRef, useState } from 'react'
import type { AjustesTexto, ItensParte, Parte } from '../../domain/tipos'
import { cabecalhoAutomatico, cabecalhoLinhas, gerarSecoes, gerarSecoesAutomaticas, textoAssinatura, textoAssinaturaAutomatico } from '../../domain/textos'
import { podeEncerrar, validarParte } from '../../domain/validacoes'
import { pinValido } from '../../domain/assinatura'
import { Avisos, CampoInteiro, CampoPin, Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'
import { PassoI, PassoII, PassoIII, PassoIV, PassoV, type PropsPasso } from './passos1a5'
import { PassoVI, PassoVII, PassoVIII, PassoIX, PassoX } from './passos6a10'
import CaixaTexto, { TextoRico } from '../../ui/CaixaTexto'

const PASSOS: { numeral: string; titulo: string; Componente: (p: PropsPasso) => React.ReactElement }[] = [
  { numeral: 'I', titulo: 'Recebimento do Serviço', Componente: PassoI },
  { numeral: 'II', titulo: 'Guarnição de Serviço', Componente: PassoII },
  { numeral: 'III', titulo: 'Consumo de Energia', Componente: PassoIII },
  { numeral: 'IV', titulo: 'Armamento e Munição', Componente: PassoIV },
  { numeral: 'V', titulo: 'Equipamentos de Comunicação', Componente: PassoV },
  { numeral: 'VI', titulo: 'Consumo de Combustível', Componente: PassoVI },
  { numeral: 'VII', titulo: 'Participação', Componente: PassoVII },
  { numeral: 'VIII', titulo: 'Juntada de Documentos', Componente: PassoVIII },
  { numeral: 'IX', titulo: 'Ocorrências', Componente: PassoIX },
  { numeral: 'X', titulo: 'Passagem do Serviço', Componente: PassoX },
]
const INDICE_REVISAO = PASSOS.length
const INDICE_CABECALHO = -1

type EstadoSalvo = 'salvo' | 'salvando' | 'erro'

export default function Editor({ id, voltar, aoEncerrar }: { id: string; voltar: () => void; aoEncerrar: (id: string) => void }) {
  const { repo, cad } = useApp()
  const [parte, setParte] = useState<Parte | null>(null)
  const [anterior, setAnterior] = useState<Parte | undefined>()
  const [numerosUsados, setNumerosUsados] = useState<number[]>([])
  const [aberto, setAberto] = useState<number>(INDICE_CABECALHO)
  const [estado, setEstado] = useState<EstadoSalvo>('salvo')
  const [erroSalvar, setErroSalvar] = useState('')
  const sujo = useRef(false)
  const [salvoEm, setSalvoEm] = useState('')

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const g = await repo.obterParte(id)
      if (!g || !vivo) return
      if (g.status !== 'rascunho') return aoEncerrar(id)
      const todas = await repo.listarPartes()
      const ult = todas.find((p) => p.status !== 'rascunho' && p.id !== id)
      setAnterior(ult?.parte)
      setNumerosUsados(todas.filter((p) => p.id !== id && p.ano === g.ano).map((p) => p.numero))
      setParte(g.parte)
    })()
    return () => { vivo = false }
  }, [repo, id, aoEncerrar])

  // Salvamento automático do rascunho (o serviço é de 24 h e a internet pode cair).
  useEffect(() => {
    if (!parte || !sujo.current) return
    setEstado('salvando')
    const t = setTimeout(() => {
      repo.salvarRascunho(parte, id)
        .then(() => { setEstado('salvo'); setErroSalvar(''); setSalvoEm(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Belem' })) })
        .catch((e: unknown) => { setEstado('erro'); setErroSalvar(e instanceof Error ? e.message : 'Erro ao salvar') })
    }, 600)
    return () => clearTimeout(t)
  }, [parte, repo, id])

  const avisos = useMemo(() => (parte ? validarParte(parte, { anterior, numerosUsados }) : []), [parte, anterior, numerosUsados])

  if (!parte) return <main className="pagina">Carregando…</main>

  const mudar = (f: (i: ItensParte) => ItensParte) => { sujo.current = true; setParte((p) => (p ? { ...p, itens: f(p.itens) } : p)) }
  const mudarCabecalho = (p: Partial<Pick<Parte, 'numero' | 'dataServico'>>) => { sujo.current = true; setParte((x) => (x ? { ...x, ...p } : x)) }
  const mudarAjustes = (f: (a: AjustesTexto) => AjustesTexto) => {
    sujo.current = true
    setParte((x) => {
      if (!x) return x
      const novo = f(x.ajustes ?? {})
      const vazio = !novo.cabecalho && !novo.assinatura && Object.keys(novo.secoes ?? {}).length === 0
      return { ...x, ajustes: vazio ? undefined : novo }
    })
  }
  const textoItem = (numeral: string, linhas: string[] | undefined) =>
    mudarAjustes((a) => {
      const secoes = { ...(a.secoes ?? {}) }
      if (linhas) secoes[numeral] = linhas
      else delete secoes[numeral]
      return { ...a, secoes }
    })

  const secoes = gerarSecoes(parte, cad.unidade)
  const automaticas = gerarSecoesAutomaticas(parte, cad.unidade)
  const alternar = (i: number) => setAberto((a) => (a === i ? -2 : i))
  const proximo = (i: number) => { setAberto(i + 1); setTimeout(() => document.getElementById(`bloco-${i + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }

  return (
    <main className="pagina">
      <div className="linha" style={{ alignItems: 'center' }}>
        <button className="pequeno fixo" onClick={voltar}>← Início</button>
        <span className="suave" style={{ textAlign: 'right' }}>
          {estado === 'salvando' && 'Salvando…'}
          {estado === 'salvo' && (salvoEm ? `Rascunho salvo às ${salvoEm}` : 'Rascunho salvo automaticamente')}
          {estado === 'erro' && <span style={{ color: 'var(--cor-erro)' }}>Não salvou</span>}
        </span>
      </div>
      {erroSalvar && <div className="aviso bloqueia">{erroSalvar}</div>}

      <h2 style={{ margin: '10px 0 2px' }}>Parte nº {parte.numero}</h2>
      <CaixaTexto
        alinhamento="centro"
        linhas={cabecalhoLinhas(parte, cad.unidade)}
        manual={!!parte.ajustes?.cabecalho}
        onAtivar={() => mudarAjustes((a) => ({ ...a, cabecalho: cabecalhoAutomatico(parte, cad.unidade) }))}
        onChange={(l) => mudarAjustes((a) => ({ ...a, cabecalho: l }))}
        onRestaurar={() => mudarAjustes((a) => ({ ...a, cabecalho: undefined }))}
      />
      <p className="suave">Toque em um item para preencher. O texto oficial aparece sempre e muda conforme você escolhe. Em qualquer texto, o lápis (✎) permite escrever à mão do seu jeito, antes de encerrar.</p>

      <Bloco id={INDICE_CABECALHO} aberto={aberto === INDICE_CABECALHO} alternar={() => alternar(INDICE_CABECALHO)}
        numeral="◆" titulo="Cabeçalho" resumo={`Parte nº ${parte.numero} · ${parte.dataServico.split('-').reverse().join('/')}`} estadoItem={parte.ajustes?.cabecalho ? 'manual' : avisos.some((a) => a.codigo.startsWith('numero')) ? 'atencao' : 'ok'}>
        <div className="linha">
          <CampoInteiro rotulo="Parte nº" valor={parte.numero} onChange={(v) => mudarCabecalho({ numero: v ?? 0 })} />
          <Rotulo texto="Data do serviço">
            <input type="date" value={parte.dataServico} onChange={(e) => e.target.value && mudarCabecalho({ dataServico: e.target.value })} />
          </Rotulo>
        </div>
        <Avisos avisos={avisos.filter((a) => a.codigo.startsWith('numero'))} />
        <button className="primario largo" style={{ marginTop: 10 }} onClick={() => proximo(INDICE_CABECALHO)}>Próximo: item I →</button>
      </Bloco>

      {PASSOS.map((p, i) => {
        const manual = parte.ajustes?.secoes?.[p.numeral]
        const pendentes = avisos.filter((a) => a.item === p.numeral && (a.gravidade === 'forte' || a.gravidade === 'bloqueia'))
        const resumo = resumoDoItem(p.numeral, parte, secoes[i].linhas, !!manual)
        return (
          <Bloco key={p.numeral} id={i} aberto={aberto === i} alternar={() => alternar(i)} numeral={p.numeral} titulo={p.titulo}
            resumo={resumo} estadoItem={manual ? 'manual' : pendentes.length ? 'atencao' : 'ok'}>
            <CaixaTexto
              titulo={`${p.numeral} – ${p.titulo}:`}
              linhas={secoes[i].linhas}
              manual={!!manual}
              onAtivar={() => textoItem(p.numeral, automaticas[i].linhas)}
              onChange={(l) => textoItem(p.numeral, l)}
              onRestaurar={() => textoItem(p.numeral, undefined)}
            />
            {!manual && <p.Componente parteId={id} parte={parte} anterior={anterior} mudar={mudar} />}
            <button className="primario largo" style={{ marginTop: 10 }} onClick={() => proximo(i)}>
              {i === PASSOS.length - 1 ? 'Revisar e encerrar →' : `Próximo: item ${PASSOS[i + 1].numeral} →`}
            </button>
          </Bloco>
        )
      })}

      <Bloco id={INDICE_REVISAO} aberto={aberto === INDICE_REVISAO} alternar={() => alternar(INDICE_REVISAO)} numeral="✓" titulo="Revisão e encerramento"
        resumo={avisos.length ? `${avisos.length} aviso(s) para conferir` : 'Nenhuma inconsistência'} estadoItem={avisos.length ? 'atencao' : 'ok'}>
        <Revisao
          parte={parte}
          avisos={avisos}
          cabecalho={cabecalhoLinhas(parte, cad.unidade)}
          secoes={secoes}
          assinatura={textoAssinatura(parte, cad.unidade)}
          assinaturaAuto={textoAssinaturaAutomatico(parte, cad.unidade)}
          onAssinatura={(l) => mudarAjustes((a) => ({ ...a, assinatura: l }))}
          encerrar={async () => {
            sujo.current = false
            await repo.salvarRascunho(parte, id)
            const e = await repo.encerrar(id, parte.autor.nomeGuerra)
            aoEncerrar(e.id)
          }}
          irPara={(i) => { setAberto(i); setTimeout(() => document.getElementById(`bloco-${i}`)?.scrollIntoView({ block: 'start' }), 50) }}
        />
      </Bloco>
    </main>
  )
}

/** Resumo de uma linha mostrado no item fechado. */
function resumoDoItem(numeral: string, parte: Parte, linhas: string[], manual: boolean): string {
  if (!manual) {
    if (numeral === 'II') return `${parte.itens.guarnicao.reduce((n, f) => n + f.militares.length, 1)} militares na guarnição`
    if (numeral === 'VI') {
      const fora = parte.itens.combustivel.filter((l) => l.situacao.tipo !== 'operante').length
      return `${parte.itens.combustivel.length} viaturas${fora ? ` · ${fora} fora do normal` : ''}`
    }
    if (numeral === 'VII') return parte.itens.participacao.length ? `${parte.itens.participacao.length} alínea(s)` : 'Nada digno de registro'
    if (numeral === 'IX') {
      const o = parte.itens.ocorrencias
      return `${o.incendio.length} incêndio · ${o.salvamento.length} salvamento · ${o.aph.length} APH`
    }
  }
  return linhas.slice(0, 2).join(' · ')
}

type EstadoItem = 'ok' | 'atencao' | 'manual'
const ICONE: Record<EstadoItem, string> = { ok: '✓', atencao: '!', manual: '✎' }
const LEGENDA: Record<EstadoItem, string> = { ok: 'Sem pendências', atencao: 'Conferir', manual: 'Escrito à mão' }

function Bloco({ id, aberto, alternar, numeral, titulo, resumo, estadoItem, children }: {
  id: number; aberto: boolean; alternar: () => void; numeral: string; titulo: string; resumo: string; estadoItem: EstadoItem; children: React.ReactNode
}) {
  return (
    <section id={`bloco-${id}`} className={`bloco ${aberto ? 'aberto' : ''}`}>
      <button type="button" className="bloco-cab" aria-expanded={aberto} onClick={alternar}>
        <span className="bloco-num">{numeral}</span>
        <span className="bloco-txt">
          <strong>{titulo}</strong>
          {!aberto && <span className="suave bloco-resumo">{resumo}</span>}
        </span>
        <span className={`estado ${estadoItem}`} title={LEGENDA[estadoItem]} aria-label={LEGENDA[estadoItem]}>{ICONE[estadoItem]}</span>
      </button>
      {aberto && <div className="bloco-corpo">{children}</div>}
    </section>
  )
}

function Revisao({ parte, avisos, cabecalho, secoes, assinatura, assinaturaAuto, onAssinatura, encerrar, irPara }: {
  parte: Parte
  avisos: ReturnType<typeof validarParte>
  cabecalho: string[]
  secoes: ReturnType<typeof gerarSecoes>
  assinatura: string[]
  assinaturaAuto: string[]
  onAssinatura: (l: string[] | undefined) => void
  encerrar: () => Promise<void>
  irPara: (n: number) => void
}) {
  const [confirmaAvisos, setConfirmaAvisos] = useState(false)
  const [ciente, setCiente] = useState(false)
  const [pin, setPin] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const exigeConfirmacao = avisos.some((a) => a.gravidade === 'forte' || a.gravidade === 'aviso' || a.gravidade === 'bloqueia')
  const liberado = podeEncerrar(avisos) && ciente && pinValido(pin) && (!exigeConfirmacao || confirmaAvisos)

  return (
    <>
      <h3>Avisos ({avisos.length})</h3>
      {avisos.length === 0 ? <p className="ok">Nenhuma inconsistência encontrada.</p> : <Avisos avisos={avisos} />}
      {avisos.some((a) => a.gravidade === 'bloqueia') && <p><strong>Corrija os avisos em vermelho para poder encerrar.</strong></p>}
      <p className="suave">Os avisos só alertam: nada é corrigido sozinho. Você decide se o texto está certo.</p>

      <h3>Texto oficial</h3>
      <div className="texto-oficial" style={{ textAlign: 'center' }}><TextoRico linhas={cabecalho} /></div>
      {secoes.map((s, i) => (
        <div key={s.numeral} style={{ marginTop: 8 }}>
          <div className="texto-oficial"><div className="linha-texto" style={{ fontWeight: 700 }}>{s.numeral} – {s.titulo}:</div><TextoRico linhas={s.linhas} /></div>
          <button type="button" className="pequeno" onClick={() => irPara(i)}>Editar item {s.numeral}</button>
        </div>
      ))}
      <CaixaTexto
        alinhamento="direita"
        linhas={assinatura}
        manual={!!parte.ajustes?.assinatura}
        onAtivar={() => onAssinatura(assinaturaAuto)}
        onChange={(l) => onAssinatura(l)}
        onRestaurar={() => onAssinatura(undefined)}
      />
      <p className="suave">A assinatura eletrônica (data e hora) é gravada ao encerrar.</p>

      <h3>Encerrar a Parte nº {parte.numero}</h3>
      {exigeConfirmacao && (
        <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
          <input type="checkbox" checked={confirmaAvisos} onChange={(e) => setConfirmaAvisos(e.target.checked)} />
          Li os avisos acima e confirmo que o conteúdo está correto.
        </label>
      )}
      <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
        <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} />
        Estou ciente de que, após encerrar, a Parte não poderá ser alterada, apenas retificada.
      </label>
      <CampoPin valor={pin} onChange={setPin} />
      {erro && <div className="aviso bloqueia">{erro}</div>}
      <button className="primario largo" style={{ marginTop: 10 }} disabled={!liberado || ocupado} onClick={async () => {
        setOcupado(true); setErro('')
        try { await encerrar() } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao encerrar'); setOcupado(false) }
      }}>Encerrar e assinar</button>
    </>
  )
}
