# ANÁLISE COMPARATIVA DR. OTIMATH
# Sequência Didática: Disco Probabilístico → Dois Dados

**Analista:** Dr. OtiMath.com
**Data:** 2026-04-12
**Objetivo:** Identificar o que o relatório do OVA Dois Dados aponta como lacuna/problema, mas que já foi trabalhado e consolidado no OVA Disco Probabilístico (que o precede na sequência didática). Remover do relatório o que já foi superado.

---

## 1. CONTEXTO DA SEQUÊNCIA DIDÁTICA

A sequência didática da dissertação PROFMAT/UFVJM é composta por (ao menos) dois OVAs em ordem:

1. **OVA 1 — Simulador Probabilístico com Disco Aleatório** (rota: `/ensino/probabilidade/disco`)
   - 3 etapas completas (~11.500 linhas de lógica em `useRouletteHooks.ts`)
   - Cobre: experimento aleatório, espaço amostral, evento, complementar, disjuntos, união, interseção, P(A∪B), frequência relativa, Lei dos Grandes Números

2. **OVA 2 — Probabilidade – Dois Dados** (rota: `/ensino/probabilidade/dois-dados`)
   - 7 cenas de apresentação + jogo de prática (~14.500 linhas)
   - Cobre: dado, espaço amostral 6×6, par ordenado, soma, distribuição, P(par), P(soma), operações entre eventos

**Premissa fundamental:** O aluno chega ao OVA Dois Dados APÓS ter completado o OVA Disco Probabilístico. Portanto, conceitos formalmente construídos no Disco NÃO precisam ser reintroduzidos como se fossem inéditos no Dois Dados.

---

## 2. MAPEAMENTO: O QUE O DISCO PROBABILÍSTICO JÁ COBRE

### 2.1 — Conceito de evento como subconjunto do espaço amostral

**No Disco:**
- SubStep 3 (Etapa 1): Definição formal de evento como subconjunto de S
- SubSteps 0.1-0.6: 7 frames conceituais progressivos (Experimento → Espaço Amostral → Evento → Probabilidade)
- Exercícios interativos de seleção de setores que formam um evento
- Notação A = {setores selecionados}

**Cobertura:** COMPLETA. O aluno sai do Disco sabendo que evento é um subconjunto.

**Impacto no relatório Dois Dados:** A inserção I1 ("O que é um evento?") era classificada como ESSENCIAL. **Deve ser rebaixada para CONTEXTUALIZAÇÃO RÁPIDA** — o conceito já é conhecido, basta contextualizá-lo na tabela 6×6.

---

### 2.2 — Interseção de eventos (A ∩ B)

**No Disco:**
- SubStep 6.55: Gerador de eventos mutuamente exclusivos (A ∩ B = ∅) — o aluno aprende o conceito de interseção pela negação (dois eventos que NÃO têm interseção)
- SubStep 6.56: Calculadora de P(A∪B) que usa a fórmula P(A∪B) = P(A) + P(B) − P(A∩B) — a interseção aparece como componente da fórmula
- Gerador de desafios de interseção (linhas 2452-2700 de useRouletteHooks.ts): **45 tipos diferentes** de problemas de interseção com 2 condições simultâneas (divisor e par, múltiplo e primo, etc.)
- Desafios onde o aluno deve marcar setores que satisfazem AMBAS as condições
- Cálculo de P(A∩B) como fração

**Cobertura:** EXTENSIVA. O Disco trabalha interseção tanto no caso vazio (disjuntos) quanto no caso não-vazio (45 tipos), com seleção visual interativa.

**Impacto no relatório Dois Dados:** A inserção I2 ("Interseção visual") era ESSENCIAL. **Deve ser rebaixada para TRANSFERÊNCIA CONTEXTUAL** — o conceito já é construído; no Dois Dados basta mostrar como ele se manifesta na tabela 6×6 com dois eventos destacados.

---

### 2.3 — União de eventos (A ∪ B) com percepção de sobreposição

**No Disco:**
- SubStep 6.56: Fase completa de Probabilidade da União de Eventos
  - 3 tipos de atividade: união de 2, 3 ou 4-6 eventos
  - 15+ receitas (funções geradoras) para exemplos diversificados
  - Fluxo interativo: selecionar setores → digitar P(evento) → calcular P(A∪B) com fórmula
  - Fórmula explícita: P(A∪B) = P(A) + P(B) − P(A∩B)
  - Para eventos ME: P(A∪B) = P(A) + P(B)
  - Validação por multiplicação cruzada (R14)

**Cobertura:** COMPLETA. O aluno sai do Disco tendo aplicado a fórmula da união múltiplas vezes, inclusive com sobreposição (quando eventos não são disjuntos).

**Impacto no relatório Dois Dados:** A inserção I3 ("União visual + dupla contagem") era ESSENCIAL. **Deve ser rebaixada para APLICAÇÃO CONTEXTUAL** — o conceito e a fórmula já são conhecidos; no Dois Dados é uma questão de aplicar na representação tabular 6×6.

---

### 2.4 — Fórmula P(A∪B) = P(A) + P(B) − P(A∩B)

**No Disco:**
- SubStep 6.56: Fórmula ensinada e aplicada interativamente
- O aluno digita P(A), P(B), calcula P(A∪B) usando a fórmula
- Múltiplos exercícios com eventos gerados algoritmicamente (15+ receitas)
- Validação rigorosa (R14)

**Cobertura:** COMPLETA. A fórmula é a peça central do SubStep 6.56.

**Impacto no relatório Dois Dados:** A inserção I6 ("Descoberta guiada da fórmula P(A∪B)") era ESSENCIAL. **Deve ser REMOVIDA como "descoberta"** — a fórmula já foi descoberta no Disco. No Dois Dados, basta RELEMBRAR e APLICAR no contexto da tabela 6×6. Não há sentido em refazer a descoberta guiada.

---

### 2.5 — Evento complementar (Ā, P(Ā) = 1 − P(A))

**No Disco:**
- SubSteps 6.41-6.45 (T1-T5): Primeira série sobre complementar
- SubSteps 6.6-6.69 (T1-T6): Segunda série com cálculo guiado
- Seleção visual: aluno marca os setores de Ā dado A
- Fórmula: P(Ā) = 1 − P(A)

**No Dois Dados (já implementado):**
- Cena 5: Tratamento extensivo (aposta, cálculo, comparação P(A) vs P(Ā))
- Jogo: Cálculo de P(Ā) nos 2 primeiros desafios

**Cobertura combinada:** DUPLAMENTE COBERTA (Disco + Dois Dados Cena 5).

**Impacto no relatório:** Nenhuma lacuna a reportar sobre complementar. O relatório original não apontava isso como lacuna — confirma-se que está correto.

---

### 2.6 — Eventos disjuntos / mutuamente exclusivos

**No Disco:**
- SubStep 6.55: Gerador de exemplos ME com 6 categorias
  - Cor simples × cor simples
  - Cor simples × cor composta
  - Cor composta × cor composta
  - Número × número
  - Número × propriedade numérica
  - Propriedade × propriedade
- A ∩ B = ∅ é trabalhado visualmente (nenhum setor em comum)

**Cobertura:** COMPLETA.

**Impacto:** Conceito de eventos disjuntos não precisa ser introduzido no Dois Dados. Se aparecer, é como recall.

---

### 2.7 — Confusão "ou" lógico vs coloquial (Viés 6.2 do relatório)

**No Disco:**
- SubStep 6.56: O aluno trabalha com "A ou B" no sentido matemático (inclusivo) ao calcular P(A∪B)
- A prática repetida com a fórmula P(A∪B)=P(A)+P(B)−P(A∩B) força o reconhecimento de que "ou" inclui a interseção

**Cobertura:** PARCIAL — trabalhado por uso repetido, mas sem mediação verbal explícita sobre a diferença entre "ou" coloquial e matemático.

**Impacto:** O viés pode persistir. Uma nota contextual no Jogo (inserção I8) ainda é RECOMENDÁVEL, mas não como "NÃO TRATADO" — deve ser "PARCIALMENTE TRATADO no Disco, reforço contextual recomendável."

---

### 2.8 — Dupla contagem na união (Viés 6.3 do relatório)

**No Disco:**
- A fórmula P(A∪B)=P(A)+P(B)−P(A∩B) trata a dupla contagem algebricamente
- O aluno precisa subtrair P(A∩B) para obter o resultado correto

**Cobertura:** TRATADO ALGEBRICAMENTE — mas sem visualização explícita de "esta célula está sendo contada duas vezes."

**Impacto:** No contexto do Disco (setores do disco), a dupla contagem é implícita. No contexto do Dois Dados (tabela 6×6), uma visualização da sobreposição ainda agrega valor, mas como REFORÇO VISUAL de algo já compreendido, não como introdução.

---

### 2.9 — Confusão evento vs resultado (Viés 6.4 do relatório)

**No Disco:**
- SubSteps 1-3 (Etapa 1): Distinção formal entre resultado (setor individual) e evento (subconjunto de setores)
- Exercícios de seleção exigem que o aluno distinga

**Cobertura:** COMPLETA.

**Impacto:** Viés 6.4 deve ser rebaixado de "PARCIALMENTE TRATADO" para "JÁ CONSTRUÍDO no Disco, apenas contextualizar para resultado=par ordenado e evento=subconjunto de pares."

---

### 2.10 — Passagem do caso concreto para a fórmula (Viés 6.5 do relatório)

**No Disco:**
- A progressão SubStep 3 → SubStep 5 → SubStep 6 → SubStep 6.56 faz exatamente essa passagem: do concreto (setores) para a fórmula (P=n(A)/n(S), P(A∪B)=P(A)+P(B)−P(A∩B))

**Cobertura:** COMPLETA para o contexto do Disco.

**Impacto:** No Dois Dados, a passagem é para um NOVO contexto (tabela 6×6), mas a habilidade de generalizar já foi construída. Basta uma ponte de transferência, não uma reconstrução.

---

### 2.11 — Diferença A−B (parcialmente coberta)

**No Disco:**
- Mencionada ("◐ — Mentioned, not primary focus")
- Aparece como "não divisor de m" (negação aplicada), mas NÃO como operação formal A−B entre dois eventos nomeados

**Cobertura:** PARCIAL. O conceito operacional de "pertence a A mas não a B" não é formalizado como A−B no Disco.

**Impacto:** A inserção I4 ("Diferença visual") PERMANECE RELEVANTE — é genuinamente nova no Dois Dados. Mas com prioridade RECOMENDÁVEL (não ESSENCIAL), pois o aluno já sabe operar com complementar e interseção, e A−B = A∩B̄ pode ser derivado.

---

### 2.12 — Diagrama de Venn

**No Disco:**
- Ausente como visualização explícita ("◐ — Implicit in sector selection, not explicit")

**No Dois Dados:**
- Ausente

**Cobertura:** NÃO COBERTO em nenhum dos dois OVAs.

**Impacto:** A inserção I5 (Diagrama de Venn) PERMANECE RELEVANTE como ponte de registros (Duval). Prioridade: RECOMENDÁVEL.

---

### 2.13 — Exercício inverso (deduzir P(A∩B) dados P(A), P(B), P(A∪B))

**No Disco:**
- A fórmula é aplicada no sentido direto (calcular P(A∪B) dados os componentes)
- O sentido inverso (isolar P(A∩B)) NÃO aparece explicitamente

**Cobertura:** NÃO COBERTO.

**Impacto:** A inserção I7 (exercício inverso) PERMANECE RELEVANTE. Prioridade: RECOMENDÁVEL.

---

## 3. TABELA DE RECLASSIFICAÇÃO DAS LACUNAS

| Item do relatório original | Classificação original | O que o Disco já cobre | Nova classificação |
|---------------------------|----------------------|----------------------|-------------------|
| **Lacuna 5.1** — Conceito de evento como subconjunto | AUSENTE | COMPLETO (SubStep 3) | **SUPERADO** — basta contextualizar para 6×6 |
| **Lacuna 5.2** — Interseção de eventos | AUSENTE | EXTENSIVO (45 tipos, SubStep 6.55-6.56) | **SUPERADO** — transferência contextual |
| **Lacuna 5.3** — União com sobreposição | AUSENTE | COMPLETO (SubStep 6.56, 15+ receitas) | **SUPERADO** — aplicação na tabela |
| **Lacuna 5.4** — Diferença A−B | AUSENTE | PARCIAL (negações, sem formalização) | **PARCIALMENTE SUPERADO** — formalizar como recall |
| **Lacuna 5.5** — Fórmula P(A∪B) | AUSENTE | COMPLETO (SubStep 6.56) | **SUPERADO** — relembrar e aplicar |
| **Lacuna 5.6** — Exercício inverso | AUSENTE | NÃO coberto | **MANTÉM** — genuinamente ausente |
| **Viés 6.2** — Confusão "ou" | NÃO TRATADO | PARCIAL (uso repetido no SubStep 6.56) | **PARCIALMENTE SUPERADO** — reforço contextual |
| **Viés 6.3** — Dupla contagem | NÃO TRATADO | TRATADO algebricamente na fórmula | **PARCIALMENTE SUPERADO** — visualização tabular agrega |
| **Viés 6.4** — Evento vs resultado | PARCIALMENTE TRATADO | COMPLETO (SubSteps 1-3) | **SUPERADO** |
| **Viés 6.5** — Exemplo → fórmula | NÃO TRATADO | COMPLETO (progressão Disco) | **SUPERADO** — transferência de contexto |
| **Viés 6.6** — Uso mecânico | PARCIALMENTE TRATADO | Construção conceitual prévia ajuda | **PARCIALMENTE SUPERADO** |

---

## 4. RECLASSIFICAÇÃO DAS INSERÇÕES PROPOSTAS

| Inserção | Classificação original | Reclassificação pós-Disco | Justificativa |
|----------|----------------------|--------------------------|---------------|
| **I1** — "O que é um evento?" (1 tela) | ESSENCIAL | **CONTEXTUALIZAÇÃO** (1 parágrafo) | Conceito já construído; basta 1 frase: "Lembre-se: um evento é um subconjunto do espaço amostral. Na tabela 6×6, um evento é um grupo de pares." |
| **I2** — Interseção visual (1-2 telas) | ESSENCIAL | **REFORÇO CONTEXTUAL** (1 tela) | O aluno já sabe o que é interseção; mostrar 2 eventos com cores na tabela e perguntar: "Quais pares pertencem a AMBOS?" |
| **I3** — União visual + dupla contagem (2-3 telas) | ESSENCIAL | **REFORÇO CONTEXTUAL** (1 tela) | Fórmula já conhecida; mostrar na tabela e perguntar: "Se somamos n(A)+n(B), quantos pares contamos duas vezes?" |
| **I4** — Diferença visual (1 tela) | ESSENCIAL | **RECOMENDÁVEL** (1 tela) | Parcialmente nova — mostrar A−B na tabela |
| **I5** — Diagrama de Venn | RECOMENDÁVEL | **RECOMENDÁVEL** (mantém) | Genuinamente ausente em ambos os OVAs |
| **I6** — Descoberta guiada da fórmula P(A∪B) (2-3 telas) | ESSENCIAL | **REMOVIDA** | Fórmula já descoberta/ensinada no Disco. Redundante. |
| **I7** — Exercício inverso (1 tela) | RECOMENDÁVEL | **RECOMENDÁVEL** (mantém) | Genuinamente ausente em ambos |
| **I8** — Microexplicações contextuais no Jogo | RECOMENDÁVEL | **RECOMENDÁVEL** (mantém) | Reforço in situ |

---

## 5. O QUE MUDA NA PROPOSTA DE SEQUÊNCIA COMPLEMENTAR

### Antes (relatório original): Cena 7b — 6-8 telas, ~5-7 minutos
Incluía introdução completa de evento, interseção, união, diferença, descoberta guiada da fórmula, exercício inverso. Tratava os conceitos como INÉDITOS.

### Depois (pós-comparação com Disco): Cena 7b — 3-4 telas, ~2-3 minutos
Inclui apenas:
1. **Contextualização rápida** (1 parágrafo): "Você já aprendeu no Disco Probabilístico que eventos são subconjuntos do espaço amostral e que P(A∪B)=P(A)+P(B)−P(A∩B). Agora vamos aplicar esses conceitos na tabela 6×6 dos dois dados."
2. **Reforço visual de interseção e união na tabela** (1-2 telas): Dois eventos destacados com cores; aluno identifica A∩B e A∪B por clique; contagem rápida.
3. **Diferença A−B na tabela** (1 tela): "Quais pares pertencem a A mas NÃO a B?"
4. **Exercício inverso opcional** (1 tela): Dado P(A), P(B), P(A∪B), calcular P(A∩B).

A "descoberta guiada da fórmula" (I6 original) é **eliminada** — seria uma repetição pedagógica desnecessária que inflaria o OVA sem ganho conceitual.

---

## 6. O QUE PERMANECE INTACTO DO RELATÓRIO ORIGINAL

### Todos os bugs técnicos (Parte 0):
Os bugs 0.1-0.10 são problemas de código, independentes do Disco. **TODOS PERMANECEM**.

| Bug | Status |
|-----|--------|
| 0.1 — Validação flutuante (CRÍTICO) | PERMANECE |
| 0.2 — Complementar evento 12 (ALTO) | PERMANECE |
| 0.3 — Som click.mp3 inexistente (MÉDIO) | PERMANECE |
| 0.4 — Navegação irrestrita (ALTO) | PERMANECE |
| 0.5 — Bolinha dev visível (MÉDIO) | PERMANECE |
| 0.6 — Cena 3 não aceita equivalentes (BAIXO) | PERMANECE |
| 0.7 — Responsividade tabela 6×6 (ALTO) | PERMANECE |
| 0.8 — Responsividade corrida (MÉDIO) | PERMANECE |
| 0.9 — DiceFaceIcon ×4 duplicada (MÉDIO) | PERMANECE |
| 0.10 — Corrida revela soma (ALTO) | PERMANECE |

### Varredura diagnóstica (Parte 1):
A análise de cada cena permanece válida. As cenas 1-7 não mudam por causa do Disco.

### Mapeamento técnico-pedagógico (Parte 2):
Permanece. O diagnóstico de que o Jogo tem "mediação NENHUMA" se atenua para "mediação insuficiente para transferência de contexto" — o aluno tem os conceitos, mas precisa de uma ponte para o novo formato (tabela 6×6 vs setores de disco).

### Pré-requisitos epistemológicos (Parte 3):
O salto conceitual Cena 7 → Jogo é ATENUADO (não eliminado):
- **Antes:** O aluno chegava ao Jogo sem NENHUM conceito de operações entre eventos
- **Depois:** O aluno chega com conceitos do Disco, mas precisa TRANSFERIR para o novo contexto

O risco muda de "formalização prematura" para "falta de ponte de transferência contextual."

### Exercícios faltantes (Parte 8):
- Exercícios 1 (marcação A∩B) e 2 (contagem dupla contagem): rebaixados para REFORÇO CONTEXTUAL
- Exercício 3 (completar fórmula): REMOVIDO (fórmula já praticada no Disco)
- Exercício 4 (inverso: achar P(A∩B)): PERMANECE (genuinamente ausente)

### Fórmula da união (Parte 9):
**REMOVIDA INTEGRALMENTE.** A demonstração didática da fórmula P(A∪B) = P(A) + P(B) − P(A∩B) já foi realizada no Disco Probabilístico (SubStep 6.56). Refazê-la no Dois Dados seria:
- Redundante pedagogicamente
- Inflacionária (2-3 telas sem ganho)
- Contraditória com o princípio de "máximo ganho com mínima intervenção"

No Dois Dados, a fórmula deve ser RELEMBRADA em 1 frase e APLICADA no contexto tabular.

### Acessibilidade:
Permanece integralmente — são questões de código/interface, independentes do Disco.

---

## 7. SÍNTESE EXECUTIVA REVISADA (PÓS-COMPARAÇÃO)

### A. Inserir OBRIGATORIAMENTE (corrigir bugs)
1. Bug 0.1 — Validação por multiplicação cruzada
2. Bug 0.2 — Complementar evento 12
3. Bug 0.3 — Som inexistente
4. Bug 0.4 — Navegação restrita
5. Bug 0.5 — Bolinha dev
6. Bug 0.10 — Soma na corrida

### B. Inserir OBRIGATORIAMENTE (pedagógico)
7. Contextualização rápida (1 parágrafo) — ponte Disco → tabela 6×6
8. Reforço visual de interseção na tabela (1 tela) — transferência contextual
9. Reforço visual de união na tabela (1 tela) — com contagem de sobreposição

### C. Inserir RECOMENDAVELMENTE
10. Diferença A−B na tabela (1 tela)
11. Diagrama de Venn (1 tela)
12. Exercício inverso: deduzir P(A∩B) (1 tela)
13. Microexplicações contextuais no Jogo (I8)
14. Bug 0.7 — Responsividade tabela

### D. NÃO inserir (superado pelo Disco)
- ~~Descoberta guiada da fórmula P(A∪B)~~ → Já feita no Disco
- ~~Introdução formal de "evento"~~ → Já feita no Disco
- ~~Introdução formal de "interseção"~~ → Já feita no Disco
- ~~Introdução formal de "união"~~ → Já feita no Disco
- ~~Exercício de completar fórmula~~ → Já praticado no Disco

### E. Sequência final enxuta (REVISADA)

```
[OVA 1 — DISCO PROBABILÍSTICO]
  Etapa 1: Espaço amostral equiprovável
    → evento, complementar, disjuntos, união, interseção, P(A∪B), freq. relativa, LGN
  Etapa 2: Espaço não-equiprovável por ângulo
    → P = θ/360, convergência
  Etapa 3: Espaço não-equiprovável por cor
    → P = n(cor)/n(total), falácia do jogador

[OVA 2 — PROBABILIDADE DOIS DADOS]
  Cena 1: O Dado (como está)
  Cena 2: Faces (como está)
  Cena 3: Dado equilibrado (como está + corrigir R14)
  Cena 4: Equi. vs Viciado (como está)
  Cena 5: Prática 1 dado (como está)
  Cena 6: Máquina (como está)
  Cena 7: Dois dados + tabela + distribuição + prob + corrida
           (como está + corrigir Bug 0.10)
  Cena 7b: [NOVA — 3-4 telas, ~2-3 min]
    → Contextualização: "Você já conhece evento, interseção, união do Disco"
    → Reforço visual: A e B na tabela 6×6, A∩B, A∪B, contagem
    → Diferença A−B (recomendável)
    → Exercício inverso: P(A∩B) dado P(A∪B) (recomendável)
  Jogo: Prática livre (como está + corrigir Bugs 0.1, 0.2)
```

### F. Redução de escopo pós-comparação

| Métrica | Relatório original | Relatório revisado |
|---------|-------------------|-------------------|
| Inserções classificadas ESSENCIAL | 6 (I1-I4, I6, I8) | 3 (contextualização + 2 reforços visuais) |
| Telas novas propostas | 6-8 telas | 3-4 telas |
| Tempo estimado de inserção | 5-7 minutos | 2-3 minutos |
| Conceitos a introduzir do zero | 5 (evento, ∩, ∪, −, fórmula) | 0 (todos já construídos no Disco) |
| Conceitos a transferir/contextualizar | 0 | 4 (evento na tabela, ∩ na tabela, ∪ na tabela, −) |
| Parte 9 (Fórmula P(A∪B)) | 2-3 telas de descoberta | REMOVIDA integralmente |

---

## 8. CONCLUSÃO

A análise comparativa revela que o OVA Disco Probabilístico é um **pré-requisito robusto** que constrói extensivamente os conceitos de evento, interseção, união e a fórmula P(A∪B). O relatório original do OVA Dois Dados classificava essas lacunas como "AUSENTES" — classificação que era CORRETA se o OVA fosse analisado isoladamente, mas que se torna INCORRETA no contexto da sequência didática completa.

A revisão reduz a proposta de intervenção de **6-8 telas de introdução conceitual** para **3-4 telas de transferência contextual**, mantendo o princípio de máximo ganho pedagógico com mínima intervenção estrutural.

Os **10 bugs técnicos** permanecem integralmente válidos e devem ser corrigidos independentemente do Disco.

O que o OVA Dois Dados genuinamente precisa (além das correções de bugs):
1. Uma ponte de transferência Disco → tabela 6×6 (contextualização)
2. Reforço visual de interseção e união no novo formato tabular
3. A diferença A−B (parcialmente nova)
4. Exercício inverso para P(A∩B) (genuinamente novo)

---

*Dr. OtiMath.com — Análise comparativa concluída em 2026-04-12*
*Sequência: Disco Probabilístico (OVA 1) → Dois Dados (OVA 2)*
