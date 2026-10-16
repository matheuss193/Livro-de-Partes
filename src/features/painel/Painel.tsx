import { useEffect, useMemo, useState } from 'react'
import type { ParteGuardada } from '../../data/repositorio'
import { dataPorExtenso, decimalBR, reais } from '../../domain/formatacao'
import { calcularPainel } from '../../domain/painel'
import { consumoPorVtr } from '../../domain/consumo'
import { statusRevisoes, type StatusRevisao } from '../../domain/manutencao'
import { useApp } from '../../ui/contexto'
import { BarrasHorizontais, BarrasVerticais } from './Graficos'

const COR_GRUPO = { incendio: '#b3261e', salvamento: '#00796b', aph: '#1b3f8f' } as const
const ROTULO_GRUPO = { incendio: 'Incêndio', salvamento: 'Salvamento', aph: 'Prevenção, Auxílio e APH' } as const
const LIMITE_ENERGIA = 20 // faixa usual do modelo (configurável na fase 2)

const COR_REVISAO: Record<StatusRevisao['situacao'], string> = { 'em-dia': '#1b3f8f', proxima: '#e8731a', vencida: '#b3261e', 'sem-dados': '#999999' }

function textoRevisao(r: StatusRevisao): string {
  const faltam = r.faltamKm ?? 0
  const km = (r.kmAtual ?? 0).toLocaleString('pt-BR')
  if (r.situacao === 'vencida') return `vencida há ${(-faltam).toLocaleString('pt-BR')} Km · Km atual ${km}`
  return `faltam ${faltam.toLocaleString('pt-BR')} Km · Km atual ${km}`
}

const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

export default function Painel({ voltar, abrirLeitura }: { voltar: () => void; abrirLeitura: (id: string) => void }) {
  const { repo, cad } = useApp()
  const [partes, setPartes] = useState<ParteGuardada[] | null>(null)
  const [dias, setDias] = useState(0)
  useEffect(() => { repo.listarPartes().then(setPartes) }, [repo])

  const d = useMemo(() => (partes ? calcularPainel(partes, dias || undefined) : null), [partes, dias])
  if (!d || !partes) return <main className="pagina">Carregando…</main>
  const aguardando = partes.filter((p) => p.status === 'encerrada')
  const encerradas = partes.filter((p) => p.status !== 'rascunho').map((p) => ({ dataServico: p.dataServico, numero: p.numero, parte: p.parte }))
  const revisoes = statusRevisoes(cad.viaturas, encerradas)
    .filter((r) => r.situacao !== 'sem-dados')
    .sort((a, b) => (a.faltamKm ?? 0) - (b.faltamKm ?? 0))
  const consumos = consumoPorVtr(encerradas).filter((c) => c.ultimo !== null)

  return (
    <main className="pagina">
      <button className="pequeno" onClick={voltar}>← Início</button>
      <h2 style={{ margin: '10px 0 2px' }}>Painel do comando</h2>
      <p className="suave" style={{ marginTop: 0 }}>
        {d.periodo ? `Partes de ${dataPorExtenso(d.periodo.de)} a ${dataPorExtenso(d.periodo.ate)}` : 'Nenhuma Parte encerrada ainda.'} · dados fictícios
      </p>

      <div className="rotulo-texto">Período</div>
      <div className="linha linha-fixa" role="group" aria-label="Período">
        {[{ v: 7, t: '7 dias' }, { v: 14, t: '14 dias' }, { v: 0, t: 'Tudo' }].map((o) => (
          <button key={o.v} className={dias === o.v ? 'primario' : ''} aria-pressed={dias === o.v} onClick={() => setDias(o.v)}>{o.t}</button>
        ))}
      </div>

      <div className="kpis">
        <Kpi valor={String(d.partes)} rotulo="Partes" />
        <Kpi valor={`${decimalBR(d.energia.media, 1)} kWh`} rotulo="Energia por dia" />
        <Kpi valor={`${decimalBR(d.abastecimento.litros, 0)} L`} rotulo="Combustível" />
        <Kpi valor={reais(d.abastecimento.valor)} rotulo="Gasto com combustível" />
        <Kpi valor={String(d.ocorrencias.total)} rotulo="Ocorrências" />
        <Kpi valor={String(d.aguardandoVisto)} rotulo="Aguardam visto" destaque={d.aguardandoVisto > 0} />
      </div>

      {aguardando.length > 0 && (
        <div className="cartao destaque">
          <h3>Aguardando visto</h3>
          {aguardando.map((p) => (
            <button key={p.id} className="primario largo" style={{ marginBottom: 6, textAlign: 'left' }} onClick={() => abrirLeitura(p.id)}>
              Parte nº {p.numero} · {dataPorExtenso(p.dataServico)}
            </button>
          ))}
        </div>
      )}

      {d.pendencias && d.pendencias.itens.length > 0 && (
        <div className="cartao alerta">
          <h3>Pendências da Parte nº {d.pendencias.numero}</h3>
          {d.pendencias.itens.map((p, i) => <div className="aviso forte" key={i}>{p.texto}</div>)}
        </div>
      )}

      <div className="cartao">
        <h3>Consumo de energia por dia (kWh)</h3>
        <BarrasVerticais
          titulo="Consumo de energia por dia"
          unidade="kWh"
          cor="#1b3f8f"
          pontos={d.energia.pontos.map((p) => ({ rotulo: diaMes(p.data), valor: p.consumo, detalhe: `Parte nº ${p.numero}` }))}
          referencia={d.energia.maximo > LIMITE_ENERGIA * 0.5 ? { valor: LIMITE_ENERGIA, rotulo: `limite usual ${LIMITE_ENERGIA}` } : undefined}
        />
        <p className="suave">Média de {decimalBR(d.energia.media, 1)} kWh por dia · máximo de {d.energia.maximo} kWh · total de {d.energia.total} kWh.</p>
      </div>

      <div className="cartao">
        <h3>Abastecimentos por dia (litros)</h3>
        <BarrasVerticais
          titulo="Litros abastecidos por dia"
          unidade="litros"
          cor="#e8731a"
          pontos={d.abastecimento.pontos.map((p) => ({ rotulo: diaMes(p.data), valor: Math.round(p.litros * 10) / 10, detalhe: p.valor ? reais(p.valor) : undefined }))}
        />
        <p className="suave">
          {decimalBR(d.abastecimento.litros, 1)} litros · {reais(d.abastecimento.valor)} · preço médio {reais(d.abastecimento.precoMedio)}/L.
        </p>
        {d.abastecimento.porVtr.length > 0 && (
          <>
            <div className="rotulo-texto">Por viatura</div>
            <BarrasHorizontais linhas={d.abastecimento.porVtr.map((l) => ({
              rotulo: l.vtr, valor: l.litros, cor: '#e8731a', texto: `${decimalBR(l.litros, 1)} L · ${reais(l.valor)}`,
            }))} />
          </>
        )}
      </div>

      <div className="cartao">
        <h3>Revisão das viaturas (por Km)</h3>
        <p className="suave">Quanto do intervalo entre revisões já foi rodado. Avisa a menos de 500 Km.</p>
        <BarrasHorizontais linhas={revisoes.map((r) => ({
          rotulo: r.vtr,
          valor: Math.max(0, Math.min(100, Math.round((1 - (r.faltamKm ?? 0) / r.intervaloKm) * 100))),
          cor: COR_REVISAO[r.situacao],
          texto: textoRevisao(r),
        }))} />
      </div>

      <div className="cartao">
        <h3>Consumo por viatura (L/100 Km)</h3>
        <p className="suave">Último abastecimento comparado com a média anterior da mesma viatura. Vermelho: mais de 30% acima.</p>
        {consumos.length === 0 && <p className="suave">Ainda não há abastecimentos suficientes.</p>}
        <BarrasHorizontais linhas={consumos.map((c) => ({
          rotulo: c.vtr,
          valor: c.ultimo ?? 0,
          cor: c.alerta ? '#b3261e' : '#00796b',
          texto: `${decimalBR(c.ultimo ?? 0, 1)} L/100 Km${c.mediaAnterior !== null ? ` · média anterior ${decimalBR(c.mediaAnterior, 1)}${c.alerta ? ` (+${Math.round((c.desvio ?? 0) * 100)}%)` : ''}` : ''}`,
        }))} />
      </div>

      <div className="cartao">
        <h3>Ocorrências por natureza</h3>
        <div className="chips" aria-label="Total por grupo">
          {(['incendio', 'salvamento', 'aph'] as const).map((g) => (
            <span className="chip" key={g} style={{ paddingRight: 12 }}>
              <span className="bolinha" style={{ background: COR_GRUPO[g] }} />
              {ROTULO_GRUPO[g]}: <strong>{d.ocorrencias.porGrupo[g]}</strong>
            </span>
          ))}
        </div>
        {d.ocorrencias.total === 0 && <p className="suave">Nenhuma ocorrência no período.</p>}
        <BarrasHorizontais linhas={d.ocorrencias.porNatureza.map((n) => ({
          rotulo: n.natureza, valor: n.quantidade, cor: COR_GRUPO[n.grupo],
          texto: `${n.quantidade} · ${Math.round((n.quantidade / d.ocorrencias.total) * 100)}%`,
        }))} />
      </div>
    </main>
  )
}

function Kpi({ valor, rotulo, destaque }: { valor: string; rotulo: string; destaque?: boolean }) {
  return (
    <div className={`kpi ${destaque ? 'destaque' : ''}`}>
      <div className="kpi-valor">{valor}</div>
      <div className="kpi-rotulo">{rotulo}</div>
    </div>
  )
}
