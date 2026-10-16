import { describe, expect, it } from 'vitest'
import type { Dispositivo } from '../../domain/dispositivo'
import { instrucaoArquivos, instrucaoInstalacao } from './instrucoes'

const base: Dispositivo = { so: 'android', versaoSo: 13, navegador: 'chrome', versaoNavegador: 120, celular: true, emApp: false, instalado: false }
const com = (p: Partial<Dispositivo>): Dispositivo => ({ ...base, ...p })

describe('guia de instalação', () => {
  it('iPhone no Safari manda usar Compartilhar > Adicionar à Tela de Início', () => {
    const i = instrucaoInstalacao(com({ so: 'ios', navegador: 'safari', versaoSo: 17 }))
    expect(i.passos.join(' ')).toMatch(/Adicionar à Tela de Início/)
    expect(i.nota).toMatch(/7 dias/)
  })

  it('iPhone antigo com outro navegador manda abrir no Safari', () => {
    expect(instrucaoInstalacao(com({ so: 'ios', navegador: 'chrome', versaoSo: 15 })).titulo).toMatch(/Safari/)
  })

  it('Android: Chrome, Samsung e Firefox têm passos diferentes', () => {
    expect(instrucaoInstalacao(base).passos.join(' ')).toMatch(/Instalar app/)
    expect(instrucaoInstalacao(com({ navegador: 'samsung' })).passos.join(' ')).toMatch(/Adicionar página a/)
    expect(instrucaoInstalacao(com({ navegador: 'firefox' })).passos.join(' ')).toMatch(/Instalar/)
  })

  it('dentro de outro aplicativo pede para abrir no navegador; já instalado não pede nada', () => {
    expect(instrucaoInstalacao(com({ emApp: true })).titulo).toMatch(/Abra no navegador/)
    expect(instrucaoInstalacao(com({ instalado: true })).titulo).toMatch(/já está instalado/)
  })

  it('computador com Chrome/Edge', () => {
    expect(instrucaoInstalacao(com({ so: 'windows', celular: false, navegador: 'edge' })).passos.join(' ')).toMatch(/ícone de instalar/)
  })
})

describe('guia de arquivos', () => {
  it('cada sistema tem o caminho certo para escolher onde salvar', () => {
    expect(instrucaoArquivos(com({ so: 'ios' }), false).passos.join(' ')).toMatch(/Salvar em Arquivos/)
    expect(instrucaoArquivos(com({ so: 'ios' }), false).passos.join(' ')).toMatch(/Ajustes > Safari > Downloads/)
    expect(instrucaoArquivos(base, false).passos.join(' ')).toMatch(/Perguntar onde salvar/)
    expect(instrucaoArquivos(com({ so: 'windows', celular: false }), true).titulo).toMatch(/Pasta/)
  })
})
