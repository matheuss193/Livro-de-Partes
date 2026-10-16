# Compatibilidade com celulares e navegadores

Última conferência: 16/10/2026. Método: análise do código gerado (sintaxe máxima ES2021, conferida com `es-check`),
polyfills para funções modernas, testes automáticos de detecção de aparelho com User-Agents reais de iPhone/Android/Samsung/Firefox/
WebView e navegação em tela de celular no navegador do computador. **Não foi testado em aparelhos físicos** (veja o fim).

## Aparelhos e navegadores
| Aparelho | Mínimo para o app abrir | Instalação na tela inicial | Observações |
|---|---|---|---|
| iPhone / iPad | iOS 14 (Safari 14) | Safari: sim. Outros navegadores: iOS 16.4 ou mais | Fora da tela inicial, o Safari pode apagar os dados do site após ~7 dias sem uso: instale e faça backup |
| Android (Chrome) | Android 8 com Chrome 87+ | Sim (menu ⋮ > Instalar app) | Atualize o Chrome pela Play Store |
| Samsung Internet | Versão 14+ | Sim (menu > Adicionar página a > Tela inicial) | |
| Firefox Android | 88+ | Sim (menu > Instalar) | Sem ditado por voz |
| Computador | Chrome/Edge 87+, Firefox 88+, Safari 14+ | Chrome/Edge: sim | Chrome/Edge permitem escolher uma pasta fixa para os arquivos |
| Dentro de WhatsApp/Instagram/Facebook | Abre, mas não instala | Não | O guia manda abrir no navegador |

Aparelhos mais antigos (iOS 13 ou menos, Android 7 ou menos, Chrome abaixo de 87) recebem um aviso no guia de primeiro acesso.

## Recursos por plataforma
| Recurso | Android Chrome | iPhone Safari | Computador Chrome/Edge |
|---|---|---|---|
| Editar, encerrar, visto, PDF, painel, busca | Sim | Sim | Sim |
| Funcionar sem internet (PWA) | Sim | Sim (iOS 11.3+) | Sim |
| Ditado por voz | Sim (precisa de internet) | iOS 14.5+ (pode falhar) | Sim (precisa de internet) |
| Anexar foto pela câmera | Sim | Sim | Escolhe arquivo |
| Compartilhar PDF (WhatsApp, Drive, Arquivos) | Sim | Sim (iOS 15+) | Não (baixa o arquivo) |
| Escolher a pasta dos arquivos | Pelas configurações do Chrome ("Perguntar onde salvar") ou Compartilhar | "Salvar em Arquivos" ou Ajustes > Safari > Downloads | Pasta fixa escolhida no app |
| Dados protegidos contra limpeza | Pedir armazenamento fixo + backup | Instalar na tela inicial + backup | Pedir armazenamento fixo + backup |

## Escolha das pastas
Navegadores de celular **não permitem que um site escolha pastas**. Por isso:
- **Computador (Chrome/Edge):** o guia deixa escolher uma pasta (ex.: Documentos > Livro de Partes) e os PDFs e backups são gravados nela.
- **Android:** "Baixar PDF" salva em Downloads; para escolher a pasta a cada arquivo, ative no Chrome "Perguntar onde salvar os arquivos";
  ou use "Compartilhar" > Drive/Arquivos.
- **iPhone:** use "Compartilhar" > "Salvar em Arquivos" (escolhe qualquer pasta) ou defina o local padrão em Ajustes > Safari > Downloads.

## O que foi feito para a compatibilidade
- Alvo de compilação: Chrome 87, Safari 14, Firefox 88, Edge 88 (sintaxe até ES2021).
- Polyfills (`src/polyfills.ts`) para `Array/String.at`, `String.replaceAll`, `Object.hasOwn`; identificador único sem `crypto.randomUUID` (iOS < 15.4);
  conversão de imagens WEBP sem `createImageBitmap` (Safari antigo).
- iPhone: ícone de tela inicial, `viewport-fit=cover`, áreas seguras (notch e barra inferior), campos a 16 px (sem zoom automático).
- Detecção do aparelho e navegador com avisos (`src/domain/dispositivo.ts`) e guia de instalação por plataforma (`src/features/guia`).

## O que ainda precisa ser testado em aparelhos reais
Instalação na tela inicial (iPhone e Android), câmera, ditado por voz, compartilhar arquivo, modo avião (offline) e
comportamento dos dados após dias sem uso no iPhone. Sugestão: testar em pelo menos um iPhone com Safari, um Android com
Chrome e um Samsung com Samsung Internet, seguindo o [roteiro de demonstração](ROTEIRO_DEMONSTRACAO.md).
