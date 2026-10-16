/** Passos I a V do editor. Cada passo recebe os itens e devolve a versão alterada. */
import { useState } from 'react'
import type { ItensParte, Parte } from '../../domain/tipos'
import { consumoEnergia } from '../../domain/textos'
import { doisDigitos, tratamento } from '../../domain/formatacao'
import { validarEnergia } from '../../domain/validacoes'
import { Avisos, CampoInteiro, CampoTexto, ListaItens, ListaMilitares } from '../../ui/campos'
import EscolhaSubstituto from './Substituto'
import { useApp } from '../../ui/contexto'

export interface PropsPasso {
  parte: Parte
  /** Contexto da Parte anterior encerrada, quando existe. */
  anterior?: Parte
  mudar: (f: (itens: ItensParte) => ItensParte) => void
}

export function PassoI({ parte, anterior, mudar }: PropsPasso) {
  const r = parte.itens.recebimento
  return (
    <EscolhaSubstituto
      papel="antecessor"
      dica={anterior ? `Já vem o autor da Parte anterior (${tratamento(anterior.autor)}). Troque só se foi outro militar.` : 'Não há Parte anterior: escolha o antecessor.'}
      dados={{ militar: r.antecessor, texto: r.antecessorTexto, genero: r.genero, horario: r.horario, observacao: r.observacao }}
      onChange={(d) => mudar((i) => ({ ...i, recebimento: { antecessor: d.militar, antecessorTexto: d.texto, genero: d.genero, horario: d.horario, observacao: d.observacao } }))}
    />
  )
}

export function PassoII({ parte, mudar }: PropsPasso) {
  return (
    <>
      <div className="cartao"><strong>Comandante do Socorro:</strong> {tratamento(parte.autor)} <span className="suave">(autor da Parte, automático)</span></div>
      {parte.itens.guarnicao.map((f, idx) => (
        <div className="cartao" key={idx}>
          <ListaMilitares rotulo={f.funcao} valor={f.militares} onChange={(ms) => mudar((i) => ({ ...i, guarnicao: i.guarnicao.map((x, k) => (k === idx ? { ...x, militares: ms } : x)) }))} />
          {idx >= 6 && (
            <button type="button" className="perigo pequeno" onClick={() => mudar((i) => ({ ...i, guarnicao: i.guarnicao.filter((_, k) => k !== idx) }))}>Remover função</button>
          )}
        </div>
      ))}
      <FuncaoExtra onAdd={(nome) => mudar((i) => ({ ...i, guarnicao: [...i.guarnicao, { funcao: nome, militares: [] }] }))} />
    </>
  )
}

function FuncaoExtra({ onAdd }: { onAdd: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <div className="cartao">
      <CampoTexto rotulo="Função extra (opcional)" valor={nome} onChange={setNome} placeholder="Ex.: Motorista de apoio" />
      <button type="button" disabled={!nome.trim()} onClick={() => { onAdd(nome.trim()); setNome('') }}>+ Adicionar função</button>
    </div>
  )
}

export function PassoIII({ parte, anterior, mudar }: PropsPasso) {
  const { cad } = useApp()
  const e = parte.itens.energia
  const un = cad.unidade.unidadeEnergia
  const avisos = validarEnergia(e, anterior ? { passei: anterior.itens.energia.passei } : undefined)
  const podeMostrar = e.recebi > 0 && e.passei > 0
  return (
    <>
      <CampoInteiro rotulo={`Recebi (${un})`} valor={e.recebi || null} onChange={(v) => mudar((i) => ({ ...i, energia: { ...i.energia, recebi: v ?? 0 } }))} />
      <CampoInteiro rotulo={`Passei (${un})`} valor={e.passei || null} onChange={(v) => mudar((i) => ({ ...i, energia: { ...i.energia, passei: v ?? 0 } }))} />
      {podeMostrar && e.passei >= e.recebi && <p><strong>Consumo total: {doisDigitos(consumoEnergia(e.recebi, e.passei))} {un}</strong></p>}
      {podeMostrar && <Avisos avisos={avisos} />}
    </>
  )
}

export function PassoIV({ parte, mudar }: PropsPasso) {
  const itens = parte.itens.armamento.itens
  return (
    <>
      <p className="suave">Sem alteração, o texto sai "Não houve." Adicione itens só se houve movimentação de armamento ou munição.</p>
      <ListaItens vazioTexto="Não houve." valor={itens} onChange={(v) => mudar((i) => ({ ...i, armamento: { itens: v } }))} />
    </>
  )
}

export function PassoV({ parte, mudar }: PropsPasso) {
  return (
    <>
      <p className="suave">Lista padrão da unidade. Ajuste a quantidade se algo estiver faltando e registre o defeito na Participação (item VII).</p>
      <ListaItens vazioTexto="Nenhum equipamento." valor={parte.itens.comunicacao} onChange={(v) => mudar((i) => ({ ...i, comunicacao: v }))} />
    </>
  )
}
