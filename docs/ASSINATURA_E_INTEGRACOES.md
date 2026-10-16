# Assinatura digital, gov.br e integrações

Resumo para o Comando (a mesma informação está nas páginas da [apresentação](APRESENTACAO_COMANDANTE.pdf)).

## Situação atual
O protótipo usa **assinatura eletrônica própria**: login do usuário + PIN, data e hora, hash SHA-256 e QR Code de verificação.
**Não é a assinatura do gov.br.** Integrar o gov.br é possível, mas depende de autorização e de definição do Comando e do Estado.

## Base legal (confirmar com o jurídico do CBMPA)
- **Lei 14.063/2020:** assinatura eletrônica **simples**, **avançada** e **qualificada** (certificado ICP-Brasil). Fontes públicas indicam que contas
  gov.br de nível prata ou ouro permitem a assinatura avançada.
- **Decreto Estadual 2.176/2018** (Processo Administrativo Eletrônico, PAE; publicado no site do CBMPA): no Executivo do Pará valem o
  certificado digital **ou** o cadastro de usuário com login e senha, regulamentado por cada órgão. Isso indica que a assinatura por login
  individual pode ser reconhecida por norma interna do CBMPA. *(O texto integral do decreto não foi conferido artigo por artigo.)*

## Caminhos
| # | Caminho | Como funciona | Depende de |
|---|---|---|---|
| 1 | Assinatura própria do app | Login individual por militar + PIN/senha; data e hora do servidor; hash e QR | Ordem/portaria do Comando reconhecendo. Imediato |
| 2 | Assinador gov.br usado à mão (ponte) | O app gera o PDF; os dois assinam em assinador.iti.br e conferem no validador do ITI | Conta gov.br prata/ouro de cada um. Imediato, mas manual |
| 3 | Login gov.br no app | Login Único (OpenID Connect); assinatura amarrada à identidade gov.br | Credenciais pedidas ao gov.br por um responsável do órgão; domínio oficial de governo (a confirmar) |
| 4 | API de assinatura gov.br | O app envia o hash do PDF; o militar autoriza com o gov.br; a assinatura volta e é gravada no PDF | Pedido formal de credenciais, chaves PGP, homologação |
| 5 | Certificado ICP-Brasil | Assinatura qualificada (A1, A3 ou nuvem), PDF no padrão PAdES | Certificado por militar (custo) |
| 6 | PAE / PRODEPA | O PDF da Parte entra no processo eletrônico do Estado, que já tem assinatura própria | Convênio ou API da PRODEPA (a confirmar) |

## Caminho sugerido, em fases
1. **Agora:** manter a assinatura própria, oficializada por ordem interna; usar o Assinador gov.br como reforço quando o Comando quiser.
2. **Piloto com servidor:** login individual por militar (conta gov.br via Login Único ou cadastro do Estado).
3. **Se exigirem assinatura qualificada:** API do gov.br, ICP-Brasil ou integração com o PAE.

## Passos para o Comando
1. Definir, com o jurídico, o nível que a Parte exige (simples, avançada ou qualificada).
2. Falar com a PRODEPA e a SEPLAD sobre o PAE, a assinatura do Estado, a hospedagem e o domínio oficial.
3. Se for gov.br: indicar um responsável e pedir as credenciais de homologação e de produção.
4. Homologar com contas de teste e fazer piloto no 9º GBM.

## Como validar
- **Integridade:** hash e QR Code do PDF (já existe).
- **Autoria:** validador do ITI para assinaturas gov.br e ICP-Brasil.
- **Histórico de ações:** trilha de auditoria do servidor (fase 2).

## Fontes consultadas (públicas)
- Roteiro de integração da API de assinatura eletrônica gov.br: https://manual-integracao-assinatura-eletronica.readthedocs.io/
- Assinador gov.br (portal): https://assinador.iti.br
- Decreto Estadual nº 2.176/2018 (PAE), no site do CBMPA.
- Lei nº 14.063/2020.

Exigências, prazos e custos **não foram confirmados** com o gov.br, a PRODEPA ou o jurídico: precisam ser levantados pelo Comando.
