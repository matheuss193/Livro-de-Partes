/**
 * Detecção simples do aparelho e do navegador, só para mostrar o guia certo de instalação.
 * Função pura (recebe os dados do navegador) para poder ser testada com User-Agents de exemplo.
 */
export type SistemaOperacional = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'outro'
export type Navegador = 'safari' | 'chrome' | 'samsung' | 'firefox' | 'edge' | 'opera' | 'outro'

export interface Dispositivo {
  so: SistemaOperacional
  /** Versão principal do sistema (ex.: 17 para iOS 17, 13 para Android 13), quando dá para saber. */
  versaoSo: number | null
  navegador: Navegador
  versaoNavegador: number | null
  celular: boolean
  /** Aberto dentro de outro aplicativo (WhatsApp, Instagram, Facebook...): não instala daqui. */
  emApp: boolean
  /** Já aberto como aplicativo instalado (tela inicial). */
  instalado: boolean
}

export interface EntradaDeteccao {
  userAgent: string
  plataforma?: string
  toquesMaximos?: number
  standalone?: boolean
}

const num = (s: string | undefined) => (s ? Number(s.split(/[._]/)[0]) : null)

export function detectarDispositivo(e: EntradaDeteccao): Dispositivo {
  const ua = e.userAgent
  const ipadOs = /Macintosh/.test(ua) && (e.toquesMaximos ?? 0) > 1 // iPad novo se apresenta como Mac
  const ios = /iPhone|iPad|iPod/.test(ua) || ipadOs
  const android = /Android/.test(ua)

  let so: SistemaOperacional = 'outro'
  let versaoSo: number | null = null
  if (ios) {
    so = 'ios'
    versaoSo = num(/OS (\d+[._]\d+)/.exec(ua)?.[1] ?? /Version\/(\d+)/.exec(ua)?.[1])
  } else if (android) {
    so = 'android'
    versaoSo = num(/Android (\d+)/.exec(ua)?.[1])
  } else if (/Windows/.test(ua)) so = 'windows'
  else if (/Macintosh/.test(ua)) so = 'mac'
  else if (/Linux|X11/.test(ua)) so = 'linux'

  // Ordem importa: vários navegadores dizem "Chrome" e "Safari" no User-Agent.
  const REGRAS: [RegExp, Navegador][] = [
    [/SamsungBrowser\/(\d+)/, 'samsung'],
    [/EdgA?\/(\d+)|Edg\/(\d+)|EdgiOS\/(\d+)/, 'edge'],
    [/OPR\/(\d+)|OPiOS\/(\d+)/, 'opera'],
    [/Firefox\/(\d+)|FxiOS\/(\d+)/, 'firefox'],
    [/CriOS\/(\d+)|Chrome\/(\d+)/, 'chrome'],
    [/Version\/(\d+)[\d.]* .*Safari/, 'safari'],
  ]
  let navegador: Navegador = 'outro'
  let versaoNavegador: number | null = null
  for (const [re, nome] of REGRAS) {
    const m = re.exec(ua)
    if (m) {
      navegador = nome
      versaoNavegador = num(m.slice(1).find(Boolean))
      break
    }
  }

  // Aplicativos que abrem links em navegador embutido (não instalam e não guardam dados direito).
  const emApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Twitter|LinkedInApp|; wv\)/.test(ua)

  return {
    so,
    versaoSo,
    navegador,
    versaoNavegador,
    celular: so === 'ios' ? !ipadOs && !/iPad/.test(ua) : so === 'android' && /Mobile/.test(ua),
    emApp,
    instalado: !!e.standalone,
  }
}

export type Compatibilidade = 'plena' | 'parcial' | 'antigo'

/** Resume se o aparelho roda tudo, roda com limitações ou é antigo demais (ver docs/COMPATIBILIDADE.md). */
export function avaliarCompatibilidade(d: Dispositivo): { nivel: Compatibilidade; avisos: string[] } {
  const avisos: string[] = []
  let nivel: Compatibilidade = 'plena'
  const rebaixa = (n: Compatibilidade) => { if (n === 'antigo' || nivel === 'plena') nivel = n }

  if (d.so === 'ios') {
    if (d.versaoSo !== null && d.versaoSo < 14) { rebaixa('antigo'); avisos.push('iPhone com iOS anterior ao 14: atualize o sistema; o app pode não abrir.') }
    else if (d.versaoSo !== null && d.versaoSo < 16) { rebaixa('parcial'); avisos.push('iOS anterior ao 16.4: instalar na tela inicial só funciona pelo Safari, e o ditado por voz pode falhar.') }
    if (d.navegador !== 'safari' && d.versaoSo !== null && d.versaoSo < 16) avisos.push('No iPhone, abra pelo Safari para instalar o app.')
  }
  if (d.so === 'android') {
    if (d.versaoSo !== null && d.versaoSo < 8) { rebaixa('antigo'); avisos.push('Android anterior ao 8: use o Chrome atualizado; alguns recursos podem não funcionar.') }
    if (d.versaoNavegador !== null && d.navegador === 'chrome' && d.versaoNavegador < 87) { rebaixa('antigo'); avisos.push('Chrome desatualizado: atualize pela Play Store.') }
    if (d.navegador === 'firefox') { rebaixa('parcial'); avisos.push('Firefox não tem ditado por voz.') }
  }
  if (d.emApp) { rebaixa('parcial'); avisos.push('Você abriu dentro de outro aplicativo (WhatsApp, Instagram...). Abra no Chrome ou no Safari para instalar e para não perder os dados.') }
  return { nivel, avisos }
}
