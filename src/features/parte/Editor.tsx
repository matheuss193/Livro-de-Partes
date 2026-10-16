import { useEffect, useMemo, useRef, useState } from 'react'
import type { ItensParte, Parte } from '../../domain/tipos'
import { cabecalhoLinhas, gerarSecoes } from '../../domain/textos'
import { podeEncerrar, validarParte } from '../../domain/validacoes'
import { Avisos, CampoInteiro, Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'
import { PassoI, PassoII, PassoIII, PassoIV, PassoV, type PropsPasso } from './passos1a5'
import { PassoVI, PassoVII, PassoVIII, PassoIX, PassoX } from './passos6a10'

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
const TOTAL = PASSOS.length + 1 // + Revisão

type EstadoSalvo = 'salvo' | 'salvando' | 'erro'

export default function Editor({ id, voltar, aoEncerrar }: { id: string; voltar: () => void; aoEncerrar: (id: string) => void }) {
  const { repo, cad } = useApp()
  const [parte, setParte] = useState<Parte | null>(null)
  const [anterior, setAnterior] = useState<Parte | undefined>()
  const [numerosUsados, setNumerosUsados] = useState<number[]>([])
  const [passo, setPasso] = useState(0)
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

  const naRevisao = passo === PASSOS.length
  const atual = PASSOS[passo]
  const pct = Math.round(((passo + 1) / TOTAL) * 100)
  const secoes = gerarSecoes(parte, cad.unidade)

  return (
    <>
      <main className="pagina">
        <div className="linha" style={{ alignItems: 'center' }}>
          <button className="pequeno fixo" onClick={voltar}>← Início</button>
          <span className="suave" style={{ textAlign: 'right' }}>
            {estado === 'salvando' && 'Salvando…'}
            {estado === 'salvo' && (salvoEm ? `Rascunho salvo às ${salvoEm}` : 'Rascunho')}
            {estado === 'erro' && <span style={{ color: 'var(--cor-erro)' }}>Não salvou</span>}
          </span>
        </div>
        {erroSalvar && <div className="aviso bloqueia">{erroSalvar}</div>}

        <div className="barra-progresso" aria-hidden><div style={{ width: `${pct}%` }} /></div>
        <div className="linha" style={{ alignItems: 'center' }}>
          <strong>{naRevisao ? 'Revisão e encerramento' : `Item ${atual.numeral} – ${atual.titulo}`}</strong>
          <select aria-label="Ir para o item" className="fixo" style={{ width: 120 }} value={passo} onChange={(e) => setPasso(Number(e.target.value))}>
            {PASSOS.map((p, i) => <option key={p.numeral} value={i}>{p.numeral}</option>)}
            <option value={PASSOS.length}>Revisão</option>
          </select>
        </div>

        {passo === 0 && (
          <div className="cartao" style={{ marginTop: 10 }}>
            <h3>Dados da Parte</h3>
            <div className="linha">
              <CampoInteiro rotulo="Parte nº" valor={parte.numero} onChange={(v) => mudarCabecalho({ numero: v ?? 0 })} />
              <Rotulo texto="Data do serviço">
                <input type="date" value={parte.dataServico} onChange={(e) => e.target.value && mudarCabecalho({ dataServico: e.target.value })} />
              </Rotulo>
            </div>
            <Avisos avisos={avisos.filter((a) => a.codigo.startsWith('numero'))} />
          </div>
        )}

        {!naRevisao ? (
          <div className="cartao" style={{ marginTop: 10 }}>
            <atual.Componente parte={parte} anterior={anterior} mudar={mudar} />
            <details>
              <summary>Ver texto oficial deste item</summary>
              <div className="texto-oficial">{[`${secoes[passo].numeral} – ${secoes[passo].titulo}:`, ...secoes[passo].linhas].join('\n')}</div>
            </details>
          </div>
        ) : (
          <Revisao
            parte={parte}
            avisos={avisos}
            cabecalho={cabecalhoLinhas(parte, cad.unidade)}
            secoes={secoes}
            encerrar={async () => {
              sujo.current = false
              await repo.salvarRascunho(parte, id)
              const e = await repo.encerrar(id, parte.autor.nomeGuerra)
              aoEncerrar(e.id)
            }}
            irPara={setPasso}
          />
        )}
      </main>

      <nav className="rodape-fixo">
        <button disabled={passo === 0} onClick={() => { setPasso(passo - 1); window.scrollTo(0, 0) }}>← Anterior</button>
        {!naRevisao && <button className="primario" onClick={() => { setPasso(passo + 1); window.scrollTo(0, 0) }}>{passo === PASSOS.length - 1 ? 'Revisar →' : 'Próximo →'}</button>}
      </nav>
    </>
  )
}

function Revisao({ parte, avisos, cabecalho, secoes, encerrar, irPara }: {
  parte: Parte
  avisos: ReturnType<typeof validarParte>
  cabecalho: string[]
  secoes: ReturnType<typeof gerarSecoes>
  encerrar: () => Promise<void>
  irPara: (n: number) => void
}) {
  const [confirmaAvisos, setConfirmaAvisos] = useState(false)
  const [ciente, setCiente] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const exigeConfirmacao = avisos.some((a) => a.gravidade === 'forte' || a.gravidade === 'aviso')
  const liberado = podeEncerrar(avisos) && ciente && (!exigeConfirmacao || confirmaAvisos)

  return (
    <>
      <div className="cartao" style={{ marginTop: 10 }}>
        <h3>Avisos ({avisos.length})</h3>
        {avisos.length === 0 ? <p className="ok">Nenhuma inconsistência encontrada.</p> : <Avisos avisos={avisos} />}
        {avisos.some((a) => a.gravidade === 'bloqueia') && <p><strong>Corrija os avisos em vermelho para poder encerrar.</strong></p>}
      </div>

      <div className="cartao">
        <h3>Texto oficial</h3>
        <div className="texto-oficial">{cabecalho.join('\n')}</div>
        {secoes.map((s, i) => (
          <div key={s.numeral} style={{ marginTop: 10 }}>
            <div className="texto-oficial">{s.mesmaLinha ? `${s.numeral} – ${s.titulo}: ${s.linhas[0]}` : [`${s.numeral} – ${s.titulo}:`, ...s.linhas].join('\n')}</div>
            <button type="button" className="pequeno" onClick={() => { irPara(i); window.scrollTo(0, 0) }}>Editar item {s.numeral}</button>
          </div>
        ))}
        <p className="suave">A assinatura eletrônica e a data da passagem (dia seguinte) são geradas ao encerrar.</p>
      </div>

      <div className="cartao">
        <h3>Encerrar a Parte nº {parte.numero}</h3>
        {exigeConfirmacao && (
          <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
            <input type="checkbox" checked={confirmaAvisos} onChange={(e) => setConfirmaAvisos(e.target.checked)} />
            Li os avisos acima e confirmo que os dados estão corretos.
          </label>
        )}
        <label style={{ display: 'flex', gap: 10, fontWeight: 400 }}>
          <input type="checkbox" checked={ciente} onChange={(e) => setCiente(e.target.checked)} />
          Estou ciente de que, após encerrar, a Parte não poderá ser alterada, apenas retificada.
        </label>
        {erro && <div className="aviso bloqueia">{erro}</div>}
        <button className="primario largo" style={{ marginTop: 10 }} disabled={!liberado || ocupado} onClick={async () => {
          setOcupado(true); setErro('')
          try { await encerrar() } catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao encerrar'); setOcupado(false) }
        }}>Encerrar e assinar</button>
      </div>
    </>
  )
}
