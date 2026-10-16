# Pontos de definição (sugestões para o futuro)

Pontos que o protótipo deixa em aberto e a **proposta** inicial para cada um. Não fazem parte da apresentação em PDF.
Quem decide, em cada caso:

- **Comando do 9º GBM:** regras que valem só para a unidade (rotina do serviço, texto de frases padrão, quem dá o visto).
- **Comando-Geral do CBMPA:** regras que valem para toda a corporação (modelo oficial da Parte, numeração, tempo de guarda, assinatura exigida).
- **Governo do Estado (PRODEPA/SEPLAD):** hospedagem, domínio oficial, PAE e assinatura do Estado.
- **Setor jurídico do CBMPA:** validade da assinatura, retificação e proteção de dados (LGPD).

| # | Ponto | Proposta do protótipo | Quem decide |
|---|---|---|---|
| 1 | Assinatura | Login individual + PIN/senha, oficializado por ordem; gov.br ou ICP-Brasil se exigido (veja [ASSINATURA_E_INTEGRACOES.md](ASSINATURA_E_INTEGRACOES.md)) | Comando-Geral do CBMPA, com o jurídico |
| 2 | Numeração das Partes | Sequencial por unidade e por ano, reiniciando em 1º de janeiro; o app bloqueia número repetido e avisa quebra de sequência; ajuste só com justificativa registrada | Comando-Geral do CBMPA |
| 3 | Retificação de Parte encerrada | O autor retifica; o oficial pode pedir a correção; retificação depois do visto gera novo aviso ao oficial; prazo a definir | Comando-Geral do CBMPA, com o jurídico |
| 4 | Energia, siglas e frase padrão | "kWh" (grafia correta); siglas das viaturas como no livro, com significado e combustível informados pela unidade; frase "nada houve digno de registro" (configurável) | Comando do 9º GBM |
| 5 | Guarda e acesso aos registros | Seguir a tabela de temporalidade do CBMPA/Estado; acesso por perfil (autor, oficial, administrador, auditoria); sem CPF no sistema (LGPD) | Comando-Geral do CBMPA, com o jurídico |
| 6 | Hospedagem | Piloto em nuvem no Brasil com dados mínimos; adoção estadual na infraestrutura do Estado/PRODEPA (veja a tabela em ASSINATURA_E_INTEGRACOES.md) | Comando-Geral do CBMPA, com a PRODEPA/SEPLAD |
| 7 | Outras unidades | Mesmo sistema, cada unidade com seu cabeçalho, efetivo, frota e escala | Comando-Geral do CBMPA |

Veja também os itens "A CONFIRMAR" em [ESPECIFICACAO.md](ESPECIFICACAO.md), seção 10.
