import { describe, expect, it } from 'vitest'
import { avaliarCompatibilidade, detectarDispositivo } from './dispositivo'

const UA = {
  iphoneSafari17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iphoneSafari13: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
  iphoneSafari15: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1',
  ipadComoMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  android13: 'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  android7: 'Mozilla/5.0 (Linux; Android 7.0; SM-G930F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 12; SAMSUNG SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  firefoxAndroid: 'Mozilla/5.0 (Android 13; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0',
  webviewAndroid: 'Mozilla/5.0 (Linux; Android 11; Pixel 5 Build/RQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/110.0.0.0 Mobile Safari/537.36',
  instagramIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21C62 Instagram 320.0.0 (iPhone14,5; iOS 17_2)',
  edgeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
}

const d = (userAgent: string, extra = {}) => detectarDispositivo({ userAgent, ...extra })

describe('detecção de aparelho', () => {
  it('iPhone: Safari e Chrome, com versão do iOS', () => {
    expect(d(UA.iphoneSafari17)).toMatchObject({ so: 'ios', versaoSo: 17, navegador: 'safari', celular: true, emApp: false })
    expect(d(UA.iphoneChrome)).toMatchObject({ so: 'ios', versaoSo: 16, navegador: 'chrome', versaoNavegador: 120 })
  })

  it('iPad em modo desktop (se apresenta como Mac) é reconhecido pelo toque', () => {
    expect(d(UA.ipadComoMac)).toMatchObject({ so: 'mac' })
    expect(d(UA.ipadComoMac, { toquesMaximos: 5 })).toMatchObject({ so: 'ios', celular: false })
  })

  it('Android: Chrome, Samsung Internet, Firefox', () => {
    expect(d(UA.android13)).toMatchObject({ so: 'android', versaoSo: 13, navegador: 'chrome', versaoNavegador: 120, celular: true })
    expect(d(UA.samsung)).toMatchObject({ so: 'android', navegador: 'samsung', versaoSo: 12 })
    expect(d(UA.firefoxAndroid)).toMatchObject({ so: 'android', navegador: 'firefox' })
  })

  it('navegador embutido de outros aplicativos e app já instalado', () => {
    expect(d(UA.webviewAndroid).emApp).toBe(true)
    expect(d(UA.instagramIos).emApp).toBe(true)
    expect(d(UA.android13, { standalone: true }).instalado).toBe(true)
    expect(d(UA.edgeWindows)).toMatchObject({ so: 'windows', navegador: 'edge', celular: false })
  })
})

describe('avaliação de compatibilidade', () => {
  it('aparelhos atuais: plena', () => {
    expect(avaliarCompatibilidade(d(UA.iphoneSafari17)).nivel).toBe('plena')
    expect(avaliarCompatibilidade(d(UA.android13)).nivel).toBe('plena')
    expect(avaliarCompatibilidade(d(UA.samsung)).nivel).toBe('plena')
  })

  it('iPhone antigo: parcial no iOS 15 e antigo no iOS 13', () => {
    expect(avaliarCompatibilidade(d(UA.iphoneSafari15)).nivel).toBe('parcial')
    expect(avaliarCompatibilidade(d(UA.iphoneSafari13)).nivel).toBe('antigo')
  })

  it('Android 7 com Chrome 80 é antigo; Firefox é parcial; WebView avisa para abrir no navegador', () => {
    expect(avaliarCompatibilidade(d(UA.android7)).nivel).toBe('antigo')
    expect(avaliarCompatibilidade(d(UA.firefoxAndroid)).nivel).toBe('parcial')
    const w = avaliarCompatibilidade(d(UA.webviewAndroid))
    expect(w.nivel).toBe('parcial')
    expect(w.avisos.join(' ')).toMatch(/Abra no Chrome ou no Safari/)
  })
})
