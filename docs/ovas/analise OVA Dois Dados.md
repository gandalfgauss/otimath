# ANÁLISE CIENTÍFICA — OVA DOIS DADOS
## Projeto OtiMath.com | Protocolo Dr. OtiMath v5.1
## Sessão iniciada: 2026-04-02
## Última fase concluída: Fase 7 (COMPLETA)
## Arquivo descritivo: docs/ovas/descri OVA Dois Dados.md
## Próxima ação: IMPLEMENTAÇÃO das adequações propostas

## ⚠️ DIRETRIZ FUNDAMENTAL: NADA EXISTENTE SERÁ REMOVIDO
## Todas as propostas são INSERÇÕES e ADEQUAÇÕES sobre o OVA funcional.
## A tabela 6×6, os 12 eventos, os 5 desafios, a lógica do hook — tudo permanece.

---

## FASE 0 — VARREDURA INICIAL

### 0.0 — Verificação Ética CEP/TCLE
Não mencionada aplicação com estudantes nesta sessão.

### 0.1 — Leitura Identificatória

**Tópicos identificados:**

| Prioridade | Tópico | Descritores no OVA |
|------------|--------|-------------------|
| Principal | **T2 — Espaço Amostral e Eventos** | Tabela 6×6 (produto cartesiano), eventos como subconjuntos de Ω, seleção de resultados, Ω = 36 |
| Principal | **T3 — Probabilidade Clássica** | P(A) = n(A)/n(Ω), numerador/denominador, espaço amostral equiprovável |
| Secundário | **T5 — Eventos Complementares** | P(Ā) = 1 − P(A), cálculo do complementar nos desafios 1–2 |
| Secundário | **T6 — União, Interseção e Diferença** | Operações ∩, ∪, − entre eventos A e B nos desafios 3–5 |
| Secundário | **T4 — Representação do Espaço Amostral** | Tabela de dupla entrada como representação |

**Posição na sequência:** 2º OVA (após Disco Probabilístico).
**Pré-requisitos:** Conceito de experimento aleatório (T1), noção intuitiva de frequência relativa (T8 do OVA anterior).
**Habilidades BNCC:** EM13MAT105, EM13MAT205, EM13MAT305

### 0.2 — Inventário Estrutural

**Conteúdo matemático:**
- Ω = {(i,j) : i,j ∈ {1,...,6}}, |Ω| = 36
- 12 eventos predefinidos (soma, produto, paridade, primalidade, min/max)
- P(A) = n(A)/36
- P(Ā) = 1 − P(A)
- Operações: A ∩ B, A ∪ B, A − B, B − A
- Equivalências aceitas: A ∩ B = A − B̄

**Componentes interativos:**
- Tabela 6×6 com checkboxes (36 células por evento)
- Quadro de Eventos (definição de A, B, D)
- Quadro de Cálculos (inputs numerador/denominador)
- SelectInputs para operações A ○ B
- 4 botões: Novo, Limpar, Conferir, Próximo Desafio
- Alerts + Modal integrados

**Classificação:** GUIADO — etapas sequenciadas com feedback estruturado.

**Feedbacks:**
- Imediato: acerto/erro com sons, não entrega resposta (✅ milieu TSD)
- Modal de confirmação em Limpar e Reiniciar

**Registros de Representação (Duval):**
- ✅ Verbal/linguístico
- ✅ Tabular (6×6)
- ✅ Algébrico/simbólico (P(A) = n/36, A ∩ B)
- ❌ Diagrama de árvore
- ❌ Diagrama de Venn
- ❌ Gráfico
- Conversões: verbal→tabular, tabular→algébrico

**Nível de interatividade:**
- Passivo: ~5%
- Exploratório: ~60% (checkboxes)
- Expressivo: ~35% (cálculos, seleção de operações)

**Estrutura dos 5 desafios (gerados aleatoriamente):**
- Desafios 1–2: 1 evento A → marcar → calcular P(A) e P(Ā)
- Desafios 3–5: 2 eventos A,B → marcar A,B → marcar D → expressar D como operação → calcular P(D)

**Arquivos do OVA:**
- `src/app/ensino/probabilidade/dois-dados/page.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesActivity.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesInstructionsSection.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesSection.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesGame.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesTable.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesEvents.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesCalculations.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesFormulation.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesCredits.tsx`
- `src/components/teaching/probability/two-dices/TwoDicesPresentation.tsx`
- `src/components/teaching/probability/two-dices/DiceScene.tsx`
- `src/hooks/teaching/probability/two-dices/useTwoDicesHooks.ts` (909 linhas)

### 0.3 — Situação Fundamental (TSD)

O espaço amostral e a probabilidade clássica tornam-se necessários quando o estudante precisa responder "quão provável é?" em situações com dois dados, e percebe que a contagem sistemática na tabela 6×6 é mais confiável que a intuição (BROUSSEAU, 1997, p. 22-23, 88).

**O OVA constrói essa necessidade?** 🔶 PARCIALMENTE — Exige contagem sistemática, mas não há conflito cognitivo inicial onde a intuição falha.

---

## FASE 1 — ANÁLISE COMPLETA

### 1.1 — Jornada do Estudante

**MOMENTO 0 — TwoDicesPresentation (Apresentação do Dado)**
- Vê: Dado 3D girando, texto explicativo, barras de probabilidade, comparação equilibrado × viciado (4 cenas)
- Faz: Observa (passivo)
- Teoria: Mayer (segmentação), Ausubel (ativação prévios)
- ⚠️ LACUNA: Atividade 100% passiva — viola R3

**MOMENTO 1 — HeroBanner + Instruções**
- Vê: Banner + descrição detalhada da atividade
- Faz: Lê (passivo)
- 🔷 LACUNA: Texto longo sem pergunta provocativa para ativar concepções prévias

**MOMENTO 2 — Desafios 1–2, Etapa 1: Marcar evento A na tabela**
- Faz: Clica checkboxes para marcar pares que satisfazem evento A (exploratório)
- Pensa: contagem sistemática na tabela
- Feedback: acerto/erro sem entregar resposta ✅
- Teoria: TSD (ação), Duval (verbal→tabular)
- Vieses confrontados: V2.1 (omissão), V2.4 (déficit combinatório)

**MOMENTO 3 — Desafios 1–2, Etapa 2: Calcular P(A) e P(Ā)**
- Faz: Digita numerador/denominador (expressivo)
- Teoria: T3 (clássica), T5 (complementar), Duval (tabular→algébrico)
- Viés confrontado: V3.4 (negligência do espaço amostral)

**MOMENTO 4 — Desafios 3–5, Etapa 1: Marcar eventos A e B**
- Faz: Marca checkboxes para dois eventos simultaneamente (exploratório)
- Teoria: T6 (operações)

**MOMENTO 5 — Desafios 3–5, Etapa 2: Marcar evento D (composto)**
- Faz: Marca na tabela o evento D descrito verbalmente (exploratório)
- Pensa: combina condições de A e B

**MOMENTO 6 — Desafios 3–5, Etapa 3: Expressar D como operação**
- Faz: Seleciona A, ∩/∪/−, B nos dropdowns (expressivo)
- Teoria: T6, Duval (tabular→algébrico/simbólico)
- Viés confrontado: V6.1 (confusão "e"/"ou")

**MOMENTO 7 — Desafios 3–5, Etapa 4: Calcular P(D)**
- Faz: Conta marcações e calcula P(D) (expressivo)
- Teoria: T3, T7 (implícita)

**MOMENTO 8 — Finalização**
- Vê: "Parabéns, você finalizou todos os desafios!"
- 🔶 LACUNA: Sem institucionalização nem reflexão sobre o aprendido

### 1.2 — Auditoria de Feedbacks

| # | Tipo | Gatilho | Milieu? | Entrega resposta? | Classificação |
|---|------|---------|---------|-------------------|---------------|
| 1 | Imediato | Checkbox correto | ✅ | ❌ | ADEQUADO |
| 2 | Imediato | Checkbox errado | ✅ | ❌ | 🔶 INSUFICIENTE — genérico |
| 3 | Imediato | Probabilidade correta | ✅ | ❌ | ADEQUADO |
| 4 | Imediato | Probabilidade errada | ✅ | ❌ | 🔶 INSUFICIENTE — genérico |
| 5 | Imediato | Select correto | ✅ | ❌ | ADEQUADO |
| 6 | Diferido | Desafio completo | ✅ | — | ADEQUADO |
| 7 | Diferido | Jogo finalizado | ✅ | — | ADEQUADO |

**Problema principal:** Feedbacks de erro são genéricos ("Ops! Tente novamente!"). Não indicam tipo de erro nem direcionam à reflexão (BROUSSEAU, 1997, p. 88).

### 1.3 — Diagnóstico de Vieses Cognitivos

| Viés | Status |
|------|--------|
| V2.1 Omissão de resultados | ✅ CONTEMPLADO — tabela exige completude |
| V2.2 Limitação combinatória | ✅ CONTEMPLADO — estrutura tabular organiza |
| V2.3 Evento = resultado | 🔶 PARCIAL — marca subconjuntos mas não distingue explicitamente |
| V2.4 Déficit combinatório | ✅ CONTEMPLADO — tabela impede duplicações |
| V3.1 Viés de equiprobabilidade | ⛔ AUSENTE — não questiona se resultados são equiprováveis |
| V3.2 Equiprobabilidade automática | ⛔ AUSENTE — usa P=n/36 sem verificar por quê |
| V3.3 Confusão probabilidade/frequência | ⛔ AUSENTE — sem simulação |
| V3.4 Negligência do espaço amostral | ✅ CONTEMPLADO — denominador explícito |
| V5.1 Preferência pelo direto | 🔶 PARCIAL — calcula P(Ā) mas não mostra eficiência |
| V6.1 Confusão "e"/"ou" | ✅ CONTEMPLADO — selects forçam distinção |
| V6.2 Ambiguidade semântica | 🔶 PARCIAL — não discute ambiguidade |

### 1.4 — Diagnóstico de Dificuldades de Aprendizagem

| Dificuldade | Referência | Status | Gravidade |
|-------------|-----------|--------|-----------|
| Construir espaço amostral completo | NAVARRO-PELAYO et al., 2016, p. 732 | ✅ | — |
| Distinguir evento de resultado elementar | BATANERO; DÍAZ, 2007, p. 122 | 🔶 PARCIAL | MÉDIA |
| Verificar condição de equiprobabilidade | LECOUTRE, 1992 | ⛔ AUSENTE | ALTA |
| Traduzir linguagem natural ↔ matemática | BATANERO; DÍAZ, 2007, p. 122-123 | ✅ | — |
| Converter entre representações | DUVAL, 1993, p. 52 | 🔶 PARCIAL — falta Venn | MÉDIA |

### 1.5 — Auditoria: 12 Checklists (A–L)

**CHECKLIST A — TSD (Brousseau, 1997)**
- ✅ Situação de AÇÃO: marcar checkboxes
- ✅ Situação de FORMULAÇÃO: expressar D como operação
- 🔶 Situação de VALIDAÇÃO: parcial — sistema valida, estudante não refuta
- ⛔ INSTITUCIONALIZAÇÃO: ausente
- ⛔ Apresenta P(face)=1/6 na apresentação ANTES da necessidade
- ✅ Milieu não entrega resposta
- 🔶 Ciclo investigativo parcial

**CHECKLIST B — Engenharia Didática**
- ⛔ Análise preliminar NÃO documentada
- ⛔ Análise a priori NÃO documentada
- 🔶 Variáveis didáticas identificáveis mas não justificadas
- ✅ Progressão conceitual: simples → complementar → composto → operação → probabilidade

**CHECKLIST C — Registros de Representação (Duval)**
- ✅ Verbal, Tabular, Algébrico/simbólico
- ❌ Diagrama de árvore, Venn, Gráfico ausentes
- 🔶 Conversões: verbal→tabular e tabular→algébrico presentes, falta Venn

**CHECKLIST D — Vieses Cognitivos**
- ✅ Vieses T2 parcialmente contemplados
- ⛔ Vieses T3 (equiprobabilidade) NÃO confrontados
- 🔶 Sem reflexão sobre por que intuição falha

**CHECKLIST E — Aprendizagem Significativa (Ausubel)**
- ⛔ NÃO ativa conhecimentos prévios
- ⛔ NÃO revela concepções intuitivas
- ✅ Progressão sem saltos

**CHECKLIST F — Socioconstrutivismo (Vygotsky)**
- ⛔ Nenhum momento de interação social
- ⛔ Professor sem papel mediador previsto

**CHECKLIST G — Letramento Probabilístico (Engel)**
- 🔶 Situação parcialmente contextualizada (dados, não cotidiana)
- ⛔ Sem interpretação em contexto real
- ⛔ Sem argumentação
- ⛔ Sem avaliação crítica

**CHECKLIST H — Tecnologias Digitais**
- ✅ Tecnologia integrada
- ✅ Manipulabilidade
- 🔶 Visibilidade estrutural parcial
- ⛔ Sem ciclos iterativos documentados

**CHECKLIST I — Zabala / Delizoicov**
- ✅ Conceitual e procedimental
- ⛔ Atitudinal ausente
- 🔶 Problematização parcial

**CHECKLIST J — TPACK**
- ✅ CK correto
- 🔶 PK sem ativação prévios nem institucionalização
- ✅ TK adequada
- 🔶 PCK não confronta vieses T3
- ✅ TCK tabela representa bem Ω
- ✅ TPK intencional
- 🔶 TPACK parcial

**CHECKLIST K — DSR**
- 🔶 Problema parcialmente definido
- ⛔ Requisitos NÃO derivados da literatura
- ✅ REQ-1 simulação interativa
- ⛔ REQ-3 sem avaliação a posteriori
- ⛔ REQ-4 sem sequência documentada

**CHECKLIST L — Papert, Trouche, Hoyles, Mayer**
- 🔶 Papert: marca e calcula, mas não constrói artefato com significado
- 🔶 Trouche: instrumentação parcial
- ✅ Hoyles: tecnologia torna Ω manipulável
- 🔶 Mayer: segmentação ✅, contiguidade ✅, excesso de texto nas instruções

---

## RESUMO DE PROBLEMAS IDENTIFICADOS (para Fase 2)

### Problemas ⛔ ELIMINATÓRIOS:
1. Apresentação (Momento 0) é 100% passiva — viola R3
2. Vieses T3 (equiprobabilidade) completamente ausentes
3. Sem institucionalização ao final
4. **SEM EXPLICAÇÃO DO CONTEÚDO ANTES DA ATIVIDADE** — o estudante não recebe nenhuma
   explicação sobre: o que é espaço amostral, o que é evento, por que a tabela tem 36 células,
   o que significa P(A), o que são ∩/∪/−. A seção de instruções explica apenas a mecânica
   da interface (botões, checkboxes), não o conteúdo matemático necessário.
   Falta: seção de contextualização do conteúdo entre a apresentação e os desafios.
   Ref: AUSUBEL (2000, p. ix) — ativação de prévios; BROUSSEAU (1997, p. 30) — construção
   de necessidade; ZABALA (1998, p. 38) — conteúdo conceitual antes do procedimental.

### Problemas ⚠️ GRAVES:
4. Sem ativação de conhecimentos prévios (Ausubel)
5. Feedbacks de erro genéricos — não direcionam reflexão
6. Sem Diagrama de Venn para operações entre eventos
7. Verificação de equiprobabilidade ausente (dificuldade ALTA)

### Problemas 🔶 MODERADOS:
8. Sem momento de reflexão/síntese ao final
9. Sem conteúdo atitudinal (argumentação, decisão sob incerteza)
10. Instrução inicial longa e passiva
11. Evento vs. resultado elementar não distinguido explicitamente

### Problemas 🔷 LEVES:
12. Texto das instruções poderia ser mais conciso
13. Ambiguidade semântica "e"/"ou" não discutida

---

## FASE 2 — PARECER CIENTÍFICO COMPLETO

### 2.1 — Pontos Fortes
1. ✅ Tabela 6×6 como milieu autônomo — retornos sem intervenção do professor (BROUSSEAU, 1997, p. 30)
2. ✅ Progressão conceitual coerente: simples→complementar→composto→operação→probabilidade (ARTIGUE, 2014, p. 160)
3. ✅ Conversão obrigatória verbal→tabular→algébrica — 3 registros Duval (DUVAL, 1993, p. 45)
4. ✅ Aceitação de equivalências (A∩B = A−B̄) — compreensão, não memorização
5. ✅ Geração aleatória de desafios — impede memorização
6. ✅ Arquitetura técnica sólida — padrão OtiMath, responsivo, acessível

### 2.2 — Problemas por Criticidade

**⛔ P1 ELIMINATÓRIO — Apresentação (Módulo 0) 100% passiva**
Viola R3. Solução: inserir interações (perguntas, manipulação, decisão) em cada cena.

**⛔ P2 ELIMINATÓRIO — Vieses T3 (equiprobabilidade) ausentes**
V3.1/V3.2 não confrontados. O estudante aplica P=n/36 mecanicamente.
Solução: etapa que questione por que cada célula tem mesma probabilidade.
Ref: LECOUTRE, 1992 apud BATANERO; DÍAZ, 2007, p. 124

**⛔ P3 ELIMINATÓRIO — Sem institucionalização**
Após 5 desafios, apenas "Parabéns!". Sem formalização do saber construído.
Solução: tela de síntese com Ω, evento, P(A), operações.
Ref: BROUSSEAU, 1997, p. 56

**⚠️ P4 GRAVE — Sem ativação de conhecimentos prévios**
Nenhuma pergunta reveladora de concepções intuitivas.
Solução: pergunta provocativa antes do 1º desafio.
Ref: AUSUBEL, 2000, p. ix

**⚠️ P5 GRAVE — Feedbacks de erro genéricos**
"Ops! Tente novamente!" não direciona reflexão.
Solução: feedbacks diferenciados por tipo de erro.
Ref: BROUSSEAU, 1997, p. 88

**⚠️ P6 GRAVE — Diagrama de Venn ausente**
Operações ∩/∪/− sem representação visual.
Solução: Venn dinâmico ao lado da tabela.
Ref: DUVAL, 1993, p. 45; BATANERO; DÍAZ, 2007, p. 123

**🔶 P7 MODERADO — Sem reflexão final**
Solução: 2-3 perguntas reflexivas ao final.

**🔶 P8 MODERADO — Sem conteúdo atitudinal**
Sem argumentação nem decisão sob incerteza.
Solução: campo de justificativa em pelo menos um desafio.

**🔷 P9 LEVE — Instruções longas e passivas**
~85 linhas de texto puro. Solução: instruções mínimas + tooltip contextual.

### 2.3 — Simulação da Banca PROFMAT

B1 TSD (adidática): PARCIAL → SATISFATÓRIA após milieu+institucionalização
B2 ED (análise a priori): INSATISFATÓRIA → SATISFATÓRIA após Fase 7
B3 Duval (≥3 registros): PARCIAL → SATISFATÓRIA com +Venn (4 registros)
B4 TPACK (tecnologia amplia): SATISFATÓRIA
B5 DSR (contribuição original): PARCIAL → SATISFATÓRIA com documentação
B6 Vieses (equiprobabilidade): INSATISFATÓRIA → SATISFATÓRIA com etapa de confronto
B9 Papert/Trouche: PARCIAL → SATISFATÓRIA com argumento+Venn
B10 Mayer (carga cognitiva): PARCIAL → SATISFATÓRIA com instruções reduzidas

---

## FASE 3 — PROPOSTAS INOVADORAS (INSERÇÕES — nada existente é removido)

### 3.1 — Diagnóstico do Paradigma Atual
OVAs tradicionais de dois dados: tabela→contagem→P. Exercício procedimental disfarçado de interatividade.
Falta confronto de vieses e construção de necessidade (GARFIELD; BEN-ZVI, 2014, p. 136).

### 3.2 — Inovações Propostas

**🚀 INOVAÇÃO 1: "Armadilha da Equiprobabilidade" (INSERÇÃO ANTES do Desafio 1)**
Pergunta: "Qual soma é mais provável: 7 ou 12?" → estudante responde → tabela revela distribuição.
Confronta V3.1, V3.2, V3.4. Ativa prévios (AUSUBEL, 2000, p. ix).
Componente novo: TwoDicesEquiprobabilityChallenge.tsx. Nenhum código existente alterado.

**🚀 INOVAÇÃO 2: "Venn Vivo" (INSERÇÃO AO LADO do Quadro de Eventos, desafios 3–5)**
Diagrama de Venn SVG dinâmico, atualiza em tempo real conforme checkboxes mudam.
Confronta V6.1. 4º registro Duval (DUVAL, 1993, p. 45). Lê eventsCheckboxes do hook existente.
Componente novo: TwoDicesVenn.tsx. Nenhum código existente alterado.

**🚀 INOVAÇÃO 3: "Institucionalização de Fechamento" (INSERÇÃO APÓS isGameOver)**
Tela de síntese: Ω, P(A), complementar, operações. Pergunta reflexiva. Link próximo OVA.
BROUSSEAU (1997, p. 56). ZABALA (1998, p. 63).
Componente novo: TwoDicesConclusion.tsx. Substitui apenas a string "Parabéns!" final.

### 3.3 — Roadmap

🔴 URGENTE: P1 (apresentação interativa, 3h) · P2 (armadilha equiprobabilidade, 2h) · P3 (institucionalização, 2h) · P4 (ativação prévios, 1h)
🟠 ALTA: P5 (feedbacks diferenciados, 3h) · P6 (Venn dinâmico, 5h)
🟡 MÉDIA: P7 (reflexão final, 1h) · P8 (justificativa, 2h) · P9 (instruções, 1h)

---

## FASE 4 — ESPECIFICAÇÕES TÉCNICAS

### Viabilidade Escolar (R13): ✅ Tudo viável em escola pública
- Navegador moderno: ✅ Next.js
- Hardware básico: ✅ Checkboxes + SVG leves
- Responsivo: ✅ Já implementado
- Three.js (apresentação): ⚠️ Precisa fallback CSS para WebGL

### Especificações
SPEC 1 — Armadilha: componente React novo, sem dependências. Pergunta→resposta→animação tabela.
SPEC 2 — Institucionalização: componentes globais (TextBlock, Grid, Button). Aparece quando isGameOver().
SPEC 3 — Venn: SVG inline + React state. Lê eventsCheckboxes. Sem dependências.
SPEC 4 — Feedbacks: modifica strings em checkOnClick. Conta marcações vs esperadas.

---

## FASE 5 — VARREDURA FINAL

### 5.1 — Consistência: ✅ Todas as soluções são inserções, não quebram nada existente.

### 5.2 — Jornada Ideal Pós-Implementação
1. Apresentação interativa (perguntas + manipulação)
2. Armadilha da Equiprobabilidade (conflito cognitivo)
3. Desafios 1–2 (evento simples + complementar) — EXISTENTE
4. Desafios 3–5 com Venn dinâmico (operações + cálculo) — EXISTENTE + Venn
5. Feedbacks diferenciados — EXISTENTE enriquecido
6. Institucionalização (síntese + reflexão)

Habilidades verificáveis: EM13MAT105, EM13MAT205, EM13MAT305

### 5.3 — Pontas Soltas Eliminadas
❌→✅ Apresentação passiva → interativa
❌→✅ Equiprobabilidade mecânica → confrontada
❌→✅ Sem institucionalização → tela de síntese
❌→✅ Feedback genérico → diferenciado
❌→✅ Sem Venn → Venn dinâmico

---

## FASE 6 — RELATÓRIO EXECUTIVO

| # | Crit. | Problema | Solução (INSERÇÃO) | Esforço |
|---|-------|----------|-------------------|---------|
| P1 | ⛔ | Apresentação passiva | Adicionar interações nas cenas | 3h |
| P2 | ⛔ | Vieses T3 ausentes | Novo componente Armadilha | 2h |
| P3 | ⛔ | Sem institucionalização | Novo componente Conclusão | 2h |
| P4 | ⚠️ | Sem ativação prévios | Pergunta provocativa | 1h |
| P5 | ⚠️ | Feedback genérico | Enriquecer mensagens existentes | 3h |
| P6 | ⚠️ | Sem Venn | Novo componente Venn SVG | 5h |
| P7 | 🔶 | Sem reflexão | Perguntas reflexivas no final | 1h |
| P8 | 🔶 | Sem atitudinal | Campo justificativa | 2h |
| P9 | 🔷 | Instruções longas | Reduzir texto | 1h |

Esforço total: ~20h | TPACK: Parcial → Pleno

---

## ALTERAÇÕES IMPLEMENTADAS (sessão 2026-04-03)

### Cena 1 — "O Dado"
- Texto: negrito, preto, justificado, font 1.05rem
- Palavras-chave em strong: cubo, 6 faces, pintas
- Ícones das faces removidos (redundantes com Cena 2)
- Dado 3D: tamanho aumentado 21% (roundedBox 1.0 → 1.21)
- REST_Y ajustado para TABLE_Y + 0.82

### Cena 2 — "Conhecendo cada face"
- Texto adicionado: definição do lançamento (não aleatório, apenas apresentação)
- "No lançamento de um dado, espera-se que ele entre em repouso com uma das faces apoiada na mesa. O resultado observado é o número de pintas na face voltada para cima."
- Faces 1 e 6: inclinação removida (pouso perfeitamente paralelo à mesa)

### Cena 3 — "Dado Equilibrado (Honesto)" — TOTALMENTE REFEITA COMO INTERATIVA
- Título: "Dado Equilibrado (Honesto)"
- Texto: definição com simetria (área, forma, tamanho, rugosidade, material, massa)
- 7 etapas interativas:
  0. Ler texto → Continuar
  1. S = {___} → espaço amostral (aceita ignorando espaços/chaves)
  2. n(S) = ___ → número de elementos
  3. P(S) = ___ → evento certo (aceita 1 ou 100%)
  4. P(face i) = ___/___ ≈ ___% → face sorteada aleatoriamente
     - Feedbacks granulares: numerador errado, denominador errado, porcentagem errada, fração OK mas % errada
     - Aceita: 16.6, 16.66, 16.666, 16.666..., 16.67, 16.7
  5. "Mesma probabilidade que face i?" → Sim/Não
  6. Fechamento: texto + fórmula + gráfico de barras
- Gráfico: barras com faces de dado (pintas brancas em fundo azul escuro)
- AnimatedBar: icon substituído por DiceFaceIcon (grade 3×3 de pintas)

### Cena 4 — "Equilibrado × Viciado" — INTERATIVA
- "chance" substituído por "probabilidade" em todos os textos
- Frase falsa removida ("sempre utilizamos dados equilibrados")
- Texto do dado viciado: "por não estarem presentes todas as condições de simetria"
- 4 etapas:
  0. Gráficos animam
  1. Perguntas radio: equiprovável / não equiprovável (erro: "Releia o texto acima e tente novamente")
  2. Texto conclusão + pergunta soma P(Ω) = ___ (aceita 1 ou 100%)
  3. Texto final completo → botão "Iniciar Simulação"

### PRÓXIMA IMPLEMENTAÇÃO PLANEJADA
- Fase de lançamento de 1 dado (entre Cena 4 e OVA principal)
- DiceScene adaptado para alternar cor verde/azul
- 4 exercícios: V→A→V→A ou A→V→A→V (sorteado)
- Dado verde → matriz 6 linhas × 2 colunas (vertical)
- Dado azul → matriz 2 linhas × 6 colunas (horizontal)
- Marcar checkboxes do evento A + calcular P(A)
- Conexão com a tabela de 2 dados

### Cena 5 — "Praticando com um dado" (IMPLEMENTADA)
- 4 exercícios alternando dado verde/azul (sequência sorteada VAVA ou AVAV)
- 4 categorias de eventos (A1=paridade, A2=comparação, A3=propriedade numérica, A4=igualdade)
- 1 evento sorteado de cada categoria por exercício
- DiceScene adaptado: prop initialColor + método setColor('green'|'blue')
- Dado verde → matriz vertical (6 linhas × 2 colunas)
- Dado azul → matriz horizontal (2 linhas × 6 colunas)
- Fluxo por exercício: lançar → marcar checkboxes → calcular P(A) = n/6
- Feedbacks granulares (numerador/denominador separados)
- Ao completar 4 exercícios: texto de transição para OVA principal de 2 dados

### PRÓXIMA IMPLEMENTAÇÃO EM ANDAMENTO (sessão 2026-04-03 continuação)
- Componente TwoDicesPractice.tsx (separado do TwoDicesPresentation.tsx)
- Overlay 2D do copo adaptado para 1 dado (do código HTML enviado)
- Fluxo revisado:
  FASE A — Experimentação (2 lançamentos com copo):
    Rodada 1: Apostar → Lançar dado (cor 1) com copo → Comparar aposta×resultado → Marcar na matriz
    Rodada 2: Apostar → Lançar dado (cor 2) com copo → Comparar aposta×resultado → Marcar na matriz
  FASE B — Exercícios de eventos (4 exercícios, sem lançamento):
    A1→A2→A3→A4: Evento dinâmico → Marcar favoráveis na matriz → Calcular P(A)
- DiceScene com setColor para alternar verde/azul
- Copo overlay com 1 dado (adaptado do HTML de 2 dados)

### ESTADO ATUAL DA IMPLEMENTAÇÃO (fim sessão 2026-04-03)

ARQUIVOS MODIFICADOS:
- DiceScene.tsx: setColor(), initialColor, física melhorada (3 bounces, trajetória horizontal)
- TwoDicesPresentation.tsx: Cenas 1-4 interativas, Cena 5 delegada ao componente
- TwoDicesPractice.tsx: NOVO — componente separado com Fase A (aposta+lançamento+comparação+marcar) + Fase B (4 exercícios A1-A4)

O QUE FUNCIONA:
✅ Cenas 1-4 completas e interativas
✅ DiceScene com setColor('green'|'blue')
✅ Física melhorada (3 bounces, trajetória, movimento horizontal)
✅ TwoDicesPractice.tsx com fluxo completo: intro → experimentação (2 rodadas) → exercícios (4) → finalização
✅ Aposta → lançar dado 3D → comparação visual aposta×resultado → marcar na matriz
✅ Eventos sorteados: A1 (paridade), A2 (comparação), A3 (propriedade), A4 (igualdade)
✅ Matrizes: verde=vertical (6×2), azul=horizontal (2×6)
✅ Cálculo P(A) com feedbacks granulares (numerador/denominador separados)

O QUE FALTA:
❌ Overlay do copo Canvas 2D adaptado para 1 dado (do HTML enviado)
   - Adaptar buildCupShaker2D() do HTML para React
   - Remover segundo dado do overlay
   - Integrar com DiceScene (copo cobre → dado 3D aparece após virada)
   - Sons do copo (cupDiceHit, cupDiceClick, cupFriction) — opcionais via Web Audio API

PARA RETOMAR: "Continue a implementação do overlay do copo na Cena 5 do OVA Dois Dados"
