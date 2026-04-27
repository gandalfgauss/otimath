# PRÓXIMA SESSÃO — 2026-04-27 — PRODUÇÃO DOS DOIS MANUAIS DO PROFESSOR

**Comece por aqui ao retomar o trabalho amanhã.**

---

## Objetivo do dia

Produzir versão 1.0 publicável de DOIS manuais do professor:
1. **Manual do OVA Disco Probabilístico** (frequência relativa, LGN, equiprobabilidade, roleta)
2. **Manual do OVA Probabilidade Dois Dados** (espaço amostral 6×6, união, interseção, complementar)

**Estado ao fim do dia:** dois PDFs prontos para inserção de screenshots (que ficam para o dia seguinte) e revisão por pares (orientador + colega, ficam para a semana).

---

## Pré-sessão (Claude/Dr. OtiMath executa antes do bloco 1)

**Auditoria sistemática do OVA Disco Probabilístico** (~30 minutos):
- Mapear todas as cenas/fases de `useRouletteHooks.ts` (11.507 linhas) e `RouletteGame.tsx`
- Inventariar os exercícios e a tela final do Disco (subStep 10 do stage 3)
- Inventariar os tópicos T1, T3, T8 do Mapa Dr. OtiMath efetivamente cobertos
- Identificar habilidades BNCC trabalhadas (EM13MAT311, EM13MAT312 já confirmadas no `RouletteInstructionsSection`)
- Documentar log do Disco (`useRouletteLog.ts`) para Componente 8 do manual

---

## Cronograma do dia (9h às 19h, com 1h de almoço)

| Bloco | Horário | Atividade | Quem faz |
|-------|---------|-----------|----------|
| 1 | 9:00–10:30 | Esboço dos dois esqueletos (10 componentes × 2 manuais) + captura de decisões pedagógicas chave (perfis de leitor, tom, tempos realistas) | Claude rascunho, orientando decide |
| 2 | 10:30–12:30 | **Manual Dois Dados — componentes 1 a 5** (página de rosto, mapa visual, BNCC, pré-requisitos, plano de aula) | Claude redige, orientando valida |
| — | 12:30–13:30 | Almoço | — |
| 3 | 13:30–15:00 | **Manual Dois Dados — componentes 6 a 10** (banco de perguntas, diagnóstica, leitura JSON, questionário pós, apêndice científico) | Claude redige, orientando valida |
| 4 | 15:00–17:00 | **Manual Disco — componentes 1 a 5** (adaptados ao contexto roleta + frequência relativa + LGN) | Claude redige, orientando valida |
| 5 | 17:00–18:30 | **Manual Disco — componentes 6 a 10** | Claude redige, orientando valida |
| 6 | 18:30–19:00 | Diagramação básica (cabeçalhos, índice, capa) e exportação de dois PDFs versão 1.0 | Claude gera, orientando revisa |

---

## Estrutura de cada manual (10 componentes — fundamentação no parecer)

Documento de fundamentação: [`parecer Dr OtiMath - Manual do Professor Brilhante.md`](parecer%20Dr%20OtiMath%20-%20Manual%20do%20Professor%20Brilhante.md)

1. Página de rosto narrativa (1 página)
2. Mapa visual do percurso (1 página com infográfico)
3. Conexões BNCC explícitas (1 página em tabela)
4. Pré-requisitos do estudante e adaptações (1 página)
5. Plano de aula sugerido (2 páginas, duas aulas geminadas)
6. Banco de perguntas de discussão coletiva (2 páginas)
7. Instrumento de avaliação diagnóstica pré-aplicação (1 a 2 páginas)
8. Roteiro de leitura do relatório JSON exportado (1 a 2 páginas)
9. Questionário de percepção pós-aplicação (1 página)
10. Apêndice científico para professor pesquisador (2 a 3 páginas)

---

## Princípios de redação (não esquecer)

- Voz ativa direta (sem passivas acadêmicas)
- Imperativo respeitoso (colega para colega, não doutor para professor)
- Evidência ancorada em literatura ABNT em versalete
- Cada decisão pedagógica acompanhada de citação primária
- Auto-suficiência (manual legível sem o OVA aberto)
- Tempos realistas (calibrados por piloto ou estimados generosamente)
- Página final de Solução de Problemas Comuns

---

## Pré-requisitos para que dê em um dia

1. Orientando dedica o dia integral, sem interrupções de outras frentes
2. Decisão pedagógica é tomada na hora (não fica para "depois penso") — evita gargalo
3. Screenshots ficam para o dia seguinte (4 horas de captura/anotação)
4. Revisão por pares (orientador + colega) fica para a semana seguinte
5. Diagramação final (Overleaf, Word, Google Docs — escolher antes) fica em qualidade básica no dia 1, refinada no dia 2

---

## Estado do repositório no início desta sessão

- Branch: `mod-rangel`
- Último commit: `76a19b2` (anexos do parecer Dr OtiMath sobre varredura integral e dev tools)
- `npx tsc --noEmit` → EXIT=0
- Working tree: limpo após commits da sessão de 2026-04-26

---

## O que NÃO entra no escopo do dia

- Captura de screenshots anotados (dia seguinte, 4 horas)
- Vídeo institucional de 4 a 7 minutos (extra opcional, semana seguinte)
- Versão plastificável de uma página (extra opcional)
- Galeria de depoimentos pós-piloto (depende do piloto empírico)
- Revisão final por pares (semana seguinte, depende do orientador)

---

*Lembrete consolidado em 2026-04-26 ao final da sessão.*
*Projeto OtiMath.com — Dissertação PROFMAT/UFVJM — Rangel Freitas dos Santos.*
