/**
 * Sugestões de participação aprendidas das Partes anteriores: o que mais se repete (avaria, visita, rotina,
 * deslocamento, instrução...) aparece como atalho para adicionar com um toque. O autor sempre pode editar.
 * Não sugere o que depende de valores do dia (abastecimento, permuta, substituição, revisão).
 */
import { normalizar } from './busca'
import { textoAlinea } from './textos'
import { equipeParaParte } from './escala'
import type { Alinea, Equipe, NivelTanque, Parte } from './tipos'

const FORA = new Set<Alinea['tipo']>(['abastecimentoVtr', 'abastecimentoEquip', 'permuta', 'substituicao', 'revisao'])

export interface Sugestao {
  alinea: Alinea
  texto: string
  vezes: number
  ultimaData: string
}

export const clonarAlinea = (a: Alinea): Alinea => JSON.parse(JSON.stringify(a)) as Alinea

export function sugerirParticipacoes(partes: { dataServico: string; parte: Parte }[], jaNaParte: Alinea[], max = 6): Sugestao[] {
  const jaTem = new Set(jaNaParte.map((a) => `${a.tipo}|${normalizar(textoAlinea(a))}`))
  const mapa = new Map<string, Sugestao>()
  for (const p of [...partes].sort((a, b) => a.dataServico.localeCompare(b.dataServico))) {
    for (const a of p.parte.itens.participacao) {
      if (FORA.has(a.tipo)) continue
      const texto = textoAlinea(a)
      if (a.tipo === 'livre' && !texto.trim()) continue
      const chave = `${a.tipo}|${normalizar(texto)}`
      const atual = mapa.get(chave)
      mapa.set(chave, { alinea: clonarAlinea(a), texto, vezes: (atual?.vezes ?? 0) + 1, ultimaData: p.dataServico })
    }
  }
  return [...mapa.entries()]
    .filter(([chave]) => !jaTem.has(chave))
    .map(([, s]) => s)
    .sort((a, b) => b.vezes - a.vezes || b.ultimaData.localeCompare(a.ultimaData))
    .slice(0, max)
}

export interface SugestaoContexto {
  alinea: Alinea
  /** Por que o app sugere isto, em uma frase. */
  motivo: string
}

const ORDEM_NIVEL: Record<NivelTanque, number> = { '—': -1, '1/4': 0, '1/2': 1, '3/4': 2, '4/4': 3 }
export const KM_SEM_REGISTRO = 100

/**
 * Sugestões "para este serviço": o app lê o que já foi preenchido e aponta o que parece faltar na Participação
 * (viatura em oficina sem avaria, tanque que subiu sem abastecimento, Km rodado sem deslocamento, militar da
 * escala que não está na guarnição). Só sugere; o autor decide.
 */
export function sugestoesDeContexto(parte: Parte, equipes: Equipe[]): SugestaoContexto[] {
  const lista: SugestaoContexto[] = []
  const part = parte.itens.participacao
  const citaVtr = (vtr: string) => part.some((a) => {
    const t = normalizar(textoAlinea(a))
    return t.includes(normalizar(vtr))
  })

  for (const l of parte.itens.combustivel) {
    const fora = ['oficina', 'inoperante', 'baixada'].includes(l.situacao.tipo)
    if (fora && !citaVtr(l.vtr)) {
      lista.push({
        alinea: { tipo: 'avaria', informante: null, objeto: `a VTR ${l.vtr}`, descricao: l.situacao.tipo === 'oficina' ? 'está na oficina, apresentando defeito' : 'está fora de serviço' },
        motivo: `${l.vtr} está ${l.situacao.tipo === 'oficina' ? 'em oficina' : l.situacao.tipo} e nenhuma participação a cita.`,
      })
      continue
    }
    if (l.recebiNivel !== '—' && l.passeiNivel !== '—' && ORDEM_NIVEL[l.passeiNivel] > ORDEM_NIVEL[l.recebiNivel] && !part.some((a) => a.tipo === 'abastecimentoVtr' && a.vtr === l.vtr)) {
      lista.push({
        alinea: { tipo: 'abastecimentoVtr', vtr: l.vtr, litros: 0, combustivel: 'diesel S10', valor: 0, km: l.passeiKm ?? 0, saldo: 0 },
        motivo: `${l.vtr}: o tanque subiu de ${l.recebiNivel} para ${l.passeiNivel}, mas não há abastecimento registrado.`,
      })
    }
    if (l.recebiKm !== null && l.passeiKm !== null && l.passeiKm - l.recebiKm > KM_SEM_REGISTRO && !part.some((a) => a.tipo === 'deslocamento' && a.vtr === l.vtr)) {
      lista.push({
        alinea: { tipo: 'deslocamento', vtr: l.vtr, municipio: '', militares: [], missao: '', saida: '' },
        motivo: `${l.vtr} rodou ${(l.passeiKm - l.recebiKm).toLocaleString('pt-BR')} Km e não há deslocamento registrado.`,
      })
    }
  }

  if (equipes.length) {
    const equipe = equipeParaParte(equipes, parte.dataServico, parte.autor)
    const presentes = new Set(parte.itens.guarnicao.flatMap((f) => f.militares.map((m) => m.id)))
    for (const f of equipe.guarnicao) {
      for (const m of f.militares) {
        if (!presentes.has(m.id) && lista.filter((x) => x.alinea.tipo === 'efetivo').length < 3) {
          lista.push({
            alinea: { tipo: 'efetivo', militar: m, situacao: 'faltou', hora: '', motivo: '' },
            motivo: `${m.postoGrad} ${m.nomeGuerra} está na escala (${equipe.nome}) e não consta na guarnição.`,
          })
        }
      }
    }
  }

  const jaTem = new Set(part.map((a) => `${a.tipo}|${normalizar(textoAlinea(a))}`))
  return lista.filter((x) => !jaTem.has(`${x.alinea.tipo}|${normalizar(textoAlinea(x.alinea))}`))
}
