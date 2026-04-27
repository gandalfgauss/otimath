# PRÓXIMA SESSÃO — 2026-04-28 — Continuar revisão do capítulo "Fundamentação Teórica — Sequências Didáticas"

**Comece por aqui ao retomar o trabalho amanhã.**

---

## Contexto da sessão de 2026-04-27

A sessão de hoje fez **inspeção experiencial integral dos dois OVAs** (Disco Probabilístico e Probabilidade Dois Dados — 46.962 linhas auditadas em 12 etapas) e usou o resultado como base para uma **revisão cirúrgica do capítulo de Fundamentação Teórica**, autor por autor, removendo/reduzindo o que não tinha correspondência no produto e propondo acréscimos sutis para o que o produto materializa mas o texto não citava.

Documentos commitados nesta sessão:
- [`docs/ovas/Verificacao dos OVAs.md`](Verificacao%20dos%20OVAs.md) — inspeção integral 12 etapas × 2 OVAs com 17 seções de relatório final (commits `2109836`, `226c84c`).

---

## Princípio orientador da revisão (não esquecer)

> **"O referencial teórico de uma pesquisa em Educação Matemática deve estar em correspondência observável com as decisões de design do artefato. Citações que não orientam decisões observáveis são dispensáveis; decisões observáveis sem citação que as fundamente são lacunas a preencher."** (ARTIGUE, 2014, p. 159–160; ALMOULOUD; SILVA, 2012, p. 22, 26)

Cada operação de remoção, redução ou acréscimo abaixo é defensável por três argumentos:
1. **Princípio epistemológico** da Educação Matemática.
2. **Evidência empírica** nos OVAs (ou ausência dela).
3. **Risco específico de banca PROFMAT** que a operação enfrenta ou evita.

---

## STATUS DAS OPERAÇÕES

### Concluídas

| # | Operação | Status |
|---|---|---|
| **R1** | Subseção ABP (`\subsection{Aprendizagem baseada em problemas}`) — tachada com `\sout` | ✅ Tachada (falta apagar definitivamente) |
| **R1.a** | Frase de Brousseau p. 58 ("totalmente incapaz de provocar qualquer aprendizagem") realocada para subseção TSD como novo parágrafo `LIMITE EPISTEMOLÓGICO DA SITUAÇÃO ADIDÁTICA` | ✅ Feito |
| **R2** | Tipologia tripartite de Zabala (conceitual/procedimental/atitudinal) | ⏭️ Não estava no .tex atual — pulada |
| **R3** | Subseção `\subsection{Estrutura padrão}` com cinco momentos Delizoicov / Lopes et al. 2020 — tachada | ✅ Tachada (justificativa entregue: incompatibilidade ontológica Delizoicov × Brousseau; OVAs não operacionalizam os cinco momentos; citação *apud* tripla descritiva) |
| **R4** | Citação Freudenthal (frase final do parágrafo `NECESSIDADE LEGÍTIMA` na subseção `Problematização`) | ✅ Tachada (justificativa: OVAs não partem de contexto realístico — abordagem brousseauniana, não freudenthaliana) |

### Pendências da R1 (ABP) que ainda precisam ser fechadas

- ⏳ **Apagar definitivamente** o bloco tachado da subseção ABP.
- ⏳ **Acrescentar frase de descarte** ao final do parágrafo `SEQUÊNCIA DIDÁTICA: DIFERENTES ABORDAGENS`:
  ```latex
  A Aprendizagem Baseada em Problemas, embora reconhecida como abordagem ativa relevante \cite{viana2020abp}, foi descartada como referência central por exigir adaptações cuidadosas à Educação Básica \cite{borochovicius2021abp,souza2015abp} e por não dialogar com a estrutura de situação adidática individual mediada por Objeto Virtual de Aprendizagem que orienta esta pesquisa.
  ```

### Próximas remoções na fila (ordem de execução)

| # | Operação | Localização | Justificativa breve |
|---|---|---|---|
| **R5** | Parágrafo Lopes 2008 sobre pensamento crítico | Subseção `Problematização`, parágrafo `ENSINO DE PROBABILIDADE DEVE FAVORECER PENSAMENTO CRÍTICO SEGUNDO LOPES` | Pensamento crítico em Lopes (2008) refere-se a leitura crítica de mídia (T13 — Letramento Probabilístico, ENGEL 2017). Os OVAs não trabalham T13. Foco é T1–T8 (cálculo). |
| **R6** | Citação Clark-Wilson (2020) | Subseção `Progressão conceitual`, parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` | **Substituir por TROUCHE (2004) — gênese instrumental** (instrumentação + instrumentalização). Conceito que o produto realmente materializa. |
| **R7** | Citação Diaz (2009) | Mesmo parágrafo de R6 | Substituir por BATANERO; DIAZ (2007) — já citado no capítulo, mais robusto. |

### Reduções (manter, mas em escala compatível com uso real)

| # | Operação | Localização | Justificativa |
|---|---|---|---|
| **D1** | Reduzir Ausubel (de 2 parágrafos a 1 frase ancorada em evidência) | Subseção `Problematização`, parágrafo `A BAGAGEM DO ALUNO` | Manter apenas a citação âncora (AUSUBEL, 2000, p. ix) conectada à decisão de design observável: banner de retomada do Disco no Dois Dados. |
| **D2** | Reduzir Bortoletto e Melo (2022) | Subseção `Abordagens Metodológicas`, parágrafo `DIFERENTES ABORDAGENS` | De 4 linhas para 1 frase reconhecendo polissemia. |
| **D3** | Cazorla, Kataoka e Silva (3 ocorrências → 1) | Dispersas no capítulo | Manter apenas a ocorrência da subseção `Progressão conceitual` (única ancorada em evidência: Cenas 1-4 do Dois Dados, Stage 1 subSteps 0-5 do Disco). Remover as outras 2. |
| **D4** | Vygotsky com âncora empírica | Subseção `Progressão conceitual`, parágrafo `PARTICULARIDADES ORGANIZAÇÃO` | Manter, ancorando em evidência: hint progressivo após 2 erros (Disco Stage 2 subStep 3) + caixa "Lembre-se" (Dois Dados Cena 7 subStep 6.56). |

### Acréscimos sutis (ainda a fazer — todos integrados a parágrafos já existentes, sem novas subseções)

| # | Acréscimo | Onde inserir | Por que (evidência) |
|---|---|---|---|
| **A1** | **MAYER (2014) — TCAM** (1 frase) | No parágrafo `OVAs E SIMULAÇÕES A SERVIÇO DA APRENDIZAGEM` (subseção `Particularidades das abordagens com OVAS`) | Fundamenta engenharia visual: duplo canal (verbal+visual), segmentação progressiva, capacidade limitada da memória de trabalho. **Decisões de design** dos OVAs (animação 50→500 giros, leitura progressiva 5 trechos, skeleton shimmer) ficam sem fundamento sem Mayer. |
| **A2** | **PAPERT (1994) — Construcionismo** (1 frase) | Parágrafo `MEDIAÇÃO DOCENTE: CONSTRUÇÃO, FORMALIZAÇÃO E CURRÍCULO` | **Laboratório de Venn em 15 sub-etapas** (Cena 7 do Dois Dados) é construcionismo puro — aluno preenche cardinalidades, marca regiões, vê emergir a topologia da fórmula da união. Sem Papert, contribuição mais original do produto fica sem fundamento. |
| **A3** | **TROUCHE (2004) — Gênese Instrumental** (substitui Clark-Wilson em R6) | Parágrafo `PARTICULARIDADES ORGANIZAÇÃO PROGRESSIVA` | Disco e tabela 6×6 são instrumentos: instrumentação (ferramenta molda pensamento) e instrumentalização (aluno configura ferramenta). Trouche é o conceito que o produto materializa. |
| **A4** | **GARFIELD; BEN-ZVI (2014, p. 142) — Metacognição informada** (1 frase) | Parágrafo `AVALIAÇÃO COMO PROCESSO INTERNO` (subseção `Coerência`) | Tela de Fechamento Reflexiva do Dois Dados cita literalmente o conceito ("espelho do seu percurso — não é avaliação"). Sem Garfield & Ben-Zvi, essa tela fica sem fundamento. |
| **A5** | **LECOUTRE (1992) — Viés de equiprobabilidade** (1 frase) | Parágrafo de concepções intuitivas (após R7) | Disco Stage 2 subStep 0.191 cita literalmente "Viés de Equiprobabilidade (Lecoutre, 1992)" no balão pedagógico. Capítulo precisa fundamentar o autor que aparece no produto. |
| **A6** | **KAHNEMAN; TVERSKY (1972) — Falácia do jogador, lei dos pequenos números** (1 frase) | Parágrafo de concepções prévias na subseção `Problematização` | Disco Stage 3 subStep 5 NOMEIA explicitamente "falácia do jogador" no feedback. Capítulo precisa do suporte teórico. |

---

## Saldo previsto da revisão completa

- Remoções: **−855 palavras**
- Reduções (Ausubel/Bortoletto/Cazorla): **−210 palavras**
- Acréscimos sutis (6 frases): **+195 palavras**
- **Saldo líquido: −870 palavras**, capítulo mais coerente, com correspondência um-a-um entre autor citado e decisão de design observável nos OVAs.

---

## O que NÃO entra no escopo desta sessão

- Reescrita estrutural de subseções (apenas remoções/reduções/acréscimos pontuais).
- Mudança no Miro (a fazer depois da estabilização do .tex).
- Capítulo de Probabilidade (T1–T14 do mapa Dr. OtiMath) — outra fase.
- Capítulo de OVAs — outra fase.
- Implementação dos bugs críticos detectados na inspeção (parseInt vírgula, persistência IndexedDB, bolinhas dev em produção) — fase técnica.

---

## Estado do repositório no início da próxima sessão

- Branch: `mod-rangel`
- Último commit relevante: `2109836` (Verificacao dos OVAs salvo)
- Capítulo de Fundamentação Teórica em revisão (R1, R3, R4 tachadas; R1 ainda com 2 pendências; R5–R7 e D1–D4, A1–A6 a fazer).

---

## Estimativa de esforço para fechar a revisão

- Pendências da R1 (apagar bloco tachado + acrescentar frase de descarte): 15 min
- R5 (Lopes 2008): 10 min
- R6 (Clark-Wilson → Trouche): 15 min
- R7 (Diaz 2009): 5 min
- D1–D4 (reduções): 30 min
- A1–A6 (acréscimos sutis): 45 min
- Verificações no .bib (entradas órfãs): 15 min
- **Total: ~2h15 de trabalho focado**

---

*Estado salvo em 2026-04-27 ao final da sessão de inspeção integral dos OVAs e início da revisão cirúrgica do capítulo.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
