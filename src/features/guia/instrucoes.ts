/** Textos do guia de instalação e de arquivos, por aparelho e navegador (função pura, testável). */
import type { Dispositivo } from '../../domain/dispositivo'

export interface Instrucao {
  titulo: string
  passos: string[]
  /** Observação extra, em destaque. */
  nota?: string
}

export function instrucaoInstalacao(d: Dispositivo): Instrucao {
  if (d.instalado) return { titulo: 'O app já está instalado neste aparelho', passos: ['Você já está usando o Livro de Partes pelo ícone da tela inicial. Nada mais a fazer aqui.'] }

  if (d.emApp) {
    return {
      titulo: 'Abra no navegador do aparelho',
      passos: [
        'Você abriu o link dentro de outro aplicativo (WhatsApp, Instagram, Facebook...). Ali não é possível instalar nem guardar os dados com segurança.',
        'Toque nos três pontinhos (⋮) ou no ícone de compartilhar e escolha "Abrir no navegador" (Chrome no Android, Safari no iPhone).',
        'Depois, abra este guia de novo e siga a instalação.',
      ],
    }
  }

  if (d.so === 'ios') {
    const passosSafari = [
      'Toque no botão Compartilhar (um quadrado com uma seta para cima), na barra de baixo do Safari. Em alguns modelos ele fica no alto da tela.',
      'Role a lista e toque em "Adicionar à Tela de Início".',
      'Toque em "Adicionar", no canto superior direito.',
      'Pronto: abra o app pelo novo ícone "Livro de Partes" na tela inicial.',
    ]
    if (d.navegador === 'safari') {
      return { titulo: 'Instalar no iPhone (Safari)', passos: passosSafari, nota: 'Instalar é importante: no Safari comum o iPhone pode apagar os dados do site depois de uns 7 dias sem uso. Instalado na tela inicial, isso não acontece.' }
    }
    if ((d.versaoSo ?? 0) >= 16) {
      return { titulo: 'Instalar no iPhone', passos: passosSafari.map((p, i) => (i === 0 ? 'Toque no botão Compartilhar (quadrado com seta para cima) do seu navegador.' : p)), nota: 'Se a opção "Adicionar à Tela de Início" não aparecer, abra este endereço no Safari e repita.' }
    }
    return { titulo: 'Instalar no iPhone: use o Safari', passos: ['Neste iPhone a instalação só funciona pelo Safari.', 'Copie o endereço desta página, abra o Safari, cole e acesse.', ...passosSafari] }
  }

  if (d.so === 'android') {
    if (d.navegador === 'samsung') {
      return {
        titulo: 'Instalar no Android (Samsung Internet)',
        passos: ['Toque no menu (≡) na barra de baixo.', 'Toque em "Adicionar página a" e depois em "Tela inicial".', 'Confirme em "Adicionar". Abra pelo ícone "Livro de Partes".'],
        nota: 'Se aparecer um ícone de instalar na barra de endereço, também serve.',
      }
    }
    if (d.navegador === 'firefox') {
      return { titulo: 'Instalar no Android (Firefox)', passos: ['Toque nos três pontinhos (⋮).', 'Toque em "Instalar".', 'Confirme. Abra pelo ícone "Livro de Partes".'], nota: 'O ditado por voz não funciona no Firefox. Para usar tudo, prefira o Chrome.' }
    }
    return {
      titulo: 'Instalar no Android (Chrome)',
      passos: ['Toque nos três pontinhos (⋮), no canto superior.', 'Toque em "Instalar app" (ou "Adicionar à tela inicial").', 'Confirme em "Instalar".', 'Abra pelo ícone "Livro de Partes" na tela inicial.'],
    }
  }

  // computador
  if (d.navegador === 'chrome' || d.navegador === 'edge') {
    return { titulo: 'Instalar no computador', passos: ['Na barra de endereço, clique no ícone de instalar (um monitor com uma seta), à direita.', 'Ou abra o menu (⋮ ou ...) e escolha "Instalar Livro de Partes".', 'Confirme. O app abre em janela própria e funciona sem internet.'] }
  }
  if (d.navegador === 'safari') {
    return { titulo: 'Instalar no Mac (Safari)', passos: ['No menu "Arquivo", escolha "Adicionar ao Dock".', 'Confirme. O app abre em janela própria.'] }
  }
  return { titulo: 'Instalar no computador', passos: ['Este navegador não instala aplicativos. Use o Chrome ou o Edge para instalar; você também pode usar o site normalmente.'] }
}

export function instrucaoArquivos(d: Dispositivo, pastaNoComputador: boolean): Instrucao {
  if (pastaNoComputador) {
    return {
      titulo: 'Pasta onde salvar os arquivos',
      passos: ['Escolha uma pasta do computador (por exemplo, Documentos > Livro de Partes). Os PDFs e os backups serão gravados direto nela.', 'O navegador pode pedir permissão de acesso à pasta: toque em "Permitir".'],
    }
  }
  if (d.so === 'ios') {
    return {
      titulo: 'Onde ficam os arquivos no iPhone',
      passos: [
        'O iPhone não deixa o aplicativo escolher a pasta sozinho. Por isso o app usa o compartilhamento do próprio iPhone.',
        'Para escolher a pasta a cada arquivo: toque em "Compartilhar" e depois em "Salvar em Arquivos". Escolha "No meu iPhone", "iCloud Drive" ou outra pasta.',
        'Para definir o local padrão dos downloads: Ajustes > Safari > Downloads, e escolha "No meu iPhone", "iCloud Drive" ou "Outro".',
        'Os arquivos baixados aparecem no aplicativo Arquivos > Downloads.',
      ],
    }
  }
  if (d.so === 'android') {
    return {
      titulo: 'Onde ficam os arquivos no Android',
      passos: [
        'Ao tocar em "Baixar PDF", o arquivo vai para a pasta Downloads (também chamada Transferências) do aparelho. Abra o aplicativo Arquivos para encontrá-lo.',
        'Para escolher a pasta a cada arquivo (Chrome): ⋮ > Configurações > Downloads > ative "Perguntar onde salvar os arquivos".',
        'Outra opção: toque em "Compartilhar" e escolha "Drive", "Arquivos" ou outro aplicativo.',
      ],
    }
  }
  return {
    titulo: 'Onde ficam os arquivos',
    passos: [
      'Os arquivos vão para a pasta de downloads do navegador.',
      'Para escolher a pasta a cada arquivo: nas configurações do navegador, ative "Perguntar onde salvar cada arquivo".',
      'No Chrome ou no Edge do computador, você também pode escolher uma pasta fixa aqui no app.',
    ],
  }
}
