/** Passos VI a X do editor. */
import { useRef, useState } from 'react'
import type { Alinea, LinhaCombustivel, NivelTanque, OcorrenciaRegistro, SituacaoEfetivo, SituacaoVtr } from '../../domain/tipos'
import { ROTULO_SITUACAO_EFETIVO } from '../../domain/tipos'
import { letraAlinea, textoAlinea } from '../../domain/textos'
import { decimalBR } from '../../domain/formatacao'
import { validarCombustivel } from '../../domain/validacoes'
import {
  Avisos, CampoDecimal, CampoHora, CampoInteiro, CampoTexto, ListaItens, ListaMilitares, Rotulo, SelecaoMilitar, SelecaoVtr,
} from '../../ui/campos'
import { useApp } from '../../ui/contexto'
import type { PropsPasso } from './passos1a5'
import CaixaTexto from '../../ui/CaixaTexto'
import { BotaoMic, juntarDitado } from '../../ui/voz'
import EscolhaSubstituto from './Substituto'
import AnexosJuntada from './Anexos'

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
            <div className="linha" style={{ alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{l.vtr}</h3>
              <button type="button" className="pequeno fixo" onClick={() => alterar(idx, { recebiNivel: '—', recebiKm: null, passeiNivel: '—', passeiKm: null, situacao: { tipo: 'outro', texto: 'Sem informação' } })}>Sem informação</button>
            </div>
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
  { tipo: 'livre', rotulo: '✎ Participação escrita à mão (livre)' },
  { tipo: 'permuta', rotulo: 'Permuta' },
  { tipo: 'substituicao', rotulo: 'Substituição por determinação' },
  { tipo: 'abastecimentoVtr', rotulo: 'Abastecimento de VTR' },
  { tipo: 'abastecimentoEquip', rotulo: 'Abastecimento de equipamentos' },
  { tipo: 'deslocamento', rotulo: 'Deslocamento / missão' },
  { tipo: 'pernoite', rotulo: 'Pernoite' },
  { tipo: 'avaria', rotulo: 'Avaria / manutenção' },
  { tipo: 'recebimentoMaterial', rotulo: 'Recebimento de material' },
  { tipo: 'verificacao', rotulo: 'Verificação de material e viaturas' },
  { tipo: 'rotina', rotulo: 'Parada diária / bandeira / rolagem / teste de alarme' },
  { tipo: 'efetivo', rotulo: 'Alteração de efetivo (falta, atraso, dispensa, atestado)' },
  { tipo: 'saudeMilitar', rotulo: 'Saúde de militar (mal súbito, acidente em serviço)' },
  { tipo: 'instrucao', rotulo: 'Instrução / treinamento' },
  { tipo: 'visita', rotulo: 'Visita à Unidade' },
  { tipo: 'estrutura', rotulo: 'Problema de estrutura (energia, água, internet, rádio)' },
  { tipo: 'ordem', rotulo: 'Ofício / memorando / ordem recebido' },
]

function alineaVazia(tipo: Alinea['tipo']): Alinea {
  switch (tipo) {
    case 'permuta': return { tipo, entra: null, sai: null }
    case 'substituicao': return { tipo, entra: null, sai: null, determinacao: '' }
    case 'abastecimentoVtr': return { tipo, vtr: '', litros: 0, combustivel: 'diesel S10', valor: 0, km: 0, saldo: 0 }
    case 'abastecimentoEquip': return { tipo, litros: 0, combustivel: 'diesel S10', cartao: '', valor: 0, saldo: 0 }
    case 'deslocamento': return { tipo, vtr: '', municipio: '', militares: [], missao: '', saida: '' }
    case 'pernoite': return { tipo, quem: '' }
    case 'avaria': return { tipo, informante: null, objeto: '', descricao: '' }
    case 'recebimentoMaterial': return { tipo, descricao: '', local: '' }
    case 'livre': return { tipo, texto: '' }
    case 'verificacao': return { tipo, alteracoes: '' }
    case 'rotina': return { tipo, parada: true, bandeira: '', rolagem: true, alarme: true, horaAlarme: '', observacao: '' }
    case 'efetivo': return { tipo, militar: null, situacao: 'faltou', hora: '', motivo: '' }
    case 'instrucao': return { tipo, tema: '', inicio: '', fim: '', participantes: 'toda a guarnição' }
    case 'visita': return { tipo, quem: '', hora: '', motivo: '' }
    case 'estrutura': return { tipo, objeto: '', inicio: '', fim: '', providencia: '' }
    case 'ordem': return { tipo, documento: '', numero: '', origem: '', assunto: '' }
    case 'saudeMilitar': return { tipo, militar: null, ocorrido: '', providencia: '' }
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
          <SelecaoVeiculo a={a} onChange={onChange} />
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
          <CampoTexto rotulo="O que está com problema" placeholder="a motosserra Stihl do almoxarifado · o ar-condicionado do alojamento · a VTR AR-146" valor={a.objeto ?? ''} onChange={(v) => onChange({ ...a, objeto: v })} />
          <SelecaoVtr rotulo="Atalho: é uma viatura? (preenche o campo acima)" valor="" onChange={(v) => v && onChange({ ...a, objeto: `a VTR ${v}` })} />
          <CampoTexto longo rotulo="O que ocorreu (continua a frase)" placeholder="apresentou defeito no motor, tendo sido encaminhada para manutenção" valor={a.descricao} onChange={(v) => onChange({ ...a, descricao: v })} />
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
      return <CampoTexto longo rotulo="Escreva a participação do seu jeito" valor={a.texto} onChange={(v) => onChange({ ...a, texto: v })} />
    case 'verificacao':
      return <CampoTexto longo rotulo="Alterações encontradas (deixe em branco se não houve)" placeholder="ex.: falta 01 (um) extintor de PQS na ABT-42; lanterna da UR-119 sem bateria" valor={a.alteracoes} onChange={(v) => onChange({ ...a, alteracoes: v })} />
    case 'rotina':
      return (
        <>
          <CaixaMarcar rotulo="Parada diária (revista)" valor={a.parada} onChange={(v) => onChange({ ...a, parada: v })} />
          <Rotulo texto="Bandeira">
            <select value={a.bandeira} onChange={(e) => onChange({ ...a, bandeira: e.target.value as typeof a.bandeira })}>
              <option value="">não houve</option>
              <option value="hasteamento">Hasteamento</option>
              <option value="arriamento">Arriamento</option>
            </select>
          </Rotulo>
          <CaixaMarcar rotulo="Rolagem do trem de socorro" valor={a.rolagem} onChange={(v) => onChange({ ...a, rolagem: v })} />
          <CaixaMarcar rotulo="Teste de alarme" valor={a.alarme} onChange={(v) => onChange({ ...a, alarme: v })} />
          {a.alarme && <CampoHora rotulo="Hora do teste de alarme" valor={a.horaAlarme} onChange={(v) => onChange({ ...a, horaAlarme: v })} />}
          <CampoTexto rotulo="Observação (em branco = sem alteração)" valor={a.observacao} onChange={(v) => onChange({ ...a, observacao: v })} />
        </>
      )
    case 'efetivo':
      return (
        <>
          <SelecaoMilitar rotulo="Militar" valor={a.militar} onChange={(m) => onChange({ ...a, militar: m })} />
          <Rotulo texto="O que houve">
            <select value={a.situacao} onChange={(e) => onChange({ ...a, situacao: e.target.value as SituacaoEfetivo })}>
              {(Object.keys(ROTULO_SITUACAO_EFETIVO) as SituacaoEfetivo[]).map((s) => <option key={s} value={s}>{ROTULO_SITUACAO_EFETIVO[s]}</option>)}
            </select>
          </Rotulo>
          <CampoHora rotulo="Horário (opcional)" valor={a.hora} onChange={(v) => onChange({ ...a, hora: v })} />
          <CampoTexto rotulo="Motivo / detalhe (opcional)" placeholder="ex.: por motivo de saúde, 2 (dois) dias" valor={a.motivo} onChange={(v) => onChange({ ...a, motivo: v })} />
        </>
      )
    case 'saudeMilitar':
      return (
        <>
          <SelecaoMilitar rotulo="Militar" valor={a.militar} onChange={(m) => onChange({ ...a, militar: m })} />
          <CampoTexto longo rotulo="O que ocorreu" placeholder="sofreu mal súbito durante a atividade física" valor={a.ocorrido} onChange={(v) => onChange({ ...a, ocorrido: v })} />
          <CampoTexto rotulo="Providência (opcional)" placeholder="tendo sido encaminhado à UPA e acompanhado por outro militar" valor={a.providencia} onChange={(v) => onChange({ ...a, providencia: v })} />
        </>
      )
    case 'instrucao':
      return (
        <>
          <CampoTexto rotulo="Tema" placeholder="primeiros socorros / uso de EPI / salvamento em altura" valor={a.tema} onChange={(v) => onChange({ ...a, tema: v })} />
          <div className="linha">
            <CampoHora rotulo="Início" valor={a.inicio} onChange={(v) => onChange({ ...a, inicio: v })} />
            <CampoHora rotulo="Fim (opcional)" valor={a.fim} onChange={(v) => onChange({ ...a, fim: v })} />
          </div>
          <CampoTexto rotulo="Quem participou" valor={a.participantes} onChange={(v) => onChange({ ...a, participantes: v })} />
        </>
      )
    case 'visita':
      return (
        <>
          <CampoTexto rotulo="Quem visitou" placeholder="o Sr. Prefeito / equipe da Defesa Civil estadual" valor={a.quem} onChange={(v) => onChange({ ...a, quem: v })} />
          <CampoHora rotulo="Horário (opcional)" valor={a.hora} onChange={(v) => onChange({ ...a, hora: v })} />
          <CampoTexto rotulo="Motivo (opcional)" placeholder="para conhecer as instalações" valor={a.motivo} onChange={(v) => onChange({ ...a, motivo: v })} />
        </>
      )
    case 'estrutura':
      return (
        <>
          <CampoTexto rotulo="O que houve" placeholder="falta de energia elétrica / falta de água / queda da internet / defeito no gerador" valor={a.objeto} onChange={(v) => onChange({ ...a, objeto: v })} />
          <div className="linha">
            <CampoHora rotulo="Início" valor={a.inicio} onChange={(v) => onChange({ ...a, inicio: v })} />
            <CampoHora rotulo="Fim (opcional)" valor={a.fim} onChange={(v) => onChange({ ...a, fim: v })} />
          </div>
          <CampoTexto longo rotulo="Providência (opcional)" valor={a.providencia} onChange={(v) => onChange({ ...a, providencia: v })} />
        </>
      )
    case 'ordem':
      return (
        <>
          <Rotulo texto="Documento (escolha ou digite)">
            <input list="tipos-documento" value={a.documento} placeholder="Ofício, Memorando, Ordem de Serviço…" onChange={(e) => onChange({ ...a, documento: e.target.value })} />
          </Rotulo>
          <datalist id="tipos-documento">
            {['Ofício', 'Ofício circular', 'Memorando', 'Ordem de Serviço', 'Boletim', 'Despacho', 'Mensagem / e-mail', 'Portaria', 'Nota'].map((d) => <option key={d} value={d} />)}
          </datalist>
          <CampoTexto rotulo="Número (opcional)" valor={a.numero} onChange={(v) => onChange({ ...a, numero: v })} />
          <CampoTexto rotulo="De (origem, opcional)" valor={a.origem} onChange={(v) => onChange({ ...a, origem: v })} />
          <CampoTexto rotulo="Assunto (opcional)" valor={a.assunto} onChange={(v) => onChange({ ...a, assunto: v })} />
        </>
      )
  }
}

function CaixaMarcar({ rotulo, valor, onChange }: { rotulo: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', gap: 10, fontWeight: 400, alignItems: 'center' }}>
      <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} />
      {rotulo}
    </label>
  )
}

/** Veículo do deslocamento: uma VTR do cadastro, outro veículo digitado ou nenhum. */
function SelecaoVeiculo({ a, onChange }: { a: Extract<Alinea, { tipo: 'deslocamento' }>; onChange: (a: Alinea) => void }) {
  const { cad } = useApp()
  const valor = a.veiculo !== undefined ? '__outro' : a.vtr
  return (
    <>
      <Rotulo texto="Veículo">
        <select value={valor} onChange={(e) => {
          if (e.target.value === '__outro') onChange({ ...a, vtr: '', veiculo: a.veiculo ?? '' })
          else onChange({ ...a, vtr: e.target.value, veiculo: undefined })
        }}>
          <option value="">— sem veículo / não informar —</option>
          {cad.viaturas.filter((v) => v.ativa).map((v) => <option key={v.id} value={v.prefixo}>VTR {v.prefixo}</option>)}
          <option value="__outro">✎ Outro (digitar)</option>
        </select>
      </Rotulo>
      {a.veiculo !== undefined && <CampoTexto rotulo="Como deve aparecer (após Deslocaram-se)" placeholder="na embarcação do Grupamento / a pé / no veículo do Sr. ..." valor={a.veiculo} onChange={(v) => onChange({ ...a, veiculo: v })} />}
    </>
  )
}

export function PassoVII({ parte, mudar }: PropsPasso) {
  const [novoTipo, setNovoTipo] = useState<Alinea['tipo']>('permuta')
  const alvoDitado = useRef<number | null>(null)
  const lista = parte.itens.participacao
  const trocar = (nova: Alinea[]) => mudar((i) => ({ ...i, participacao: nova }))
  return (
    <>
      <p className="suave">Se nada houver, deixe sem alíneas: o texto sai com a frase "nada houve digno de registro".</p>
      {lista.map((a, idx) => (
        <div className="cartao" key={idx}>
          <h3>Alínea {letraAlinea(idx)}) · {TIPOS_ALINEA.find((t) => t.tipo === a.tipo)?.rotulo}</h3>
          <CaixaTexto
            linhas={[textoAlinea(a)]}
            manual={a.textoManual !== undefined}
            onAtivar={() => trocar(lista.map((x, k) => (k === idx ? { ...x, textoManual: textoAlinea({ ...x, textoManual: undefined }) } : x)))}
            onChange={(l) => trocar(lista.map((x, k) => (k === idx ? { ...x, textoManual: l.join('\n') } : x)))}
            onRestaurar={() => trocar(lista.map((x, k) => (k === idx ? { ...x, textoManual: undefined } : x)))}
          />
          {a.textoManual === undefined && <FormAlinea a={a} onChange={(n) => trocar(lista.map((x, k) => (k === idx ? n : x)))} />}
          <button type="button" className="perigo pequeno" onClick={() => trocar(lista.filter((_, k) => k !== idx))}>Remover alínea</button>
        </div>
      ))}
      <div className="cartao">
        <button type="button" className="primario largo" onClick={() => trocar([...lista, alineaVazia('livre')])}>✎ Escrever uma participação à mão</button>
        <p className="suave">Livre, do seu jeito: qualquer fato do serviço. Ou escolha um modelo pronto abaixo (todos podem ser reescritos no lápis).</p>
        <Rotulo texto="Modelos prontos">
          <select value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as Alinea['tipo'])}>
            {TIPOS_ALINEA.map((t) => <option key={t.tipo} value={t.tipo}>{t.rotulo}</option>)}
          </select>
        </Rotulo>
        <button type="button" className="largo" style={{ marginTop: 8 }} onClick={() => trocar([...lista, alineaVazia(novoTipo)])}>+ Adicionar modelo escolhido</button>
        <p className="suave" style={{ marginBottom: 0 }}>Ou fale a alínea inteira (vira texto livre):</p>
        <BotaoMic
          rotulo="Ditar uma nova alínea"
          aoIniciar={() => { alvoDitado.current = null }}
          onTexto={(t) => mudar((i) => {
            const idx = alvoDitado.current ?? i.participacao.length
            alvoDitado.current = idx
            const nova: Alinea = { tipo: 'livre', texto: juntarDitado(i.participacao[idx]?.tipo === 'livre' ? (i.participacao[idx] as { texto: string }).texto : '', t) }
            return { ...i, participacao: idx < i.participacao.length ? i.participacao.map((x, k) => (k === idx ? nova : x)) : [...i.participacao, nova] }
          })}
        />
      </div>
    </>
  )
}

/* ---------- VIII – Juntada ---------- */

export function PassoVIII({ parte, mudar, parteId }: PropsPasso) {
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
      <AnexosJuntada parteId={parteId} juntada={itens} />
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
