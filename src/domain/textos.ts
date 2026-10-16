/**
 * Geração do texto oficial da Parte, nas frases exatas do modelo
 * (docs/ESPECIFICACAO.md, seção 2, e docs/EXEMPLO_PARTE.md).
 * As expressões de tratamento são fixas por norma: não "melhorar" o português aqui.
 */
import { quantidadeExtenso } from './extenso'
import { dataPorExtenso, decimalBR, doisDigitos, listaComE, reais, somarDias, tratamento } from './formatacao'
import type { Alinea, Genero, Horario, SituacaoEfetivo, ItemQuantificado, LinhaCombustivel, Militar, OcorrenciaRegistro, Parte, SituacaoVtr, Unidade } from './tipos'

export interface Secao {
  numeral: string
  titulo: string
  linhas: string[]
  /** Quando verdadeiro, a primeira linha segue o título na mesma linha (ex.: "Não houve."). */
  mesmaLinha?: boolean
  /** Texto reescrito à mão pelo autor (os dados estruturados deixam de valer para este item). */
  manual?: boolean
}

export interface OpcoesTexto {
  /** Frase quando não há participação (A CONFIRMAR com o comando). */
  fraseSemParticipacao?: string
  /** Texto da assinatura eletrônica, ex.: "assinado eletronicamente em 15/10/2026 07:58". */
  assinatura?: string
}

export const FRASE_SEM_PARTICIPACAO = 'nada houve digno de registro.'

const artigo = (m: Militar) => (m.genero === 'F' ? 'a' : 'o')
const comArtigo = (m: Militar) => `${artigo(m)} ${tratamento(m)}`
/** "O SD BM Fulano" / "A SD BM Fulana" (ou "O [a informar]" quando ainda não escolhido). */
const sujeito = (m: Militar | null) => (m ? `${m.genero === 'F' ? 'A' : 'O'} ${tratamento(m)}` : `O ${PENDENTE}`)
/** "ao SD BM Fulano" / "à SD BM Fulana". */
const complementoAo = (m: Militar | null) => (m ? `${m.genero === 'F' ? 'à' : 'ao'} ${tratamento(m)}` : `ao ${PENDENTE}`)

const PENDENTE = '[a informar]'

interface Substituto {
  militar: Militar | null
  texto?: string
  genero?: Genero
  horario?: Horario
}

/** Nome como aparece na Parte: texto digitado, cadastro ou "[a informar]". */
function nomeSubstituto(s: Substituto): string {
  if (s.texto?.trim()) return s.texto.trim()
  return s.militar ? tratamento(s.militar) : PENDENTE
}

function generoSubstituto(s: Substituto): Genero {
  return s.genero ?? s.militar?.genero ?? 'M'
}

/** "No horário previsto" ou, por ex., "Às 07:40 h, com atraso,". */
export function abertura(h: Horario | undefined): string {
  if (!h || h.tipo === 'previsto') return 'No horário previsto'
  const hora = h.hora || '__:__'
  if (h.tipo === 'antes') return `Às ${hora} h, antes do horário previsto,`
  if (h.tipo === 'atraso') return `Às ${hora} h, com atraso,`
  return `Às ${hora} h, fora do horário previsto,`
}

export function textoRecebimento(s: Substituto): string {
  const nome = nomeSubstituto(s)
  const trecho = generoSubstituto(s) === 'F' ? `da minha antecessora legal, a ${nome}` : `do meu antecessor legal, o ${nome}`
  return `${abertura(s.horario)} assumi o serviço de Comandante do Socorro, ${trecho}, com todas as ordens em vigor.`
}

export function textoPassagem(s: Substituto): string {
  const nome = nomeSubstituto(s)
  const trecho = generoSubstituto(s) === 'F' ? `à minha sucessora legal, a ${nome}` : `ao meu sucessor legal, o ${nome}`
  return `${abertura(s.horario)} passei o serviço de Comandante do Socorro ${trecho}, com todas as ordens em vigor.`
}

export function consumoEnergia(recebi: number, passei: number): number {
  return passei - recebi
}

export function linhaQuantificada(i: ItemQuantificado): string {
  const obs = i.observacao?.trim()
  return `${quantidadeExtenso(i.quantidade, i.genero)} ${i.descricao}${obs ? ` – ${obs}` : ''}`
}

export function textoSituacao(s: SituacaoVtr): string {
  switch (s.tipo) {
    case 'operante': return 'Operante'
    case 'oficina': return 'Oficina'
    case 'inoperante': return 'Inoperante'
    case 'baixada': return 'Baixada'
    case 'missao': return `Em missão (${s.destino})`
    case 'outro': return s.texto
  }
}

const km = (v: number | null) => (v === null ? '—' : String(v))

export function linhaCombustivelTexto(l: LinhaCombustivel): string {
  return `${l.vtr} | ${l.recebiNivel} | ${km(l.recebiKm)} | ${l.passeiNivel} | ${km(l.passeiKm)} | ${textoSituacao(l.situacao)}`
}

export function letraAlinea(indice: number): string {
  return String.fromCharCode(97 + (indice % 26)).repeat(Math.floor(indice / 26) + 1)
}

export function textoAlinea(a: Alinea): string {
  if (a.textoManual !== undefined) return a.textoManual
  switch (a.tipo) {
    case 'permuta':
      return `${sujeito(a.entra)} montou serviço em substituição ${complementoAo(a.sai)}, conforme permuta em anexo.`
    case 'substituicao':
      return `${sujeito(a.entra)} montou serviço em substituição ${complementoAo(a.sai)}, conforme determinação ${a.determinacao}.`
    case 'abastecimentoVtr': {
      const danfe = a.danfe ? ` DANFE nº ${a.danfe}.` : ''
      return `A VTR ${a.vtr} foi abastecida com ${decimalBR(a.litros)} litros de ${a.combustivel} no valor de ${reais(a.valor)}, Km ${a.km}, ficando um saldo disponível de ${reais(a.saldo)}.${danfe}`
    }
    case 'abastecimentoEquip':
      return `Foi abastecido um carote com ${decimalBR(a.litros)} litros de ${a.combustivel} com o cartão ${a.cartao} para os equipamentos operacionais, no valor de ${reais(a.valor)}, ficando um saldo disponível de ${reais(a.saldo)}.`
    case 'deslocamento': {
      const quem = listaComE(a.militares.map(comArtigo))
      const retorno = a.retorno ? ` Retornaram, chegando na Unidade às ${a.retorno} h.` : ''
      const veiculo = a.veiculo?.trim() ? `${a.veiculo.trim()} ` : a.vtr ? `na VTR ${a.vtr} ` : ''
      return `Deslocaram-se ${veiculo}para o Município de ${a.municipio} ${quem} para missão de ${a.missao} às ${a.saida} h.${retorno}`
    }
    case 'pernoite':
      return `Pernoitaram na UBM ${a.quem}.`
    case 'avaria':
      return `${sujeito(a.informante)} informou que ${a.objeto?.trim() || (a.vtr ? `a VTR ${a.vtr}` : PENDENTE)} ${a.descricao}.`
    case 'recebimentoMaterial':
      return `${a.descricao}, os quais foram colocados no ${a.local}.`
    case 'livre':
      return a.texto
    case 'verificacao': {
      const alt = a.alteracoes.trim()
      return `Foi realizada a verificação do material e das viaturas, ${alt ? `com ${/[,;]| e /.test(alt) ? 'as seguintes alterações' : 'a seguinte alteração'}: ${alt}` : 'sem alteração'}.`
    }
    case 'rotina': {
      const feitos = [
        a.parada ? 'a parada diária' : '',
        a.bandeira === 'hasteamento' ? 'o hasteamento da bandeira' : a.bandeira === 'arriamento' ? 'o arriamento da bandeira' : '',
        a.rolagem ? 'a rolagem do trem de socorro' : '',
        a.alarme ? `o teste de alarme${a.horaAlarme ? ` às ${a.horaAlarme} h` : ''}` : '',
      ].filter(Boolean)
      return `Foram realizados ${listaComE(feitos) || PENDENTE}, ${a.observacao.trim() || 'sem alteração'}.`
    }
    case 'efetivo': {
      const hora = a.hora ? ` às ${a.hora} h` : ''
      const motivo = a.motivo.trim() ? `, ${a.motivo.trim()}` : ''
      const fem = a.militar?.genero === 'F'
      const frase: Record<SituacaoEfetivo, string> = {
        faltou: 'não compareceu ao serviço',
        atrasou: `apresentou-se ao serviço com atraso${hora}`,
        dispensado: `foi ${fem ? 'dispensada' : 'dispensado'} do serviço${hora}`,
        atestado: 'apresentou atestado médico',
        liberado: `foi ${fem ? 'liberada' : 'liberado'} do serviço${hora}`,
        apresentou: `apresentou-se ao serviço${hora}`,
      }
      return `${sujeito(a.militar)} ${frase[a.situacao]}${motivo}.`
    }
    case 'instrucao': {
      const periodo = a.inicio ? ` ${a.fim ? `das ${a.inicio} às ${a.fim} h` : `às ${a.inicio} h`}` : ''
      return `Foi realizada instrução de ${a.tema.trim() || PENDENTE}${periodo}, da qual participaram ${a.participantes.trim() || PENDENTE}.`
    }
    case 'visita':
      return `Houve visita de ${a.quem.trim() || PENDENTE} à Unidade${a.hora ? `, às ${a.hora} h` : ''}${a.motivo.trim() ? `, ${a.motivo.trim()}` : ''}.`
    case 'estrutura': {
      const periodo = a.inicio ? (a.fim ? ` das ${a.inicio} às ${a.fim} h` : ` a partir das ${a.inicio} h`) : ''
      return `Houve ${a.objeto.trim() || PENDENTE} na Unidade${periodo}.${a.providencia.trim() ? ` Providência: ${a.providencia.trim()}.` : ''}`
    }
    case 'ordem': {
      const partes = [a.documento.trim() || PENDENTE]
      return `Foi recebido o seguinte documento: ${partes[0]}${a.numero.trim() ? ` nº ${a.numero.trim()}` : ''}${a.origem.trim() ? `, de ${a.origem.trim()}` : ''}${a.assunto.trim() ? `, referente a ${a.assunto.trim()}` : ''}.`
    }
    case 'revisao':
      return `Foi realizada a revisão${a.descricao.trim() ? ` (${a.descricao.trim()})` : ''} na VTR ${a.vtr || PENDENTE}, no Km ${a.km || PENDENTE}.`
    case 'saudeMilitar':
      return `${sujeito(a.militar)} ${a.ocorrido.trim() || PENDENTE}${a.providencia.trim() ? `, ${a.providencia.trim()}` : ''}.`
  }
}

function linhasOcorrencia(regs: OcorrenciaRegistro[]): string[] {
  return regs.length === 0 ? ['Não houve.'] : regs.map((r) => `${r.numeros.join(', ')} – ${r.natureza}`)
}

/** Cabeçalho gerado automaticamente (ignora ajustes manuais). */
export function cabecalhoAutomatico(parte: Parte, unidade: Unidade): string[] {
  const d = unidade.destinatario
  return [
    ...unidade.cabecalho,
    `Parte nº ${parte.numero} de ${dataPorExtenso(parte.dataServico)}`,
    `Do: ${tratamento(parte.autor)} – Comandante do Socorro`,
    `Ao: ${d.militar.genero === 'F' ? 'Sra.' : 'Sr.'} ${tratamento(d.militar)} – ${d.funcao}`,
  ]
}

export function cabecalhoLinhas(parte: Parte, unidade: Unidade): string[] {
  return parte.ajustes?.cabecalho ?? cabecalhoAutomatico(parte, unidade)
}

/** Monta as dez seções (I a X), sempre completas e na ordem do modelo. Aplica os ajustes manuais. */
export function gerarSecoes(parte: Parte, unidade: Unidade, opcoes: OpcoesTexto = {}): Secao[] {
  return gerarSecoesAutomaticas(parte, unidade, opcoes).map((s) => {
    const manual = parte.ajustes?.secoes?.[s.numeral]
    return manual ? { numeral: s.numeral, titulo: s.titulo, linhas: manual, manual: true } : s
  })
}

/** Seções geradas só a partir dos dados estruturados (base para o texto manual). */
export function gerarSecoesAutomaticas(parte: Parte, unidade: Unidade, opcoes: OpcoesTexto = {}): Secao[] {
  const it = parte.itens
  const un = unidade.unidadeEnergia
  const consumo = consumoEnergia(it.energia.recebi, it.energia.passei)

  const guarnicao = [
    `Comandante do Socorro: ${tratamento(parte.autor)}`,
    ...it.guarnicao
      .filter((f) => f.militares.length > 0)
      .map((f) => `${f.funcao}: ${listaComE(f.militares.map(tratamento))}`),
  ]

  const participacao =
    it.participacao.length === 0
      ? [`Participo a V. Sª que: ${opcoes.fraseSemParticipacao ?? FRASE_SEM_PARTICIPACAO}`]
      : ['Participo a V. Sª que:', ...it.participacao.map((a, i) => `${letraAlinea(i)}) ${textoAlinea(a)}`)]

  return [
    { numeral: 'I', titulo: 'Recebimento do Serviço', linhas: [textoRecebimento({ militar: it.recebimento.antecessor, texto: it.recebimento.antecessorTexto, genero: it.recebimento.genero, horario: it.recebimento.horario }), ...(it.recebimento.observacao ? [it.recebimento.observacao] : [])] },
    { numeral: 'II', titulo: 'Guarnição de Serviço', linhas: guarnicao },
    { numeral: 'III', titulo: 'Consumo de Energia', linhas: [`Recebi: ${it.energia.recebi} ${un}`, `Passei: ${it.energia.passei} ${un}`, `Consumo total: ${doisDigitos(consumo)} ${un}`] },
    {
      numeral: 'IV',
      titulo: 'Armamento e Munição',
      linhas: it.armamento.itens.length === 0 ? ['Não houve.'] : it.armamento.itens.map(linhaQuantificada),
      mesmaLinha: it.armamento.itens.length === 0,
    },
    { numeral: 'V', titulo: 'Equipamentos de Comunicação', linhas: it.comunicacao.map(linhaQuantificada) },
    { numeral: 'VI', titulo: 'Consumo de Combustível', linhas: ['VTR | Recebi | Km | Passei | Km | Situação', ...it.combustivel.map(linhaCombustivelTexto)] },
    { numeral: 'VII', titulo: 'Participação', linhas: participacao },
    { numeral: 'VIII', titulo: 'Juntada de Documentos', linhas: it.juntada.map(linhaQuantificada) },
    {
      numeral: 'IX',
      titulo: 'Ocorrências',
      linhas: [
        'Incêndio:', ...linhasOcorrencia(it.ocorrencias.incendio),
        'Salvamento:', ...linhasOcorrencia(it.ocorrencias.salvamento),
        'Prevenção, Auxílio e APH:', ...linhasOcorrencia(it.ocorrencias.aph),
      ],
    },
    { numeral: 'X', titulo: 'Passagem do Serviço', linhas: [textoPassagem({ militar: it.passagem.sucessor, texto: it.passagem.sucessorTexto, genero: it.passagem.genero, horario: it.passagem.horario }), ...(it.passagem.observacao ? [it.passagem.observacao] : [])] },
  ]
}

export function textoAssinatura(parte: Parte, unidade: Unidade, assinatura?: string): string[] {
  return parte.ajustes?.assinatura ?? textoAssinaturaAutomatico(parte, unidade, assinatura)
}

export function textoAssinaturaAutomatico(parte: Parte, unidade: Unidade, assinatura?: string): string[] {
  return [
    `${unidade.cidade}, ${dataPorExtenso(somarDias(parte.dataServico, 1))}`,
    `[${assinatura ?? 'assinatura eletrônica'}]`,
    `${parte.autor.nomeCompleto} – ${[parte.autor.postoGrad, parte.autor.quadro].filter(Boolean).join(' ')}`,
    'Comandante do Socorro',
  ]
}

/** Texto oficial completo, em texto simples (congelado e protegido por hash no encerramento). */
export function gerarTextoOficial(parte: Parte, unidade: Unidade, opcoes: OpcoesTexto = {}): string {
  const blocos = gerarSecoes(parte, unidade, opcoes).map((s) =>
    s.mesmaLinha ? `${s.numeral} – ${s.titulo}: ${s.linhas[0]}` : [`${s.numeral} – ${s.titulo}:`, ...s.linhas].join('\n'),
  )
  return [
    cabecalhoLinhas(parte, unidade).join('\n'),
    ...blocos,
    textoAssinatura(parte, unidade, opcoes.assinatura).join('\n'),
  ].join('\n\n')
}
