# Decisão 0001 — Liberdade total de redação antes de encerrar

**Data:** 16/10/2026 · **Pedido de:** usuário (militar do 9º GBM)

## Decisão
Enquanto a Parte está em **rascunho**, o Comandante do Socorro pode **reescrever à mão qualquer trecho**:
cabeçalho, cada item (I a X, inclusive a tabela de combustível) e o bloco de assinatura/data. É o
equivalente a escrever a Parte à mão no livro físico. Os campos preenchidos e as frases automáticas
existem para **ajudar**, não para limitar.

## Como funciona
- Cada item tem o botão "Escrever o item à mão". O texto automático é copiado para uma caixa de texto e,
  a partir daí, o que o autor escrever vale exatamente como está (`Parte.ajustes`, em `src/domain/tipos.ts`).
- "Voltar ao texto automático" descarta o texto escrito à mão (com confirmação).
- Item escrito à mão **não gera avisos** de validação (os dados estruturados dele deixam de valer).
- Falta de dado (antecessor, leituras de energia, Km etc.) é **aviso forte com confirmação**, nunca bloqueio.
  O **único bloqueio** que restou é o número de Parte **duplicado** na unidade/ano.

## O que não muda
- Depois de **encerrada**, a Parte é imutável; só entram Retificação/Errata/Adendo (regra inviolável 2).
- O texto final, o hash SHA-256 e a trilha de auditoria registram exatamente o que o autor escreveu.
- Validações continuam **avisando** e nunca corrigindo sozinhas (regra 7).

## Efeito na especificação
Substitui, na seção 4 de `ESPECIFICACAO.md`, as regras marcadas "Bloqueia" (campos obrigatórios e
"Passei ≥ Recebi"): passam a "Aviso forte". Só "Nº da Parte único" continua bloqueando.
