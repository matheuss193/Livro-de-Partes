# Livro de Partes Digital — CBMPA / 9º GBM

## O que é este projeto
Aplicativo para substituir o **Livro de Partes físico** do serviço de 24 h do 9º Grupamento Bombeiro
Militar (Altamira-PA), do Corpo de Bombeiros Militar do Pará (CBMPA). Todo dia o **Comandante do
Socorro** (normalmente um sargento) redige uma "Parte" com 10 itens fixos e a entrega ao
**SubComandante** (oficial), que lê, dá o **visto** e toma providências.

A Parte é **documento oficial**: pode servir de prova e abrir procedimentos administrativos.
O app será entregue ao comando do 9º GBM e depois avaliado pelos comandos superiores para possível
adoção em todo o estado. Portanto: **seriedade, rastreabilidade, fidelidade ao modelo e código
limpo e documentado para outra equipe continuar.**

Objetivo declarado pelo comando: **economicidade** (abandonar o livro físico).

## Leia antes de trabalhar
- `docs/ESPECIFICACAO.md` — especificação completa (modelo, dados, regras, fluxo, perfis, PDF, fases).
- `docs/EXEMPLO_PARTE.md` — uma Parte completa de exemplo, com nomes fictícios, no texto exato do modelo.
Quando algo aqui e na especificação parecer conflitar, **pergunte ao usuário** antes de decidir.

## Sobre o usuário
- É militar do 9º GBM, **não é programador profissional**. Explique em português simples, passo a
  passo, e diga exatamente o que ele deve clicar/digitar. Ambiente: **Windows**.
- Pasta do projeto: `C:\Progamas Desenvolvimento\Livro-de-Partes` (o nome "Progamas" é assim mesmo).
- Ao final de cada etapa, diga **como testar** (no PC e no celular) e o que mostrar ao comandante.

## Regras invioláveis
1. **Fidelidade ao modelo oficial.** Cabeçalho, ordem dos itens I a X, títulos e frases padrão são
   exatamente os da especificação. As expressões de tratamento ("Participo a V. Sª que:",
   "antecessor legal", "sucessor legal", "com todas as ordens em vigor") são fixas no modelo.
2. **Parte encerrada é imutável.** Depois que o autor encerra/assina, o conteúdo original nunca é
   alterado nem apagado. Correções só por **Retificação / Errata / Adendo** anexados (ver especificação).
3. **Tudo é auditado**: quem criou, editou, encerrou, vistou, retificou — com data/hora do servidor.
4. **Nenhum dado real em código, testes, seeds ou exemplos.** Use nomes fictícios. Nunca copie nomes,
   matrículas, CPF ou assinaturas das fotos do livro físico. Não armazenar CPF no app.
5. **Segredos fora do Git**: chaves e configs sensíveis em `.env.local` (no `.gitignore`).
   Repositório GitHub **privado**.
6. **Dados pessoais (LGPD)**: coletar o mínimo; regras de acesso por perfil; nada público.
7. **Validações avisam, não inventam.** O app aponta inconsistências (Km, energia, numeração), mas
   nunca corrige sozinho um dado oficial sem o usuário confirmar.
8. **Português do Brasil** em toda a interface, mensagens e documentação.

## Tecnologia (decidida — mude só com aprovação do usuário)
- **Vite + React + TypeScript** (strict), PWA instalável com `vite-plugin-pwa`, funciona offline.
- Camada de dados atrás de uma **interface de repositório** (`src/data/`), com duas implementações:
  `LocalRepo` (IndexedDB via Dexie — fase 1/demo) e `FirebaseRepo` (Auth + Firestore — fase 2).
  Isso permite migrar depois para a infraestrutura oficial do Estado sem reescrever o app.
- **Firebase**: Authentication (e-mail/senha), Firestore (região `southamerica-east1`, São Paulo),
  Hosting, regras de segurança testadas no **Firebase Emulator**. Firestore com persistência offline.
- **PDF**: `pdfmake`, reproduzindo o layout do livro (ver especificação).
- **Testes**: Vitest (regras de negócio, geração de texto, números por extenso), Playwright (fluxos
  principais em viewport de celular), testes das regras do Firestore no emulador.
- Validação de formulários com `zod`. Datas com fuso `America/Belem`.

## Estrutura sugerida
```
src/
  domain/      tipos da Parte, regras de validação, geração do texto oficial, extenso
  data/        interface do repositório + LocalRepo + FirebaseRepo
  features/    parte (editor por item), visto, retificacao, cadastros, painel
  pdf/         geração do PDF no layout do livro
  ui/          componentes compartilhados (mobile-first)
docs/          especificação, exemplo, manual do usuário, guia de implantação, decisões (ADR)
firestore.rules, firestore.indexes.json, firebase.json
```

## Fases (faça uma de cada vez e pare para o usuário testar)
1. **Protótipo local**: editor completo dos itens I–X, frases padrão, validações, PDF, numeração,
   continuidade com a Parte anterior, cadastros (efetivo fictício, frota, equipamentos), PWA,
   dados só no aparelho (`LocalRepo`). Publicável no Firebase Hosting para demonstração.
2. **Piloto com servidor**: login, perfis, Firestore com regras, fluxo encerrar → vistar,
   retificações, trilha de auditoria, uso em mais de um aparelho, offline.
3. **Gestão e entrega**: painel do oficial, relatórios, exportações, documentação de implantação
   para o CBMPA, revisão de segurança e LGPD.

## Jeito de trabalhar
- Antes de cada fase, apresente um plano curto e espere o "ok" do usuário.
- Commits pequenos, mensagens em português. Rode `npm run lint`, `npm test` antes de dizer "pronto".
- Teste sempre em largura de celular (360–412 px): o comandante vai preencher no celular.
- Botões grandes, poucos toques, campos pré-preenchidos com o dia anterior, salvamento automático
  do rascunho (o serviço é de 24 h e a internet do quartel pode cair).
- Registre decisões importantes em `docs/decisoes/` (um arquivo curto por decisão).
- Itens marcados **"A CONFIRMAR"** na especificação dependem do comando: mantenha configuráveis e
  liste-os para o usuário perguntar.
