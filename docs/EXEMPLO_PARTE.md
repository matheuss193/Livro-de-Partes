# Exemplo de Parte (dados fictícios)

Texto exatamente como o app deve gerar. **Todos os nomes, números e valores são inventados.**
Use estes dados como seed de demonstração e como referência nos testes de geração de texto.

---

```
┌──────────────┬──────────────────────────────────────────────────────────────┐
│   (Visto do  │ Corpo de Bombeiros Militar do Pará                           │
│    SubCmt)   │ Coordenadoria Estadual de Defesa Civil                       │
│              │ 9º Grupamento Bombeiro Militar                               │
│              │ Parte nº 201 de 14 de outubro de 2026                        │
│              │ Do: 2º SGT QBM Albuquerque – Comandante do Socorro           │
│              │ Ao: Sr. 1º TEN QOBM Andrade – SubCmt do 9º GBM               │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

**I – Recebimento do Serviço:**
No horário previsto assumi o serviço de Comandante do Socorro, do meu antecessor legal, o 2º SGT QBM Teixeira, com todas as ordens em vigor.

**II – Guarnição de Serviço:**
Comandante do Socorro: 2º SGT QBM Albuquerque
Adjunto ao CMT do SOS: 3º SGT QBM Pacheco
Condutor e Operador de VTR Inc/Salv: 3º SGT QBM Moura
Condutor da VTR UR-119: CB BM Brandão
Socorristas: SD BM Lima e SD BM Prado
Guarnição de Incêndio: SD BM Nogueira e SD BM Castro
Guarnição de Salvamento: SD BM Farias

**III – Consumo de Energia:**
Recebi: 5120 kWh
Passei: 5127 kWh
Consumo total: 07 kWh

**IV – Armamento e Munição:** Não houve.

**V – Equipamentos de Comunicação:**
01 (um) Rádio base fixa digital
02 (dois) Rádios HT portáteis digitais
01 (um) Rádio ponto a ponto com carregador
01 (um) Smartphone Samsung com carregador

**VI – Consumo de Combustível:**

| VTR | Recebi | Km | Passei | Km | Situação |
|---|---|---|---|---|---|
| ABT-42 | 3/4 | 12500 | 3/4 | 12512 | Operante |
| ABTF-14 | 4/4 | 2200 | 4/4 | 2200 | Operante |
| AT-12 | 4/4 | 51800 | 4/4 | 51800 | Operante |
| ATT-02 | 1/2 | 68000 | 1/2 | 68000 | Operante |
| UR-119 | 1/2 | 13000 | 4/4 | 13064 | Operante |
| AR-129 | 3/4 | 48700 | 3/4 | 48731 | Operante |
| AR-145 | 3/4 | 21200 | — | — | Em missão (Anapu) |
| AR-146 | 1/2 | 8750 | 1/2 | 8750 | Oficina |
| ARL-51 | 3/4 | 64200 | 3/4 | 64215 | Operante |
| AFR-19 | 3/4 | 23600 | 3/4 | 23600 | Operante |
| APS-96 | 1/2 | 80300 | 1/2 | 80304 | Operante |
| APSL-17 | 3/4 | 15200 | 3/4 | 15200 | Operante |

**VII – Participação:**
Participo a V. Sª que:
a) O SD BM Farias montou serviço em substituição ao SD BM Rezende, conforme permuta em anexo.
b) A VTR UR-119 foi abastecida com 45,50 litros de diesel S10 no valor de R$ 362,18, Km 13020, ficando um saldo disponível de R$ 437,82.
c) Deslocaram-se na VTR AR-145 para o Município de Anapu o 2º SGT QBM Vieira e o SD BM Cunha para missão de Defesa Civil às 07:40 h.
d) O 3º SGT QBM Moura informou que a VTR AR-146 está apresentando ruído nos freios dianteiros, tendo sido encaminhada à oficina.

**VIII – Juntada de Documentos:**
01 (um) Mapa de Comunicação e Ronda
01 (um) Controle de Saída e Entrada de Viaturas
01 (um) Controle de Entrada e Saída de Civis e Militares
01 (uma) Permuta
01 (uma) Nota fiscal de abastecimento
03 (três) Fichas de APH

**IX – Ocorrências:**
Incêndio:
900101 – Fogo em vegetação
Salvamento:
900105 – Captura de ofídio
Prevenção, Auxílio e APH:
900110, 900118 – Emergência clínica
900112 – Sinistro de trânsito

**X – Passagem do Serviço:**
No horário previsto passei o serviço de Comandante do Socorro à minha sucessora legal, a 2º SGT QBM Rangel, com todas as ordens em vigor.

```
                                        Altamira-PA, 15 de outubro de 2026

                                        [assinado eletronicamente em 15/10/2026 07:58]
                                        Ricardo Albuquerque Neves – 2º SGT QBM
                                        Comandante do Socorro
```

---

## Exemplo de retificação (após encerrada)

```
RETIFICAÇÃO nº 1 – em 15/10/2026 10:12 – 2º SGT QBM Albuquerque
No item VII, alínea b, onde se lê: "45,50 litros", leia-se: "45,05 litros".
Motivo: erro de digitação na quantidade, conforme nota fiscal anexa.
```

## Casos de teste derivados do livro real (anonimizados)
- Energia 4447 → 4454 = 07 kWh; 4599 → 4608 = 09 kWh (cálculo correto).
- Continuidade: Parte do dia D com Passei 4553 → Parte do dia D+1 deve sugerir Recebi 4553.
- VTR com Km Passei menor que Km Recebi (ex.: 51781 → 51771) deve gerar aviso forte.
- Duas Partes com o mesmo número na unidade devem ser bloqueadas.
- Gênero: "do meu antecessor legal, o 2º SGT" × "da minha antecessora legal, a 2º SGT".
- Extenso: 01 (um) rádio, 01 (uma) permuta, 02 (duas) notas, 05 (cinco) fichas.
