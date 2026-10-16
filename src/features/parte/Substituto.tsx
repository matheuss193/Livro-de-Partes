/**
 * Escolhas do item I (antecessor) e do item X (sucessor): quem é (do cadastro ou digitado),
 * concordância de gênero ("antecessor"/"antecessora") e horário (previsto ou outro).
 * O texto oficial correspondente aparece sempre visível acima, no editor.
 */
import { useState } from 'react'
import type { Genero, Horario, Militar } from '../../domain/tipos'
import { ROTULO_HORARIO } from '../../domain/tipos'
import { tratamento } from '../../domain/formatacao'
import { CampoHora, CampoTexto, Rotulo } from '../../ui/campos'
import { useApp } from '../../ui/contexto'

export interface DadosSubstituto {
  militar: Militar | null
  texto?: string
  genero?: Genero
  horario?: Horario
  observacao?: string
}

const OUTRO = '__outro'

export default function EscolhaSubstituto({ papel, dados, onChange, dica }: {
  papel: 'antecessor' | 'sucessor'
  dados: DadosSubstituto
  onChange: (novo: DadosSubstituto) => void
  dica?: string
}) {
  const { cad } = useApp()
  const [manual, setManual] = useState(!!dados.texto)
  const feminino = papel === 'antecessor' ? 'Antecessora' : 'Sucessora'
  const masculino = papel === 'antecessor' ? 'Antecessor' : 'Sucessor'
  const generoAtual: Genero = dados.genero ?? dados.militar?.genero ?? 'M'
  const horario: Horario = dados.horario ?? { tipo: 'previsto' }
  const ativos = cad.militares.filter((m) => m.ativo !== false || m.id === dados.militar?.id)

  return (
    <>
      {dica && <p className="suave">{dica}</p>}

      <Rotulo texto={`Quem é o ${masculino.toLowerCase()}`}>
        <select
          value={manual ? OUTRO : dados.militar?.id ?? ''}
          onChange={(e) => {
            if (e.target.value === OUTRO) {
              setManual(true)
              onChange({ ...dados, militar: null, texto: dados.texto ?? '' })
              return
            }
            setManual(false)
            const m = cad.militares.find((x) => x.id === e.target.value) ?? null
            // Escolher do cadastro ajusta a concordância automaticamente (o autor ainda pode trocar).
            onChange({ ...dados, militar: m, texto: undefined, genero: m?.genero })
          }}
        >
          <option value="">— selecione —</option>
          {ativos.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
          <option value={OUTRO}>✎ Outro (digitar o nome)</option>
        </select>
      </Rotulo>
      {manual && (
        <CampoTexto rotulo="Nome como deve aparecer na Parte" placeholder="Ex.: 2º SGT QBM Silva" valor={dados.texto ?? ''} onChange={(v) => onChange({ ...dados, militar: null, texto: v })} />
      )}

      <label>Concordância</label>
      <div className="linha" role="group" aria-label="Concordância de gênero">
        <button type="button" className={generoAtual === 'M' ? 'primario' : ''} aria-pressed={generoAtual === 'M'} onClick={() => onChange({ ...dados, genero: 'M' })}>{masculino} (masc.)</button>
        <button type="button" className={generoAtual === 'F' ? 'primario' : ''} aria-pressed={generoAtual === 'F'} onClick={() => onChange({ ...dados, genero: 'F' })}>{feminino} (fem.)</button>
      </div>

      <Rotulo texto={papel === 'antecessor' ? 'Horário em que assumiu o serviço' : 'Horário em que passou o serviço'}>
        <select
          value={horario.tipo}
          onChange={(e) => {
            const tipo = e.target.value as Horario['tipo']
            onChange({ ...dados, horario: tipo === 'previsto' ? { tipo } : { tipo, hora: horario.tipo === 'previsto' ? '' : horario.hora } })
          }}
        >
          {(Object.keys(ROTULO_HORARIO) as Horario['tipo'][]).map((t) => <option key={t} value={t}>{ROTULO_HORARIO[t]}</option>)}
        </select>
      </Rotulo>
      {horario.tipo !== 'previsto' && (
        <CampoHora rotulo="Horário" valor={horario.hora} onChange={(v) => onChange({ ...dados, horario: { tipo: horario.tipo, hora: v } })} />
      )}

      <CampoTexto longo rotulo="Observação (opcional)" placeholder="Aparece logo abaixo do texto oficial. Ex.: motivo do horário diferente" valor={dados.observacao ?? ''} onChange={(v) => onChange({ ...dados, observacao: v || undefined })} />
    </>
  )
}
