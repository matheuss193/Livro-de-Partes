/** Passos VI a X do editor. */
import { useState } from 'react'
import type { Alinea, LinhaCombustivel, NivelTanque, OcorrenciaRegistro, SituacaoVtr } from '../../domain/tipos'
import { letraAlinea, textoAlinea } from '../../domain/textos'
import { decimalBR } from '../../domain/formatacao'
import { validarCombustivel } from '../../domain/validacoes'
import {
  Avisos, CampoDecimal, CampoHora, CampoInteiro, CampoTexto, ListaItens, ListaMilitares, Rotulo, SelecaoMilitar, SelecaoVtr,
} from '../../ui/campos'
import { useApp } from '../../ui/contexto'
import type { PropsPasso } from './passos1a5'
import EscolhaSubstituto from './Substituto'

const NIVEIS: NivelTanque[] = ['1/4', '1/2', '3/4', '4/4', '—']
const SITUACOES: { tipo: SituacaoVtr['tipo']; rotulo: string }[] = [
  { tipo: 'operante', rotulo: 'Operante' },
  { tipo: 'oficina', rotulo: 'Oficina' },
  { tipo: 'inoperante', rotulo: 'Inoperante' },
  { tipo: 'missao', rotulo: 'Em missão' },
  { tipo: 'baixada', rotulo: 'Baixada' },
  { tipo: 'outro', rotulo: 'Outro' },
]

function novaSituacao(tipo: SituacaoVtr['tipo']): SituacaoVtr {
  if (tipo === 'missao') return { tipo, destino: '' }
  if (tipo === 'outro') return { tipo, texto: '' }
  return { tipo } as SituacaoVtr
}

function SelecaoNivel({ valor, onChange, rotulo }: { valor: NivelTanque; onChange: (v: NivelTanque) => void; rotulo: string }) {
  return (
    <Rotulo texto={rotulo}>
      <select value={valor} onChange={(e) => onChange(e.target.value as NivelTanque)}>
        {NIVEIS.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </Rotulo>
  )
}

export function PassoVI({ parte, anterior, mudar }: PropsPasso) {
  const avisos = validarCombustivel(parte, anterior)
  const alterar = (idx: number, p: Partial<LinhaCombustivel>) =>
    mudar((i) => ({ ...i, combustivel: i.combustivel.map((l, k) => (k === idx ? { ...l, ...p } : l)) }))
  return (
    <>
      <p className="suave">"Recebi" veio da Parte anterior. Informe o nível e o Km ao passar o serviço.</p>
      {parte.itens.combustivel.some((l) => l.passeiKm === null && l.recebiKm !== null) && (
        <button type="button" className="largo" style={{ marginBottom: 10 }} onClick={() =>
          mudar((i) => ({ ...i, combustivel: i.combustivel.map((l) => (l.passeiKm === null && l.recebiKm !== null ? { ...l, passeiKm: l.recebiKm } : l)) }))}>
          Copiar o Km do "Recebi" nas VTR ainda em branco (não rodaram)
        </button>
      )}
      {parte.itens.combustivel.map((l, idx) => {
        const avisosVtr = avisos.filter((a) => a.mensagem.startsWith(l.vtr))
        return (
          <div className="cartao" key={l.vtr}>
            <h3>{l.vtr}</h3>
            <div className="linha">
              <SelecaoNivel rotulo="Recebi (nível)" valor={l.recebiNivel} onChange={(v) => alterar(idx, { recebiNivel: v })} />
              <CampoInteiro rotulo="Recebi (Km)" valor={l.recebiKm} onChange={(v) => alterar(idx, { recebiKm: v })} />
            </div>
            <div className="linha">
              <SelecaoNivel rotulo="Passei (nível)" valor={l.passeiNivel} onChange={(v) => alterar(idx, { passeiNivel: v })} />
              <CampoInteiro rotulo="Passei (Km)" valor={l.passeiKm} onChange={(v) => alterar(idx, { passeiKm: v })} />
            </div>
            <Rotulo texto="Situação">
              <select value={l.situacao.tipo} onChange={(e) => alterar(idx, { situacao: novaSituacao(e.target.value as SituacaoVtr['tipo']) })}>
                {SITUACOES.map((s) => <option key={s.tipo} value={s.tipo}>{s.rotulo}</option>)}
              </select>
            </Rotulo>
            {l.situacao.tipo === 'missao' && (
              <CampoTexto rotulo="Destino da missão" valor={l.situacao.destino} onChange={(v) => alterar(idx, { situacao: { tipo: 'missao', destino: v } })} />
            )}
            {l.situacao.tipo === 'outro' && (
              <CampoTexto rotulo="Situação (texto)" valor={l.situacao.texto} onChange={(v) => alterar(idx, { situacao: { tipo: 'outro', texto: v } })} />
            )}
            {(l.situacao.tipo === 'oficina' || l.situacao.tipo === 'inoperante') && (
              <div className="aviso">Registre o motivo na Participação (item VII, tipo "Avaria"): o oficial recebe como pendência.</div>
            )}
            <Avisos avisos={avisosVtr} />
          </div>
        )
      })}
    </>
  )
}

/* ---------- VII – Participação ---------- */

const TIPOS_ALINEA: { tipo: Alinea['tipo']; rotulo: string }[] = [
  { tipo: 'permuta', rotulo: 'Permuta' },
  { tipo: 'substituicao', rotulo: 'Substituição por determinação' },
  { tipo: 'abastecimentoVtr', rotulo: 'Abastecimento de VTR' },
  { tipo: 'abastecimentoEquip', rotulo: 'Abastecimento de equipamentos' },
  { tipo: 'deslocamento', rotulo: 'Deslocamento / missão' },
  { tipo: 'pernoite', rotulo: 'Pernoite' },
  { tipo: 'avaria', rotulo: 'Avaria / manutenção' },
  { tipo: 'recebimentoMaterial', rotulo: 'Recebimento de material' },
  { tipo: 'livre', rotulo: 'Texto livre / ocorrência relevante' },
]

function alineaVazia(tipo: Alinea['tipo']): Alinea {
  switch (tipo) {
    case 'permuta': return { tipo, entra: null, sai: null }
    case 'substituicao': return { tipo, entra: null, sai: null, determinacao: '' }
    case 'abastecimentoVtr': return { tipo, vtr: '', litros: 0, combustivel: 'diesel S10', valor: 0, km: 0, saldo: 0 }
    case 'abastecimentoEquip': return { tipo, litros: 0, combustivel: 'diesel S10', cartao: '', valor: 0, saldo: 0 }
    case 'deslocamento': return { tipo, vtr: '', municipio: '', militares: [], missao: '', saida: '' }
    case 'pernoite': return { tipo, quem: '' }
    case 'avaria': return { tipo, informante: null, vtr: '', descricao: '' }
    case 'recebimentoMaterial': return { tipo, descricao: '', local: '' }
    case 'livre': return { tipo, texto: '' }
  }
}

function FormAlinea({ a, onChange }: { a: Alinea; onChange: (a: Alinea) => void }) {
  switch (a.tipo) {
    case 'permuta':
      return (
        <>
          <SelecaoMilitar rotulo="Quem montou o serviço" valor={a.entra} onChange={(m) => onChange({ ...a, entra: m })} />
          <SelecaoMilitar rotulo="Em substituição a" valor={a.sai} onChange={(m) => onChange({ ...a, sai: m })} />
        </>
      )
    case 'substituicao':
      return (
        <>
          <SelecaoMilitar rotulo="Quem montou o serviço" valor={a.entra} onChange={(m) => onChange({ ...a, entra: m })} />
          <SelecaoMilitar rotulo="Em substituição a" valor={a.sai} onChange={(m) => onChange({ ...a, sai: m })} />
          <CampoTexto rotulo="Determinação (conforme…)" placeholder="da B1 / do Sr. …" valor={a.determinacao} onChange={(v) => onChange({ ...a, determinacao: v })} />
        </>
      )
    case 'abastecimentoVtr': {
      const preco = a.litros > 0 && a.valor > 0 ? a.valor / a.litros : 0
      return (
        <>
          <SelecaoVtr rotulo="VTR" valor={a.vtr} onChange={(v) => onChange({ ...a, vtr: v })} />
          <CampoDecimal rotulo="Litros" valor={a.litros} onChange={(v) => onChange({ ...a, litros: v })} />
          <CampoTexto rotulo="Combustível" valor={a.combustivel} onChange={(v) => onChange({ ...a, combustivel: v })} />
          <CampoDecimal rotulo="Valor (R$)" valor={a.valor} onChange={(v) => onChange({ ...a, valor: v })} />
          {preco > 0 && <p className="suave">Preço por litro: R$ {decimalBR(preco)}</p>}
          <CampoInteiro rotulo="Km no abastecimento" valor={a.km || null} onChange={(v) => onChange({ ...a, km: v ?? 0 })} />
          <CampoDecimal rotulo="Saldo disponível do cartão (R$)" valor={a.saldo} onChange={(v) => onChange({ ...a, saldo: v })} />
          <CampoTexto rotulo="Nº da DANFE (opcional)" valor={a.danfe ?? ''} onChange={(v) => onChange({ ...a, danfe: v || undefined })} />
        </>
      )
    }
    case 'abastecimentoEquip':
      return (
        <>
          <CampoDecimal rotulo="Litros" valor={a.litros} onChange={(v) => onChange({ ...a, litros: v })} />
          <CampoTexto rotulo="Combustível" valor={a.combustivel} onChange={(v) => onChange({ ...a, combustivel: v })} />
          <CampoTexto rotulo="Cartão" valor={a.cartao} onChange={(v) => onChange({ ...a, cartao: v })} />
          <CampoDecimal rotulo="Valor (R$)" valor={a.valor} onChange={(v) => onChange({ ...a, valor: v })} />
          <CampoDecimal rotulo="Saldo disponível (R$)" valor={a.saldo} onChange={(v) => onChange({ ...a, saldo: v })} />
        </>
      )
    case 'deslocamento':
      return (
        <>
          <SelecaoVtr rotulo="VTR" valor={a.vtr} onChange={(v) => onChange({ ...a, vtr: v })} />
          <CampoTexto rotulo="Município" valor={a.municipio} onChange={(v) => onChange({ ...a, municipio: v })} />
          <ListaMilitares rotulo="Militares" valor={a.militares} onChange={(v) => onChange({ ...a, militares: v })} />
          <CampoTexto rotulo="Missão de…" placeholder="Defesa Civil" valor={a.missao} onChange={(v) => onChange({ ...a, missao: v })} />
          <CampoHora rotulo="Saída às" valor={a.saida} onChange={(v) => onChange({ ...a, saida: v })} />
          <CampoHora rotulo="Retorno à Unidade às (opcional)" valor={a.retorno ?? ''} onChange={(v) => onChange({ ...a, retorno: v || undefined })} />
        </>
      )
    case 'pernoite':
      return <CampoTexto rotulo="Quem pernoitou na UBM" placeholder="militares ou instituição" valor={a.quem} onChange={(v) => onChange({ ...a, quem: v })} />
    case 'avaria':
      return (
        <>
          <SelecaoMilitar rotulo="Quem informou" valor={a.informante} onChange={(m) => onChange({ ...a, informante: m })} />
          <SelecaoVtr rotulo="VTR" valor={a.vtr} onChange={(v) => onChange({ ...a, vtr: v })} />
          <CampoTexto longo rotulo="O que ocorreu (continua a frase: 'a VTR X …')" placeholder="está apresentando ruído nos freios dianteiros, tendo sido encaminhada à oficina" valor={a.descricao} onChange={(v) => onChange({ ...a, descricao: v })} />
        </>
      )
    case 'recebimentoMaterial':
      return (
        <>
          <CampoTexto longo rotulo="Descrição do material" valor={a.descricao} onChange={(v) => onChange({ ...a, descricao: v })} />
          <CampoTexto rotulo="Local onde foi colocado" valor={a.local} onChange={(v) => onChange({ ...a, local: v })} />
        </>
      )
    case 'livre':
      return <CampoTexto longo rotulo="Texto" valor={a.texto} onChange={(v) => onChange({ ...a, texto: v })} />
  }
}

export function PassoVII({ parte, mudar }: PropsPasso) {
  const [novoTipo, setNovoTipo] = useState<Alinea['tipo']>('permuta')
  const lista = parte.itens.participacao
  const trocar = (nova: Alinea[]) => mudar((i) => ({ ...i, participacao: nova }))
  return (
    <>
      <p className="suave">Se nada houver, deixe sem alíneas: o texto sai com a frase "nada houve digno de registro".</p>
      {lista.map((a, idx) => (
        <div className="cartao" key={idx}>
          <h3>Alínea {letraAlinea(idx)}) · {TIPOS_ALINEA.find((t) => t.tipo === a.tipo)?.rotulo}</h3>
          <div className="texto-oficial">{`${letraAlinea(idx)}) ${textoAlinea(a)}`}</div>
          <FormAlinea a={a} onChange={(n) => trocar(lista.map((x, k) => (k === idx ? n : x)))} />
          <button type="button" className="perigo pequeno" onClick={() => trocar(lista.filter((_, k) => k !== idx))}>Remover alínea</button>
        </div>
      ))}
      <div className="cartao">
        <Rotulo texto="Nova alínea">
          <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as Alinea['tipo'])}>
            {TIPOS_ALINEA.map((t) => <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>)}
          </select>
        </Rotulo>
        <button type="button" className="primario largo" style={{ marginTop: 8 }} onClick={() => trocar([...lista, alineaVazia(novoTipo)])}>+ Adicionar alínea</button>
      </div>
    </>
  )
}

/* ---------- VIII – Juntada ---------- */

export function PassoVIII({ parte, mudar }: PropsPasso) {
  const permutas = parte.itens.participacao.filter((a) => a.tipo === 'permuta').length
  const abast = parte.itens.participacao.filter((a) => a.tipo === 'abastecimentoVtr' || a.tipo === 'abastecimentoEquip').length
  const itens = parte.itens.juntada
  const tem = (t: string) => itens.some((j) => j.descricao.toLowerCase().includes(t))
  const sugestoes: { texto: string; add: () => void }[] = []
  if (permutas > 0 && !tem('permuta')) {
    sugestoes.push({ texto: `Adicionar ${permutas} permuta(s) citada(s) no item VII`, add: () => mudar((i) => ({ ...i, juntada: [...i.juntada, { quantidade: permutas, genero: 'F', descricao: permutas === 1 ? 'Permuta' : 'Permutas' }] })) })
  }
  if (abast > 0 && !tem('abastecimento')) {
    sugestoes.push({ texto: `Adicionar ${abast} nota(s) de abastecimento do item VII`, add: () => mudar((i) => ({ ...i, juntada: [...i.juntada, { quantidade: abast, genero: 'F', descricao: abast === 1 ? 'Nota fiscal de abastecimento' : 'Notas fiscais de abastecimento' }] })) })
  }
  return (
    <>
      <p className="suave">Documentos que acompanham a Parte. Os três primeiros são o padrão diário.</p>
      {sugestoes.map((s) => <button key={s.texto} type="button" className="largo" style={{ marginBottom: 8 }} onClick={s.add}>{s.texto}</button>)}
      <ListaItens valor={itens} onChange={(v) => mudar((i) => ({ ...i, juntada: v }))} />
    </>
  )
}

/* ---------- IX – Ocorrências ---------- */

type Grupo = 'incendio' | 'salvamento' | 'aph'
const GRUPOS: { chave: Grupo; rotulo: string }[] = [
  { chave: 'incendio', rotulo: 'Incêndio' },
  { chave: 'salvamento', rotulo: 'Salvamento' },
  { chave: 'aph', rotulo: 'Prevenção, Auxílio e APH' },
]

export function PassoIX({ parte, mudar }: PropsPasso) {
  const { cad } = useApp()
  const alterar = (g: Grupo, nova: OcorrenciaRegistro[]) => mudar((i) => ({ ...i, ocorrencias: { ...i.ocorrencias, [g]: nova } }))
  return (
    <>
      <p className="suave">Grupo vazio sai como "Não houve." Vários números com a mesma natureza: separe por vírgula.</p>
      {GRUPOS.map(({ chave, rotulo }) => {
        const regs = parte.itens.ocorrencias[chave]
        const sugeridas = cad.naturezas.filter((n) => n.grupo === chave)
        return (
          <div className="cartao" key={chave}>
            <h3>{rotulo}</h3>
            {regs.length === 0 && <p className="suave">Não houve.</p>}
            {regs.map((r, idx) => (
              <div className="item-lista" key={idx}>
                <CampoTexto rotulo="Nº(s) da ocorrência" placeholder="900110, 900118" valor={r.numeros.join(', ')} onChange={(v) => alterar(chave, regs.map((x, k) => (k === idx ? { ...x, numeros: v.split(',').map((s) => s.trim()).filter(Boolean) } : x)))} />
                <Rotulo texto="Natureza">
                  <input list={`nat-${chave}`} value={r.natureza} onChange={(e) => alterar(chave, regs.map((x, k) => (k === idx ? { ...x, natureza: e.target.value } : x)))} />
                </Rotulo>
                <button type="button" className="perigo pequeno" onClick={() => alterar(chave, regs.filter((_, k) => k !== idx))}>Remover</button>
              </div>
            ))}
            <datalist id={`nat-${chave}`}>{sugeridas.map((n) => <option key={n.id} value={n.descricao} />)}</datalist>
            <button type="button" className="largo" onClick={() => alterar(chave, [...regs, { numeros: [], natureza: '' }])}>+ Adicionar ocorrência</button>
          </div>
        )
      })}
    </>
  )
}

/* ---------- X – Passagem ---------- */

export function PassoX({ parte, mudar }: PropsPasso) {
  const p = parte.itens.passagem
  return (
    <EscolhaSubstituto
      papel="sucessor"
      dica="Quem recebe o serviço de você. A assinatura e a data (dia seguinte) são geradas ao encerrar."
      dados={{ militar: p.sucessor, texto: p.sucessorTexto, genero: p.genero, horario: p.horario, observacao: p.observacao }}
      onChange={(d) => mudar((i) => ({ ...i, passagem: { sucessor: d.militar, sucessorTexto: d.texto, genero: d.genero, horario: d.horario, observacao: d.observacao } }))}
    />
  )
}
