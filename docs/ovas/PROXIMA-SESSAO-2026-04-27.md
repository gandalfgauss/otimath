# PRÓXIMA SESSÃO — 2026-04-27

**Comece por aqui ao retomar o trabalho.**

---

## Prioridade 1 — Implementar Exercício 8

**Documento de referência:** [`TODO Ex8 - proxima sessao.md`](TODO%20Ex8%20-%20proxima%20sessao.md)

**Resumo executivo:**
- **Caminho C** — mover `roxa/8/eventParametrization.ts` → `src/lib/probability/eventParametrization.ts`; criar `src/hooks/teaching/probability/two-dices/useTwoDicesGameAdvancedHooks.ts` baseado em `roxa/8/useTwoDicesHooks.ts`. **NÃO** mexer no hook em produção.
- **Leitura β** — Ex7 e Ex8 **coexistem** (Ex8 NÃO substitui Ex7). Painel final do Ex6 ganha 3 botões: "Finalizar OVA" / "Ex7 — Fixação básica" / "Ex8 — Fixação avançada".
- **Opção (i)** — marcação sequencial A → B → D no Ex8, espelhando o padrão do Ex6 (cores nítidas, congelamento, remoção de placeholders inúteis).
- **Recursos visuais Ex6/Ex7 todos aplicados:** `eventColors`, `hideIfUnchecked`, cursor `not-allowed`, layout 2D Venn com slots fixos, botão "Marcar todos!" com tooltip, StudyMenu integrado, feedback didático específico por step.
- Nova phase `'unionExercise8'` em `TwoDicesExperiment` + ref no `Presentation`.
- **Estimativa:** 5-6 horas.

---

## Prioridade 2 — Tela de Fechamento Reflexiva + Instrumentação de log

**Documento de referência:** [`parecer Dr OtiMath - Reavaliacao Profunda pos-Ex6-Ex7 com Ex8 planejado e Tela de Fechamento.md`](parecer%20Dr%20OtiMath%20-%20Reavaliacao%20Profunda%20pos-Ex6-Ex7%20com%20Ex8%20planejado%20e%20Tela%20de%20Fechamento.md) (seção 3)

**Inspiração:** [`src/hooks/teaching/probability/roulette/useRouletteLog.ts`](../../src/hooks/teaching/probability/roulette/useRouletteLog.ts) — replicar arquitetura no contexto Dois Dados.

**Resumo executivo:**
- Criar `src/hooks/teaching/probability/two-dices/useTwoDicesLog.ts` espelhando arquitetura do Disco (`logTransition`, `logAttempt`, `logText`, `logBet`, `logSpinResult` + dois novos: `study_menu_opened` e `mark_all_used`).
- Persistência em `localStorage` com chave `otimath_two_dices_log`.
- Instrumentar pontos: `checkOnClick` dos 3 hooks (Ex6 SingleShot, Ex7 herdado, Ex8 advanced), `setPhase` no Experiment, abertura do `StudyMenu`, uso do "Marcar todos!", apostas na Corrida.
- **Tela de Fechamento Reflexiva** (4 componentes em texto corrido):
  1. Resumo cronológico do percurso (cenas + tempo + indicador discreto de desempenho)
  2. Mapa dos conceitos exercitados T1 a T7 (com profundidade de exercício)
  3. Lista compacta dos verbetes do StudyMenu consultados (com badge no mais consultado)
  4. Mensagem de transição para o próximo OVA (probabilidade condicional, independência, árvore, Bayes — cita os tópicos e prepara cognitivamente)
- **Painel de Histórico ao Vivo** (botão sutil no canto sup. dir., overlay análogo ao Menu de Revisão) — cenas completas/atual/próximas.
- **Estimativa:** 3-4 horas após Ex8.

---

## Prioridade 3 (dívida técnica documentada — sem prazo)

- Migrar `useTwoDicesHooks.ts` em produção para o framework `eventParametrization` (resolve R14 vulnerability residual no Ex7 e cena 1).
- Inserir parágrafo sobre T14 (PFC 6×6) como pré-requisito explícito no `TwoDicesInstructionsSection`.
- Aplicar `eventColors` + layout 2D Venn no `TwoDicesGame` original (paridade visual com Ex6).

---

## Recorte do próximo OVA da sequência (NÃO incluir no Dois Dados)

- Probabilidade condicional P(A|B)
- Independência de eventos (P(A∩B) = P(A)·P(B))
- Diagrama de árvore para experimentos sequenciais
- Teorema da Probabilidade Total
- Teorema de Bayes
- Probabilidade condicional em tabelas de contingência
- Retiradas de objetos com e sem reposição (urnas, cartas, bolas)

Tudo isso pertence ao **próximo OVA**. Não recriar no Dois Dados.

---

## Estado do repositório no início desta sessão

- Branch: `mod-rangel`
- Último commit: `f3bc970` (Implementa Ex6-Revisão e Ex7-Fixação com Menu de Revisão)
- `npx tsc --noEmit` → EXIT=0
- Working tree: limpo após commit dos arquivos desta sessão (TODO Ex8, parecer, este lembrete)

---

*Lembrete consolidado em 2026-04-26 23:59 (final da sessão).*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
