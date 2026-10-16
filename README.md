# Livro de Partes Digital — CBMPA / 9º GBM

Protótipo para **substituir o Livro de Partes físico** do serviço de 24 h do 9º Grupamento Bombeiro Militar
(Altamira-PA). O Comandante do Socorro redige a Parte pelo celular, encerra com assinatura eletrônica e o
SubComandante lê, dá o visto e acompanha tudo por um painel. Objetivo: **economicidade**, **rastreabilidade** e
**fidelidade ao modelo oficial**.

> **Versão de demonstração.** Todos os nomes, números e valores são **fictícios**. Os dados ficam só no aparelho
> de quem usa (nada é enviado a servidor). Não use dados reais.

## Como testar (sem instalar nada)
Abra o endereço da demonstração (GitHub Pages) no celular ou no computador:
**https://matheuss193.github.io/Livro-de-Partes/**
No celular, o navegador oferece **"Instalar"/"Adicionar à tela inicial"** e depois funciona **offline**.

Roteiro de 8 minutos: [docs/ROTEIRO_DEMONSTRACAO.md](docs/ROTEIRO_DEMONSTRACAO.md) ·
Apresentação resumida: [docs/APRESENTACAO_COMANDANTE.pdf](docs/APRESENTACAO_COMANDANTE.pdf)

Compatibilidade (iPhone, Android, Samsung, computador): [docs/COMPATIBILIDADE.md](docs/COMPATIBILIDADE.md). No primeiro acesso o app abre um
guia de instalação e de escolha do local dos arquivos.

## O que já faz
- **Editor dos itens I a X** do modelo oficial, com frases padrão e pré-preenchimento pela Parte anterior
  (antecessor, energia, Km, equipamentos, documentos).
- **Liberdade total de redação**: um lápis (✎) em cada texto permite escrever à mão do jeito que quiser;
  campos em branco não impedem encerrar.
- **Apoio inteligente** (só avisa, nunca corrige sozinho): escala de serviço que já preenche guarnição, antecessor e
  sucessor; aviso de **revisão da viatura pelo Km acumulado**; alerta de **consumo de combustível (L/100 Km)** fora do padrão;
  **sugestões de participação** aprendidas das Partes anteriores; **busca** por palavra em todo o histórico.
- **Ditado por voz** e **anexos** (PDF/foto) na Juntada de Documentos.
- **Encerramento imutável** com hash SHA-256; correções só por **Retificação / Errata / Adendo** anexadas.
- **Visto eletrônico do SubComandante**, ciente por alínea, despacho e pedido de retificação.
- **PDF no layout do livro**, com brasões, assinaturas eletrônicas dos dois e QR Code de verificação;
  PDF completo com os anexos.
- **Painel do comando**: energia, abastecimentos, ocorrências por natureza, pendências.
- **PWA**: instalável e offline. Interface em português, pensada para celular.

## O que ainda não existe (fase 2 e 3)
Login real, servidor/banco compartilhado entre aparelhos, assinatura gov.br/ICP-Brasil, cadastro de efetivo e frota
(hoje são dados fixos fictícios), relatórios em lote. Veja [docs/ESPECIFICACAO.md](docs/ESPECIFICACAO.md).

## Para quem vai continuar o desenvolvimento
Requisitos: **Node 22 ou superior**.

```bash
npm install     # instala as dependências
npm run dev     # abre em http://localhost:5173
npm test        # testes automáticos (regras, textos, repositório, PDF, painel)
npm run lint    # análise do código
npm run build   # gera a pasta dist/
```

Organização (`src/`):

| Pasta | O que tem |
|---|---|
| `domain/` | Tipos da Parte, textos oficiais, números por extenso, validações, painel (sem dependência de tela) |
| `data/` | Interface do repositório + `LocalRepo` (IndexedDB). A fase 2 troca por Firebase sem mexer nas telas |
| `features/` | Telas: início, editor, leitura/visto, painel |
| `pdf/` | PDF no layout do livro e junção de anexos |
| `ui/` | Componentes compartilhados (campos, lápis, voz, estilos) |

Decisões de projeto em [docs/decisoes/](docs/decisoes/). Regras do projeto em [CLAUDE.md](CLAUDE.md).

## Publicação (GitHub Pages)
A demonstração fica na branch `gh-pages`. Para atualizar o site depois de alterar o código:

```bash
npm run publicar
```

O script testa, gera o site e envia para a branch `gh-pages` (Settings > Pages > Deploy from a branch > `gh-pages`).
Se preferir publicação automática a cada envio, há um modelo em
[docs/modelo-github-actions-pages.yml](docs/modelo-github-actions-pages.yml): copie para `.github/workflows/pages.yml`
(o envio desse arquivo exige a permissão `workflow` do GitHub CLI: `gh auth refresh -s workflow`).

## Aviso
Projeto em avaliação pelo comando; não é sistema oficial do CBMPA. Direitos de uso dos brasões pertencem às
respectivas instituições. Nenhuma licença de código aberto foi definida: **todos os direitos reservados** até decisão do comando.
