# Especificação — Livro de Partes Digital (CBMPA / 9º GBM)

Base: análise de 16 fotos de Partes reais do livro físico do 9º GBM (maio a setembro de 2026),
escritas por diferentes Comandantes do Socorro. O formato é rígido; o conteúdo muda a cada serviço.

---

## 1. Contexto do serviço

- Serviço de **24 horas**. A Parte é datada do **dia em que o serviço começa**; a passagem do serviço
  (item X) é datada do **dia seguinte**.
- **Comandante do Socorro** (CMT do SOS): chefe da guarnição do dia, normalmente 2º ou 3º SGT. Redige a Parte.
- **Destinatário**: o SubComandante do GBM (oficial). Hoje: "Sr. 1º TEN QOBM [nome] – SubCmt do 9º GBM".
  Configurável por unidade. O comando da unidade tem ainda oficiais superiores (ex.: TEN CEL).
- O oficial lê a Parte, dá o **visto** (no físico: rubrica no triângulo do cabeçalho e um "✓"/rubrica
  na margem direita ao lado de cada alínea de participação) e toma providências.
- As Partes ficam em sequência no mesmo livro; a próxima começa logo após a assinatura da anterior.

Hierarquia (para cadastros e textos): SD, CB, 3º SGT, 2º SGT, 1º SGT, ST, Asp, 2º TEN, 1º TEN, CAP,
MAJ, TEN CEL, CEL. Quadros vistos nas fotos: **QBM** (praças), **QOBM** (oficiais); às vezes só "BM".
Nome de guerra é como o militar é citado ("2º SGT QBM S. Monteiro").

---

## 2. Modelo oficial da Parte

### 2.1 Cabeçalho (quadro)
À esquerda, um triângulo/área diagonal com o texto **"Visto do SubCmt"** (onde o oficial rubrica).
À direita, em linhas:

```
Corpo de Bombeiros Militar do Pará
Coordenadoria Estadual de Defesa Civil
9º Grupamento Bombeiro Militar
Parte nº {numero} de {dia} de {mês por extenso} de {ano}
Do: {posto/grad} {quadro} {nome de guerra} – Comandante do Socorro
Ao: Sr. {posto} {quadro} {nome de guerra} – SubCmt do 9º GBM
```
As 3 primeiras linhas e o destinatário vêm da configuração da unidade (preparar para outras unidades).

### 2.2 Itens (sempre todos, sempre nesta ordem, numerados em romanos)

| Item | Título oficial |
|---|---|
| I | Recebimento do Serviço |
| II | Guarnição de Serviço |
| III | Consumo de Energia |
| IV | Armamento e Munição |
| V | Equipamentos de Comunicação |
| VI | Consumo de Combustível |
| VII | Participação |
| VIII | Juntada de Documentos |
| IX | Ocorrências |
| X | Passagem do Serviço |

A estrutura fixa elimina erros vistos no físico (itens com numeração trocada ou pulada).

### 2.3 Conteúdo de cada item

**I – Recebimento do Serviço** (frase padrão, gerada):
> No horário previsto assumi o serviço de Comandante do Socorro, do meu antecessor legal, o 2º SGT QBM {nome}, com todas as ordens em vigor.

- Concordância de gênero: "da minha antecessora legal, a 2º SGT QBM {nome}". Gênero vem do cadastro.
- Antecessor = autor da Parte anterior (pré-preenchido; editável com justificativa).
- Campo opcional de observação (ex.: recebimento fora do horário).

**II – Guarnição de Serviço** — lista de funções configuráveis, cada uma com 0..n militares:
- Comandante do Socorro (= autor)
- Adjunto ao CMT do SOS / Chefe de Guarnição
- Condutor e Operador de VTR Inc/Salv
- Condutor da VTR UR-119
- Socorristas (UR-119)
- Guarnição de Incêndio
- Guarnição de Salvamento
Formato de linha: `{Função}: {posto} {quadro} {nome}` e, para vários, "SD Fulano e SD Beltrano"
(vírgulas + "e" no último). Permitir função extra livre.

**III – Consumo de Energia**
```
Recebi: {leitura} kWh
Passei: {leitura} kWh
Consumo total: {passei − recebi} kWh
```
- "Recebi" pré-preenchido com o "Passei" da Parte anterior. Consumo calculado.
- Nas fotos aparece "kW/h"; a unidade correta é **kWh**. **A CONFIRMAR** com o comando qual grafia usar
  (deixar configurável, padrão "kWh").
- Valores reais observados: consumo diário de 6 a 9 kWh (útil para alerta de valor atípico).

**IV – Armamento e Munição** — padrão "Não houve."; se houver, lista de itens com quantidade.

**V – Equipamentos de Comunicação** — lista configurável da unidade, marcada como recebida/passada.
Padrão do 9º GBM:
```
01 (um) Rádio base fixa digital
02 (dois) Rádios HT portáteis digitais
01 (um) Rádio ponto a ponto com carregador
01 (um) Smartphone Samsung com carregador
```
Permitir registrar alteração (ex.: equipamento com defeito), que deve gerar alerta ao oficial.

**VI – Consumo de Combustível** — tabela, uma linha por viatura (VTR) da frota:

| VTR | Recebi (nível) | Km | Passei (nível) | Km | Situação |
|---|---|---|---|---|---|

- Nível do tanque: `1/4`, `1/2`, `3/4`, `4/4` (e "—" quando a VTR não está na unidade).
- Situação: Operante, Oficina, Inoperante, Em missão (com destino, ex.: "Missão Anapu"), Baixada, outro (texto).
- Frota atual do 9º GBM (cadastro editável, ordem como no livro):
  ABT-42, ABTF-14, AT-12, ATT-02, UR-119, AR-129, AR-145, AR-146, ARL-51, AFR-19, APS-96, APSL-17.
  **A CONFIRMAR**: significado oficial de cada sigla e tipo de combustível de cada VTR.
- "Recebi" (nível e Km) pré-preenchido com o "Passei" da Parte anterior.

**VII – Participação** — começa com "Participo a V. Sª que:" e segue em alíneas `a)`, `b)`, `c)`…
(letras automáticas). Se não houver: "Participo a V. Sª que: nada houve digno de registro." — **A CONFIRMAR** a frase.
Cada alínea tem um **tipo** com formulário e frase-modelo editável:

| Tipo | Frase-modelo (gerada, editável) |
|---|---|
| Permuta | O SD BM {A} montou serviço em substituição ao SD BM {B}, conforme permuta em anexo. |
| Substituição por determinação | O 3º SGT QBM {A} montou serviço em substituição ao SD BM {B}, conforme determinação {da B1 / do Sr. ...}. |
| Abastecimento de VTR | A VTR {VTR} foi abastecida com {litros} litros de {combustível} no valor de R$ {valor}, Km {km}, ficando um saldo disponível de R$ {saldo}. [DANFE nº {n}] |
| Abastecimento de equipamentos | Foi abastecido um carote com {litros} litros de {combustível} com o cartão {cartão} para os equipamentos operacionais, no valor de R$ {valor}, ficando um saldo disponível de R$ {saldo}. |
| Deslocamento / missão | Deslocaram-se na VTR {VTR} para o Município de {município} {militares} para missão de {Defesa Civil/...} às {hh:mm}. Retornaram, chegando na Unidade às {hh:mm}. |
| Pernoite | Pernoitaram na UBM {militares/instituição}. |
| Avaria / manutenção | {Militar} informou que a VTR {VTR} está com {descrição}. |
| Recebimento de material | {descrição}, os quais foram colocados no {local}. |
| Relato de ocorrência relevante | texto livre (ex.: princípio de incêndio em poste, medidas adotadas). |
| Livre | texto livre. |

- Litros e valores com vírgula decimal (padrão brasileiro). Calcular e mostrar preço por litro como apoio.
- **Saldo** por VTR/cartão: sugerir saldo anterior − valor; usuário confirma (é o saldo do cartão, informado na nota).
- Avaria, VTR em oficina e equipamento com defeito geram **pendência** visível ao oficial.

**VIII – Juntada de Documentos** — lista `{quantidade com extenso} {documento}`. Padrão diário:
```
01 (um) Mapa de Comunicação e Ronda
01 (um) Controle de Saída e Entrada de Viaturas
01 (um) Controle de Entrada e Saída de Civis e Militares
```
Mais, conforme o dia: permutas, notas fiscais/comprovantes de abastecimento, fichas de APH, ofícios, outros.
- **Sugestão automática**: nº de permutas e de abastecimentos citados no VII; nº de ocorrências de APH no IX.
- Futuro (fase 3): anexar foto/PDF dos documentos.

**IX – Ocorrências** — três grupos fixos:
```
Incêndio:
Salvamento:
Prevenção, Auxílio e APH:
```
Cada registro: `{nº da ocorrência} – {natureza}`; vários números com a mesma natureza podem ir juntos
("2847, 2912 – Emergência clínica"). Grupo vazio → "Não houve."
- Numeração observada mudou de 4 dígitos (2677/2026, "B.O 1468") para 6 dígitos (861471): aceitar texto.
- Lista de naturezas sugeridas (editável): Fogo em vegetação, Incêndio em rede elétrica, Incêndio em
  edificação, Vazamento de GLP, Captura de animal, Captura de ofídio, Animal silvestre, Avaliação de
  árvore, Sinistro de trânsito, Emergência clínica, Emergência obstétrica, Paciente psiquiátrico,
  Agressão física, Ferimento por arma branca, Queda, Convulsão, PCR, Óbito, Apoio à PM, Apoio a militar,
  Prevenção, Instrução, Missão de Defesa Civil.

**X – Passagem do Serviço** (frase padrão, gerada):
> No horário previsto passei o serviço de Comandante do Socorro ao meu sucessor legal, o 2º SGT QBM {nome}, com todas as ordens em vigor.

Seguido de:
```
                         Altamira-PA, {dia seguinte por extenso}
                         {assinatura eletrônica}
                         {Nome completo} – {grad} {quadro}
                         Comandante do Socorro
```
- Cidade da configuração da unidade. Concordância de gênero do sucessor.

### 2.4 Números por extenso
Sempre "NN (extenso)" com **dois dígitos** e **gênero do substantivo**: "01 (um) rádio", "01 (uma)
permuta", "02 (dois) rádios", "02 (duas) notas", "04 (quatro) fichas". Cada tipo de documento/equipamento
no cadastro tem gênero (m/f). Testar de 1 a 99.

---

## 3. Fluxo e estados

```
RASCUNHO ──(autor encerra e assina)──> ENCERRADA ──(oficial dá visto)──> VISTADA
                                           │                               │
                                           └──── retificações (anexadas) ──┘
```
- **Rascunho**: só o autor edita. Salvamento automático. Pode ser preenchido ao longo das 24 h.
- **Encerrar/assinar**: autor confirma com a senha (ou PIN); o app grava data/hora do servidor,
  gera o texto final, calcula o **hash SHA-256** do conteúdo e congela a Parte. Aviso claro:
  "Após encerrar, a Parte não poderá ser alterada, apenas retificada."
- Bloquear encerramento com erros graves; avisos (Km, energia) exigem confirmação explícita.
- **Visto**: oficial marca "Visto" e pode, por alínea do item VII, registrar **ciente / providência**
  (equivalente às rubricas na margem). Pode registrar despacho geral.
- O oficial **não edita** o conteúdo. Pode **solicitar retificação** ao autor (com motivo).

### 3.1 Correções (substitui o "digo" do papel)
Durante o rascunho, corrige-se livremente (não há rasura). Após o encerramento:
- **Retificação** (padrão): "No item {X}, alínea {y}, onde se lê: '{trecho}', leia-se: '{novo}'."
- **Errata**: mesmo formato, para erro material de digitação.
- **Adendo**: informação complementar ("Acrescente-se ao item VII: ...").
- O termo **"digo"** continua aceito dentro do texto livre, por costume.
Cada retificação: autor, data/hora, motivo, hash próprio. Fica anexada ao final da Parte (tela e PDF),
o original permanece intacto. Retificação feita após o visto deve gerar novo aviso ao oficial.
**A CONFIRMAR** com o comando se só o autor pode retificar ou também o oficial/administrador.

---

## 4. Regras de validação

> **Atualização (decisão 0001, `docs/decisoes/`):** o autor tem liberdade total de redação no rascunho. As regras
> abaixo marcadas "Bloqueia" (exceto "Nº da Parte único") passam a **aviso forte com confirmação**.

| Regra | Tipo |
|---|---|
| Todos os campos obrigatórios dos itens I–X preenchidos | Bloqueia encerramento |
| Energia: Passei ≥ Recebi | Bloqueia |
| Energia: Recebi = Passei da Parte anterior | Aviso |
| Consumo de energia fora da faixa usual (configurável, ex.: 0–20 kWh) | Aviso |
| VTR: Km Passei ≥ Km Recebi | Aviso forte (exige confirmação). Caso real: AT-12 recebida 51781 e passada 51771 |
| VTR: Km/nível Recebi = Passei da Parte anterior | Aviso |
| VTR com Km rodado alto (configurável) sem deslocamento/ocorrência registrada | Aviso leve |
| Nº da Parte único na unidade/ano. Caso real: Parte "nº 168, 169" duplicada | Bloqueia duplicata |
| Nº da Parte = anterior + 1 | Aviso (sugerir automaticamente) |
| Data da passagem = data da Parte + 1 dia | Automático |
| Antecessor = autor da Parte anterior; sucessor = autor da próxima | Aviso |
| Juntada × participação: nº de permutas e notas de abastecimento coincidem | Aviso |
| Comandante do Socorro do item II = autor | Automático |

**Numeração da Parte**: nas fotos ela não acompanha o calendário e parece ter reiniciado em algum
momento (150 em 26/05, 161 em 10/06, 124 em 12/08). **A CONFIRMAR** a regra oficial (anual? por livro?
reinicia quando?). Implementar: sugere próximo número, permite ajuste com justificativa auditada.

---

## 5. Perfis e permissões

| Perfil | Pode |
|---|---|
| Comandante do Socorro (qualquer militar escalado) | Criar/editar o próprio rascunho, encerrar, retificar a própria Parte, ver Partes da unidade |
| Oficial (SubCmt, Cmt e outros autorizados) | Ver todas, dar visto, despachar, solicitar retificação, painel |
| Administrador da unidade | Cadastros (efetivo, frota, equipamentos, naturezas, destinatário, texto do cabeçalho), usuários e perfis |
| Auditor/consulta | Somente leitura (inclui trilha de auditoria) |

- Tudo isolado por **unidade** (`unidadeId`), pronto para várias unidades do estado.
- Regras do Firestore devem impor isso no servidor (não só na interface) e ter testes no emulador.

---

## 6. Modelo de dados (Firestore — orientativo)

```
unidades/{unidadeId}
  nome, cabecalho[3], cidade ("Altamira-PA"), destinatario{...}, unidadeEnergia, faixasAlerta
  militares/{id}   postoGrad, quadro, nomeGuerra, nomeCompleto, genero, matricula?(opcional), ativo
  viaturas/{id}    prefixo, tipo, combustivel, ordem, ativa
  equipamentos/{id} descricao, genero, quantidadePadrao
  naturezas/{id}   grupo (incendio|salvamento|aph), descricao
  usuarios/{uid}   militarId, perfis[]
  partes/{parteId}
    numero, ano, dataServico, dataPassagem, status, autorId, antecessorId, sucessorId
    itens{ I{...}, II{...}, ..., X{...} }        # dados estruturados
    textoFinal                                   # texto oficial gerado no encerramento
    hash, encerradaEm, encerradaPor
    visto{ oficialId, em, despacho, alineas{a:{ciente, providencia}} }
    retificacoes[]{ tipo, item, alinea, ondeSeLe, leiaSe, motivo, autorId, em, hash }
  auditoria/{id}   acao, parteId, usuarioId, em, detalhes
```
Não armazenar CPF. Matrícula opcional (**A CONFIRMAR**).

---

## 7. PDF da Parte (layout do livro)

- A4, fonte legível, margens de livro.
- Cabeçalho em quadro, com a área diagonal "Visto do SubCmt" à esquerda (mostrando "Visto em {data} –
  {oficial}" quando vistada).
- Corpo em duas colunas de margem: coluna estreita à esquerda com o número romano do item; coluna
  estreita à direita reservada ao visto/ciente do oficial por alínea.
- Tabela do item VI com bordas.
- Rodapé: "Documento gerado eletronicamente – Parte nº X/ano – hash {8 primeiros caracteres} – página N/M".
- Retificações em seção própria ao final.
- Exportar uma Parte ou um período (ex.: o mês) num único PDF, para arquivo.

---

## 8. Telas (mobile-first)

1. **Início**: "Parte de hoje" (criar/continuar), últimas Partes, pendências.
2. **Editor da Parte**: um passo por item (I a X) com barra de progresso; cada passo mostra o que veio
   pré-preenchido do dia anterior; botão "Ver texto oficial" a qualquer momento; avisos no próprio campo.
3. **Revisão e encerramento**: texto oficial completo + lista de avisos + assinar.
4. **Leitura da Parte** (oficial): texto oficial, destaques (avarias, VTR em oficina, divergências),
   visto por alínea, despacho.
5. **Retificar**: escolher item/alínea, "onde se lê / leia-se", motivo.
6. **Cadastros** (admin) e **Painel** (fase 3: viaturas fora de serviço, consumo de energia, abastecimentos
   e saldos, ocorrências por natureza, Partes pendentes de visto).

Acessibilidade: contraste alto, fonte ≥ 16 px, alvos de toque ≥ 44 px, funcionar com sol forte (tema claro padrão).

---

## 9. Fases e critérios de aceite

**Fase 1 – Protótipo local (demo para o comandante)**
- Cadastros com dados fictícios de exemplo (ver `EXEMPLO_PARTE.md`).
- Editor completo I–X, frases padrão, extenso, validações, continuidade com a Parte anterior.
- Encerramento local (hash), retificação local, PDF fiel ao layout.
- PWA instalável e offline. Publicado no Firebase Hosting para demonstração (sem dados reais).
- Aceite: o usuário reproduz uma Parte real (com nomes trocados) em menos de 10 minutos no celular e o
  PDF fica equivalente à página do livro.

**Fase 2 – Piloto com servidor**
- Firebase Auth + Firestore + regras por perfil + testes no emulador.
- Fluxo rascunho → encerrada → vistada; solicitação de retificação; trilha de auditoria.
- Funciona offline e sincroniza ao voltar a internet.
- Aceite: dois aparelhos (comandante e oficial) completam o ciclo; um usuário sem perfil não acessa nada;
  Parte encerrada não pode ser alterada nem por chamada direta à API.

**Fase 3 – Gestão e entrega ao CBMPA**
- Painel, relatórios, exportação em lote (PDF e CSV/JSON), anexos de documentos (opcional).
- Documentação: `README.md`, `docs/MANUAL_USUARIO.md` (linguagem simples, com prints),
  `docs/IMPLANTACAO.md` (como outra equipe sobe o sistema em outra infraestrutura),
  `docs/SEGURANCA_LGPD.md`, decisões em `docs/decisoes/`.

---

## 10. Itens A CONFIRMAR com o comando
1. Grafia da unidade de energia ("kWh" correto × "kW/h" usado no livro).
2. Regra de numeração das Partes (anual? por livro? quando reinicia?).
3. Significado oficial das siglas das VTR e combustível de cada uma.
4. Frase para participação sem registros.
5. Quem pode retificar (só o autor? oficial? administrador?) e se há prazo.
6. Validade jurídica da assinatura: login + senha basta, ou exigir assinatura gov.br/ICP-Brasil no PDF?
7. Se a matrícula/MF deve aparecer no documento.
8. Tempo de guarda dos registros e quem acessa o histórico.
9. Infraestrutura oficial futura (PRODEPA / servidores do CBMPA) para a fase de adoção estadual.
