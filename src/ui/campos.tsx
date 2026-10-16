/** Campos de formulário reutilizáveis (mobile-first). */
import { useState } from 'react'
import type { Genero, Militar, ItemQuantificado, Aviso } from '../domain/tipos'
import { decimalBR, ehMilitarManual, militarManual, parseDecimal, tratamento } from '../domain/formatacao'
import { useApp } from './contexto'
import { BotaoMic, juntarDitado } from './voz'

export function Rotulo({ texto, children }: { texto: string; children: React.ReactNode }) {
  return (
    <div>
      <label>{texto}</label>
      {children}
    </div>
  )
}

/** Número inteiro opcional. Campo vazio = null. */
export function CampoInteiro({ valor, onChange, rotulo, placeholder }: { valor: number | null; onChange: (v: number | null) => void; rotulo: string; placeholder?: string }) {
  return (
    <Rotulo texto={rotulo}>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder={placeholder}
        value={valor === null ? '' : String(valor)}
        onChange={(e) => {
          const t = e.target.value.replace(/\D/g, '')
          onChange(t === '' ? null : Number(t))
        }}
      />
    </Rotulo>
  )
}

/** Decimal no padrão brasileiro (vírgula). Mantém o texto digitado enquanto o usuário edita. */
export function CampoDecimal({ valor, onChange, rotulo }: { valor: number; onChange: (v: number) => void; rotulo: string }) {
  const [texto, setTexto] = useState(valor ? decimalBR(valor) : '')
  return (
    <Rotulo texto={rotulo}>
      <input
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          onChange(parseDecimal(e.target.value))
        }}
        onBlur={() => setTexto(valor ? decimalBR(valor) : '')}
      />
    </Rotulo>
  )
}

export function CampoTexto({ valor, onChange, rotulo, placeholder, longo }: { valor: string; onChange: (v: string) => void; rotulo: string; placeholder?: string; longo?: boolean }) {
  return (
    <Rotulo texto={rotulo}>
      {longo ? (
        <>
          <textarea value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
          <BotaoMic onTexto={(t) => onChange(juntarDitado(valor, t))} />
        </>
      ) : (
        <input value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </Rotulo>
  )
}

export function CampoHora({ valor, onChange, rotulo }: { valor: string; onChange: (v: string) => void; rotulo: string }) {
  return (
    <Rotulo texto={rotulo}>
      <input type="time" value={valor} onChange={(e) => onChange(e.target.value)} />
    </Rotulo>
  )
}

const OUTRO = '__outro'

/** Mini-formulário para digitar um militar que não está no cadastro. */
function MilitarManual({ aoAdicionar, inicial }: { aoAdicionar: (m: Militar) => void; inicial?: Militar | null }) {
  const [texto, setTexto] = useState(inicial?.nomeGuerra ?? '')
  const [genero, setGenero] = useState<Genero>(inicial?.genero ?? 'M')
  return (
    <div className="item-lista">
      <label>Nome como deve aparecer na Parte</label>
      <input value={texto} placeholder="Ex.: SD BM Silva" onChange={(e) => { setTexto(e.target.value); if (inicial !== undefined) aoAdicionar(militarManual(e.target.value, genero)) }} />
      <div className="linha" style={{ marginTop: 6 }}>
        <select aria-label="Gênero" value={genero} onChange={(e) => { const g = e.target.value as Genero; setGenero(g); if (inicial !== undefined) aoAdicionar(militarManual(texto, g)) }}>
          <option value="M">Masculino (o)</option>
          <option value="F">Feminino (a)</option>
        </select>
        {inicial === undefined && (
          <button type="button" className="primario fixo" disabled={!texto.trim()} onClick={() => { aoAdicionar(militarManual(texto, genero)); setTexto('') }}>Adicionar</button>
        )}
      </div>
    </div>
  )
}

/** Escolha de um militar do cadastro ou, se não estiver na lista, digitação do nome. */
export function SelecaoMilitar({ valor, onChange, rotulo, opcional = true }: { valor: Militar | null; onChange: (m: Militar | null) => void; rotulo: string; opcional?: boolean }) {
  const { cad } = useApp()
  const [forcarManual, setForcarManual] = useState(false)
  const manual = forcarManual || ehMilitarManual(valor)
  const ativos = cad.militares.filter((m) => m.ativo !== false || m.id === valor?.id)
  return (
    <div>
      <Rotulo texto={rotulo}>
        <select
          value={manual ? OUTRO : valor?.id ?? ''}
          onChange={(e) => {
            if (e.target.value === OUTRO) { setForcarManual(true); onChange(null); return }
            setForcarManual(false)
            onChange(cad.militares.find((m) => m.id === e.target.value) ?? null)
          }}
        >
          {opcional && <option value="">— selecione —</option>}
          {ativos.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
          <option value={OUTRO}>✎ Outro (digitar o nome)</option>
        </select>
      </Rotulo>
      {manual && <MilitarManual inicial={ehMilitarManual(valor) ? valor : null} aoAdicionar={(m) => onChange(m)} />}
    </div>
  )
}

/** Vários militares: chips com remover, um seletor do cadastro e a opção de digitar outro nome. */
export function ListaMilitares({ valor, onChange, rotulo }: { valor: Militar[]; onChange: (v: Militar[]) => void; rotulo: string }) {
  const { cad } = useApp()
  const [digitando, setDigitando] = useState(false)
  const disponiveis = cad.militares.filter((m) => m.ativo !== false && !valor.some((v) => v.id === m.id))
  return (
    <div>
      <label>{rotulo}</label>
      <div className="chips">
        {valor.map((m) => (
          <span className="chip" key={m.id}>
            {tratamento(m)}
            <button type="button" aria-label={`Remover ${m.nomeGuerra}`} onClick={() => onChange(valor.filter((v) => v.id !== m.id))}>×</button>
          </span>
        ))}
      </div>
      <select
        value=""
        onChange={(e) => {
          if (e.target.value === OUTRO) { setDigitando(true); return }
          const m = cad.militares.find((x) => x.id === e.target.value)
          if (m) onChange([...valor, m])
        }}
      >
        <option value="">+ adicionar militar…</option>
        {disponiveis.map((m) => <option key={m.id} value={m.id}>{tratamento(m)}</option>)}
        <option value={OUTRO}>✎ Outro (digitar o nome)</option>
      </select>
      {digitando && <MilitarManual aoAdicionar={(m) => { onChange([...valor, m]); setDigitando(false) }} />}
    </div>
  )
}

export function SelecaoVtr({ valor, onChange, rotulo }: { valor: string; onChange: (v: string) => void; rotulo: string }) {
  const { cad } = useApp()
  return (
    <Rotulo texto={rotulo}>
      <select value={valor} onChange={(e) => onChange(e.target.value)}>
        <option value="">— selecione —</option>
        {cad.viaturas.filter((v) => v.ativa).map((v) => (
          <option key={v.id} value={v.prefixo}>{v.prefixo}</option>
        ))}
      </select>
    </Rotulo>
  )
}

/** Lista editável de itens "quantidade + descrição" (armamento, comunicação, juntada). */
export function ListaItens({ valor, onChange, vazioTexto = 'Nenhum item.' }: { valor: ItemQuantificado[]; onChange: (v: ItemQuantificado[]) => void; vazioTexto?: string }) {
  const mudar = (i: number, p: Partial<ItemQuantificado>) => onChange(valor.map((x, k) => (k === i ? { ...x, ...p } : x)))
  return (
    <div>
      {valor.length === 0 && <p className="suave">{vazioTexto}</p>}
      {valor.map((it, i) => (
        <div className="item-lista" key={i}>
          <div className="linha">
            <div className="fixo" style={{ width: 90 }}>
              <CampoInteiro rotulo="Qtd." valor={it.quantidade} onChange={(v) => mudar(i, { quantidade: Math.min(99, v ?? 0) })} />
            </div>
            <CampoTexto rotulo="Descrição" valor={it.descricao} onChange={(v) => mudar(i, { descricao: v })} />
            <div className="fixo" style={{ width: 110 }}>
              <Rotulo texto="Gênero">
                <select value={it.genero} onChange={(e) => mudar(i, { genero: e.target.value as Genero })}>
                  <option value="M">masc. (um)</option>
                  <option value="F">fem. (uma)</option>
                </select>
              </Rotulo>
            </div>
            <button type="button" className="perigo pequeno fixo" onClick={() => onChange(valor.filter((_, k) => k !== i))}>Remover</button>
          </div>
        </div>
      ))}
      <button type="button" className="largo" onClick={() => onChange([...valor, { quantidade: 1, genero: 'M', descricao: '' }])}>+ Adicionar item</button>
    </div>
  )
}

export function Avisos({ avisos }: { avisos: Aviso[] }) {
  return (
    <>
      {avisos.map((a) => (
        <div key={a.codigo + a.mensagem} className={`aviso ${a.gravidade}`} role="alert">{a.mensagem}</div>
      ))}
    </>
  )
}

/** PIN para confirmar a assinatura eletrônica (demonstração: aceita qualquer PIN de 4 a 6 dígitos). */
export function CampoPin({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Rotulo texto="PIN para assinar (4 a 6 números)">
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={6}
        value={valor}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      />
      <span className="suave">Demonstração: qualquer PIN serve. No sistema real será a sua senha.</span>
    </Rotulo>
  )
}
