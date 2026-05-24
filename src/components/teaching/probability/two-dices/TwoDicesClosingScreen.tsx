'use client';

/* ═══════════════════════════════════════════════════════════════════
   TwoDicesClosingScreen — Tela de Fechamento Reflexiva do OVA Dois Dados

   QUANDO É EXIBIDA
     Quando o estudante clica em "Finalizar OVA" no Ex6, Ex7 ou Ex8.
     Substitui a tela final padrão do `TwoDicesPresentation` enquanto
     mantém o caminho `onFinished()` para o pai (Presentation) decidir.

   COMPONENTES (em texto corrido — princípio de mini-capítulo R10)
     1. Resumo cronológico do percurso (blocos × tempo × indicador discreto)
     2. Mapa dos conceitos exercitados (T1 a T8 do Mapa Dr. OtiMath)
     3. Lista compacta dos verbetes consultados (com badge no mais consultado)
     4. Mensagem de transição para o próximo OVA da sequência
     5. (NOVO) Vieses cognitivos detectados — tabela com código, nome,
        descrição, ocorrências e referência ABNT
     6. (NOVO) Dificuldades de aprendizagem detectadas — síntese
        operacional dos vieses + verbetes consultados
     7. (NOVO) Desempenho por exercício — habilidades operacionais
        do exercício + habilidades BNCC mapeadas

   FUNDAMENTOS PEDAGÓGICOS
     • Metacognição informada (GARFIELD; BEN-ZVI, 2014, p. 142)
     • Organizador prévio reverso (AUSUBEL, 2000, p. ix)
     • Continuidade vygotskiana / ZDP (VYGOTSKY, 1991)
     • Visibilidade do estado do sistema (NIELSEN, 1994, h. 1)

   ARQUITETURA
     Reusa Button, TextBlock, StudyMenu — sem componentes globais novos.
     Lê dados via `useTwoDicesLog`: `getLogSummary`, `getPhasePerformance`,
     `detectCognitiveBiases`, `getGlossaryConsultations`, `downloadLog`.
   ═══════════════════════════════════════════════════════════════════ */

import React, { useMemo } from 'react';
import { Button } from '@/components/global/Button';
import { TextBlock } from '@/components/global/TextBlock';
import { Download, RefreshCw, ArrowRight } from 'lucide-react';
import {
  getLogSummary,
  getPhasePerformance,
  detectCognitiveBiases,
  getGlossaryConsultations,
  downloadLog,
  type PhasePerformance,
  type BiasOccurrence,
} from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';
import {
  PHASE_REGISTRY,
  BLOCK_TITLES,
  BNCC_DESCRIPTIONS,
  TOPIC_DESCRIPTIONS,
  type PhaseDescriptor,
} from './shared/twoDicesPhaseRegistry';
import { GLOSSARY_ENTRIES } from './shared/studyMenuContent';

interface TwoDicesClosingScreenProps {
  /** Disparado quando o estudante clica em "Voltar para o início". */
  onRestart?: () => void;
  /** Disparado quando o estudante clica no link do próximo OVA. */
  nextOvaHref?: string;
  /** Disparado quando o estudante clica em "Concluir e sair". */
  onConclude?: () => void;
}

/** Indicador discreto de desempenho por bloco — usado nas chips de cada
 *  exercício do componente 1 (resumo cronológico) e do componente 7
 *  (desempenho por exercício). NÃO É AVALIAÇÃO PUNITIVA — é espelho
 *  metacognitivo (GARFIELD; BEN-ZVI, 2014, p. 142). */
function performanceIndicator(p: PhasePerformance): {
  label: string;
  color: string;
  bg: string;
} {
  if (p.attempts === 0) {
    return {
      label: 'Sem tentativas',
      color: 'var(--color-neutral-dark)',
      bg: 'var(--color-neutral-lightest)',
    };
  }
  if (p.errors === 0) {
    return {
      label: 'Sem erros',
      color: 'var(--color-feedback-success-darkest)',
      bg: 'var(--color-feedback-success-lighter)',
    };
  }
  if (p.errors <= 2) {
    return {
      label: `${p.errors} ${p.errors === 1 ? 'erro' : 'erros'}`,
      color: 'var(--color-feedback-warning-darkest)',
      bg: 'var(--color-feedback-warning-lighter)',
    };
  }
  return {
    label: `${p.errors} erros`,
    color: 'var(--color-feedback-error-dark)',
    bg: 'var(--color-feedback-error-lighter)',
  };
}

function formatElapsed(ms: number): string {
  if (ms <= 0) return '—';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}min ${seconds}s`;
}

export function TwoDicesClosingScreen({
  onRestart,
  nextOvaHref = '/ensino/probabilidade',
  onConclude,
}: Readonly<TwoDicesClosingScreenProps>) {
  /* Snapshot do log no momento do mount — não revalida em re-render
     porque os dados são estáveis após "Finalizar OVA". */
  const summary = useMemo(getLogSummary, []);
  const performance = useMemo(getPhasePerformance, []);
  const biases = useMemo(detectCognitiveBiases, []);
  const glossaryConsultations = useMemo(getGlossaryConsultations, []);

  /* ──────────────────────────────────────────────────────────────
     Mapeamento de uso:
     • performanceByPhase: lookup O(1) phase id → PhasePerformance
     • topicCoverage: para cada tópico T1–T8, lista as phases que
       trabalharam o tópico, e marca a profundidade (introduzido /
       aplicado / exercitado em revisão) com base no bloco.
     ─────────────────────────────────────────────────────────────── */
  const performanceByPhase = useMemo(() => {
    const map: Record<string, PhasePerformance> = {};
    for (const p of performance) map[p.phase] = p;
    return map;
  }, [performance]);

  const topicCoverage = useMemo(() => {
    const map: Record<string, { phases: string[]; depths: Set<string> }> = {};
    for (const t of Object.keys(TOPIC_DESCRIPTIONS)) {
      map[t] = { phases: [], depths: new Set() };
    }
    for (const phase of PHASE_REGISTRY) {
      // Considera apenas phases EFETIVAMENTE percorridas pelo estudante.
      if (!performanceByPhase[phase.id]) continue;
      for (const t of phase.topicsT) {
        if (!map[t]) continue;
        map[t].phases.push(phase.shortLabel);
        if (phase.block === 'apresentacao' || phase.block === 'sistematizacaoTabular') {
          map[t].depths.add('introduzido');
        } else if (phase.block === 'exercicios' || phase.block === 'fundamentacaoUniao') {
          map[t].depths.add('aplicado');
        } else if (phase.block === 'revisao' || phase.block === 'fixacao') {
          map[t].depths.add('revisado');
        }
      }
    }
    return map;
  }, [performanceByPhase]);

  /** BNCC consolidada: união das habilidades das phases percorridas. */
  const bnccCovered = useMemo(() => {
    const set = new Set<string>();
    for (const phase of PHASE_REGISTRY) {
      if (!performanceByPhase[phase.id]) continue;
      for (const code of phase.bnccCodes) set.add(code);
    }
    return Array.from(set).sort();
  }, [performanceByPhase]);

  /* Verbete mais consultado — destaque com badge. */
  const mostConsultedGlossaryEntryId =
    glossaryConsultations[0]?.count > 0 ? glossaryConsultations[0].glossaryEntryId : null;
  const glossaryTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of GLOSSARY_ENTRIES) map[v.id] = v.title;
    return map;
  }, []);

  /* Phases percorridas, agrupadas por bloco. */
  const visitedByBlock = useMemo(() => {
    const out = new Map<PhaseDescriptor['block'], PhaseDescriptor[]>();
    for (const phase of PHASE_REGISTRY) {
      if (!performanceByPhase[phase.id]) continue;
      if (!out.has(phase.block)) out.set(phase.block, []);
      out.get(phase.block)!.push(phase);
    }
    return Array.from(out.entries());
  }, [performanceByPhase]);

  return (
    <div className="flex flex-col gap-y-xs max-w-[920px] mx-auto p-xs">
      <header className="flex flex-col items-center gap-y-quarck text-center">
        <h2 className="ds-heading-tera text-brand-otimath-darker">
          Você concluiu o OVA Probabilidade Dois Dados
        </h2>
        <p className="ds-body text-neutral-darkest max-w-[700px]">
          Esta tela é um <strong>espelho do seu percurso</strong> — não é avaliação.
          Use-a para reconhecer o que você consolidou, identificar pontos para
          revisitar antes de uma prova e perceber o que vem no próximo OVA.
        </p>
        <p className="ds-caption text-neutral-dark">
          Tempo total da sessão: <strong>{summary.totalTime}</strong>
          {' · '}interações registradas: <strong>{summary.totalEntries}</strong>
          {' · '}tentativas: <strong>{summary.attempts}</strong>
          {' · '}erros: <strong>{summary.errors}</strong>
          {' · '}consultas ao Menu de Revisão: <strong>{summary.studyMenuOpens}</strong>
        </p>
      </header>

      {/* ───────────────── COMPONENTE 1 — Resumo cronológico ───────────────── */}
      <section aria-labelledby="closing-chrono">
        <h3 id="closing-chrono" className="ds-heading-large text-brand-otimath-darker mb-micro">
          1. Resumo cronológico do percurso
        </h3>
        <TextBlock
          paragraph={`<p class="ds-body">Você começou pela <strong>apresentação inicial</strong> e percorreu progressivamente a sistematização tabular do espaço amostral 6×6, a Corrida dos Carrinhos, os Eventos Complementares, a Fundamentação da União e os exercícios de aplicação até a revisão obrigatória do Ex6. Os indicadores discretos abaixo mostram quanto tempo você passou em cada bloco e como foi o desempenho em tentativas e erros — sem julgamento, apenas como espelho.</p>`}
          maxWidthParagraph="max-w-[820px]"
        />
        <div className="flex flex-col gap-y-xxs mt-micro">
          {visitedByBlock.length === 0 ? (
            <p className="ds-small italic text-neutral-dark">Nenhum percurso registrado nesta sessão.</p>
          ) : (
            visitedByBlock.map(([block, items]) => (
              <div key={block} className="flex flex-col gap-y-quarck p-micro rounded-md border-hairline border-neutral-lightest bg-neutral-white">
                <h4 className="ds-body-bold text-brand-otimath-darker">{BLOCK_TITLES[block]}</h4>
                <div className="flex flex-wrap gap-x-quarck gap-y-quarck">
                  {items.map((phase) => {
                    const perf = performanceByPhase[phase.id];
                    if (!perf) return null;
                    const ind = performanceIndicator(perf);
                    return (
                      <div
                        key={phase.id}
                        className="flex items-center gap-x-quarck p-quarck rounded-sm"
                        style={{ background: ind.bg, color: ind.color }}
                        title={`${phase.title} — ${perf.attempts} tentativas, ${perf.errors} erros, tempo ≈ ${formatElapsed(perf.elapsedMs)}.`}
                      >
                        <span className="ds-small-bold">{phase.shortLabel}</span>
                        <span className="ds-caption">· {ind.label}</span>
                        <span className="ds-caption">· {formatElapsed(perf.elapsedMs)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ───────────────── COMPONENTE 2 — Mapa dos conceitos exercitados ───────────────── */}
      <section aria-labelledby="closing-topics">
        <h3 id="closing-topics" className="ds-heading-large text-brand-otimath-darker mb-micro">
          2. Mapa dos conceitos exercitados (T1 a T8)
        </h3>
        <TextBlock
          paragraph={`<p class="ds-body">Cada tópico abaixo corresponde a uma faixa do mapa de conceitos de probabilidade do Ensino Médio (T1 a T8 do Mapa Dr. OtiMath, fundamentado em <strong>BATANERO et al. (2016)</strong> e na <strong>BNCC (BRASIL, 2018)</strong>). A profundidade indica como o tópico foi trabalhado: <em>introduzido</em> (apareceu em cena explicativa), <em>aplicado</em> (resolveu exercício), <em>revisado</em> (Ex6, Ex7 ou Ex8). Os tópicos T9 a T12 (probabilidade condicional, independência, árvore, total, Bayes) <strong>pertencem ao próximo OVA da sequência didática</strong>.</p>`}
          maxWidthParagraph="max-w-[820px]"
        />
        <ul className="flex flex-col gap-y-quarck mt-micro">
          {Object.entries(TOPIC_DESCRIPTIONS).map(([t, desc]) => {
            const cov = topicCoverage[t];
            const depths = cov ? Array.from(cov.depths) : [];
            const visited = depths.length > 0;
            return (
              <li
                key={t}
                className="flex items-start gap-x-micro p-quarck rounded-sm border-hairline border-neutral-lightest bg-neutral-white"
              >
                <span
                  className="ds-small-bold rounded-sm px-quarck"
                  style={{
                    background: visited
                      ? 'var(--color-feedback-success-lighter)'
                      : 'var(--color-neutral-lightest)',
                    color: visited
                      ? 'var(--color-feedback-success-darkest)'
                      : 'var(--color-neutral-dark)',
                  }}
                >
                  {t}
                </span>
                <div className="flex-1">
                  <p className="ds-small text-neutral-darkest">
                    <strong>{desc}</strong>
                  </p>
                  <p className="ds-caption text-neutral-dark">
                    {visited
                      ? `Profundidade: ${depths.join(' · ')}`
                      : 'Não exercitado neste OVA — pertence ao próximo OVA da sequência.'}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────────────── COMPONENTE 3 — Verbetes consultados ───────────────── */}
      <section aria-labelledby="closing-verbetes">
        <h3 id="closing-verbetes" className="ds-heading-large text-brand-otimath-darker mb-micro">
          3. Verbetes do Menu de Revisão consultados
        </h3>
        {glossaryConsultations.length === 0 ? (
          <p className="ds-small text-neutral-dark italic">
            Você não consultou o Menu de Revisão nesta sessão. Se estudar para uma avaliação,
            todos os verbetes continuam disponíveis pelo botão <strong>Ajuda</strong> do Ex6.
          </p>
        ) : (
          <ul className="flex flex-col gap-y-quarck">
            {glossaryConsultations.map((c) => (
              <li
                key={c.glossaryEntryId}
                className="flex items-center justify-between p-quarck rounded-sm border-hairline border-neutral-lightest bg-neutral-white"
              >
                <span className="ds-small text-neutral-darkest">
                  {glossaryTitleById[c.glossaryEntryId] ?? c.glossaryEntryId}
                </span>
                <span className="flex items-center gap-x-quarck">
                  <span className="ds-caption text-neutral-dark">
                    {c.count} {c.count === 1 ? 'consulta' : 'consultas'}
                  </span>
                  {c.glossaryEntryId === mostConsultedGlossaryEntryId && (
                    <span
                      className="ds-caption-bold rounded-sm px-quarck"
                      style={{
                        background: 'var(--color-feedback-warning-lighter)',
                        color: 'var(--color-feedback-warning-darkest)',
                      }}
                    >
                      ★ mais consultado
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ───────────────── COMPONENTE 5 (NOVO) — Vieses cognitivos detectados ───────────────── */}
      <section aria-labelledby="closing-biases">
        <h3 id="closing-biases" className="ds-heading-large text-brand-otimath-darker mb-micro">
          4. Vieses cognitivos identificados nos seus erros
        </h3>
        <TextBlock
          paragraph={`<p class="ds-body">A literatura científica em Educação Matemática mapeia vieses cognitivos típicos no aprendizado de probabilidade — formas sistemáticas de errar que aparecem em estudantes do mundo inteiro. O OVA detecta esses vieses heuristicamente, observando em quais tipos de step você errou. <strong>Não é diagnóstico clínico</strong> — é um instrumento de auto-percepção. Cada viés vem com a referência ABNT em versalete da literatura primária.</p>`}
          maxWidthParagraph="max-w-[820px]"
        />
        <div className="mt-micro">
          {biases.length === 0 ? (
            <p className="ds-small text-feedback-success-darkest italic">
              Nenhum viés cognitivo detectado a partir do padrão de erros desta sessão.
              Excelente trabalho na coordenação entre intuição e regra matemática.
            </p>
          ) : (
            <ul className="flex flex-col gap-y-quarck">
              {biases.map((b: BiasOccurrence, i: number) => (
                <li
                  key={`${b.code}-${b.name}-${i}`}
                  className="p-micro rounded-sm border-thin border-feedback-warning-darkest bg-feedback-warning-lighter"
                >
                  <div className="flex items-center justify-between gap-x-micro gap-y-nano flex-wrap">
                    <span className="ds-body-bold text-feedback-warning-darkest">
                      {b.code} — {b.name}
                    </span>
                    <span className="ds-caption-bold text-feedback-warning-darkest">
                      {b.occurrences}× detectado
                    </span>
                  </div>
                  <p className="ds-small text-feedback-warning-darkest mt-quarck">
                    {b.description}
                  </p>
                  <p className="ds-caption text-feedback-warning-darkest italic mt-quarck">
                    Referência: ({b.reference})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ───────────────── COMPONENTE 6 (NOVO) — Dificuldades ───────────────── */}
      <section aria-labelledby="closing-difficulties">
        <h3 id="closing-difficulties" className="ds-heading-large text-brand-otimath-darker mb-micro">
          5. Dificuldades de aprendizagem detectadas
        </h3>
        <TextBlock
          paragraph={
            biases.length === 0 && glossaryConsultations.length === 0
              ? `<p class="ds-body">Nenhuma dificuldade saliente foi detectada nesta sessão. Você atravessou o percurso sem padrão recorrente de erro nem necessidade de consultar o Menu de Revisão. Isso sugere que os conceitos T1 a T7 estão consolidados ao nível esperado pelo OVA.</p>`
              : `<p class="ds-body">A síntese a seguir combina os <strong>vieses detectados</strong> e os <strong>verbetes mais consultados</strong> para apontar — em linguagem operacional — as áreas em que pode valer a pena revisitar antes de uma avaliação ou ao iniciar o próximo OVA da sequência. Esta síntese segue o princípio de relevância contextual (<strong>MAYER, 2014, p. 280</strong>): apontar o que estudar, não apenas o que se errou.</p>`
          }
          maxWidthParagraph="max-w-[820px]"
        />
        {(biases.length > 0 || glossaryConsultations.length > 0) && (
          <ul className="ds-body text-neutral-darkest mt-micro pl-xxs">
            {biases.slice(0, 3).map((b) => (
              <li key={'diff-' + b.code} className="mb-quarck">
                Dificuldade com <strong>{b.name.toLowerCase()}</strong>: revise o(s) verbete(s) ligado(s) à operação correspondente no Menu de Revisão. ({b.reference})
              </li>
            ))}
            {glossaryConsultations.slice(0, 2).map((v) => (
              <li key={'diff-v-' + v.glossaryEntryId} className="mb-quarck">
                Você consultou <strong>{glossaryTitleById[v.glossaryEntryId] ?? v.glossaryEntryId}</strong> {v.count} {v.count === 1 ? 'vez' : 'vezes'} — vale revisitar o verbete ao estudar.
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ───────────────── COMPONENTE 7 (NOVO) — Desempenho por exercício ───────────────── */}
      <section aria-labelledby="closing-by-exercise">
        <h3 id="closing-by-exercise" className="ds-heading-large text-brand-otimath-darker mb-micro">
          6. Desempenho por exercício — habilidades operacionais e BNCC
        </h3>
        <TextBlock
          paragraph={`<p class="ds-body">Para cada exercício efetivamente realizado, o quadro a seguir indica as <strong>habilidades operacionais mobilizadas</strong> (o que você fez no exercício) e as <strong>habilidades da BNCC do Ensino Médio</strong> correspondentes. As habilidades BNCC seguem o <strong>Mapa de Tópicos do Protocolo Dr. OtiMath</strong> e <strong>BRASIL (2018)</strong>.</p>`}
          maxWidthParagraph="max-w-[820px]"
        />
        <div className="flex flex-col gap-y-xxs mt-micro">
          {PHASE_REGISTRY.filter((p) => performanceByPhase[p.id] && (p.abilities.length > 0 || p.bnccCodes.length > 0)).map((phase) => {
            const perf = performanceByPhase[phase.id];
            const ind = performanceIndicator(perf);
            return (
              <article
                key={'perf-' + phase.id}
                className="flex flex-col gap-y-quarck p-micro rounded-md border-hairline border-neutral-lightest bg-neutral-white"
                aria-labelledby={`perf-title-${phase.id}`}
              >
                <header className="flex items-center justify-between gap-x-micro gap-y-nano flex-wrap">
                  <h4 id={`perf-title-${phase.id}`} className="ds-body-bold text-brand-otimath-darker">
                    {phase.title}
                  </h4>
                  <span
                    className="ds-caption-bold rounded-sm px-quarck"
                    style={{ background: ind.bg, color: ind.color }}
                  >
                    {ind.label}
                  </span>
                </header>
                {phase.abilities.length > 0 && (
                  <div>
                    <p className="ds-caption-bold text-neutral-dark uppercase">Habilidades mobilizadas</p>
                    <ul className="ds-small text-neutral-darkest" style={{ paddingLeft: 18 }}>
                      {phase.abilities.map((a) => (
                        <li key={a} className="mb-quarck">
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {phase.bnccCodes.length > 0 && (
                  <div>
                    <p className="ds-caption-bold text-neutral-dark uppercase">Habilidades BNCC</p>
                    <ul className="ds-small text-neutral-darkest" style={{ paddingLeft: 18 }}>
                      {phase.bnccCodes.map((c) => (
                        <li key={c} className="mb-quarck">
                          <strong>{c}</strong>{' — '}
                          {BNCC_DESCRIPTIONS[c] ?? 'descrição não cadastrada'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="ds-caption text-neutral-dark italic">
                  Tempo na atividade: {formatElapsed(perf.elapsedMs)}
                  {' · '}tentativas: {perf.attempts}
                  {' · '}consultas ao Menu: {perf.studyMenuOpens}
                </p>
              </article>
            );
          })}
        </div>

        {bnccCovered.length > 0 && (
          <aside className="p-micro rounded-md border-hairline border-brand-otimath-light bg-brand-otimath-lightest mt-micro">
            <p className="ds-body-bold text-brand-otimath-darker mb-quarck">
              Habilidades BNCC consolidadas neste percurso
            </p>
            <p className="ds-small text-neutral-darkest">
              {bnccCovered.join(' · ')}
            </p>
          </aside>
        )}
      </section>

      {/* ───────────────── COMPONENTE 4 — Transição para o próximo OVA ───────────────── */}
      <section aria-labelledby="closing-next">
        <h3 id="closing-next" className="ds-heading-large text-brand-otimath-darker mb-micro">
          7. O que vem no próximo OVA da sequência didática
        </h3>
        <TextBlock
          paragraph={`<p class="ds-body">No próximo OVA você encontrará <strong>probabilidade condicional</strong> (P(A|B) — "qual a chance de A sabendo que B ocorreu"), <strong>eventos independentes</strong> (P(A∩B) = P(A)·P(B)), <strong>diagrama de árvore</strong> para experimentos com etapas sequenciais, <strong>retiradas com e sem reposição</strong> (urnas, cartas, bolas), <strong>Teorema da Probabilidade Total</strong> e <strong>Teorema de Bayes</strong>. Esses temas (T9 a T12 do Mapa Dr. OtiMath) constituem um bloco conceitual coeso que se apoia diretamente no que você acabou de exercitar — espaço amostral, eventos, equiprobabilidade, complementar e operações entre eventos.</p>`}
          maxWidthParagraph="max-w-[820px]"
        />
      </section>

      {/* ───────────────── AÇÕES ───────────────── */}
      <footer className="flex flex-wrap justify-center gap-x-micro gap-y-micro pt-micro border-t-hairline border-neutral-lightest">
        <Button style="secondary" size="medium" icon={<Download aria-hidden="true" />} onClick={downloadLog}>
          Baixar relatório (JSON)
        </Button>
        {onRestart && (
          <Button style="secondary" size="medium" icon={<RefreshCw aria-hidden="true" />} onClick={onRestart}>
            Refazer o OVA
          </Button>
        )}
        <a
          href={nextOvaHref}
          // CTA primário — mesma paleta e geometria do <Button style="primary">,
          // porém renderizado como <a> para navegação real (não JS).
          // Inclui transição, hover e focus ring para paridade de UX.
          className="ds-body-bold inline-flex items-center gap-x-quarck bg-brand-otimath-pure text-neutral-white rounded-md no-underline px-xxs py-macro transition-colors duration-200 hover:bg-brand-otimath-medium focus:outline-none focus:ring-2 focus:ring-brand-otimath-dark focus:ring-offset-2"
        >
          Ir para o próximo OVA da sequência
          <ArrowRight size={18} aria-hidden="true" />
        </a>
        {onConclude && (
          <Button style="primary" size="medium" onClick={onConclude}>
            Concluir
          </Button>
        )}
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TwoDicesProgressOverlay — Painel de Histórico ao Vivo
   ───────────────────────────────────────────────────────────────────
   Overlay sutil acessível por botão no canto sup. dir. do
   TwoDicesPresentation. Reutiliza a estrutura visual do StudyMenu
   (não importa, espelha) e mostra o estado atual do percurso:
     • cenas concluídas (check verde)
     • cena atual (indicador)
     • cenas a percorrer (acinzentadas)
   Princípio: visibilidade do estado do sistema (NIELSEN, 1994, h. 1).
   ═══════════════════════════════════════════════════════════════════ */

import { X } from 'lucide-react';

interface TwoDicesProgressOverlayProps {
  open: boolean;
  onClose: () => void;
  /** id da phase corrente (do Experiment ou cena 1–6 do Presentation). */
  currentPhaseId: string | null;
}

export function TwoDicesProgressOverlay({
  open,
  onClose,
  currentPhaseId,
}: TwoDicesProgressOverlayProps) {
  if (!open) return null;

  /* Estado de cada phase: 'done' | 'current' | 'pending'.
     Heurística: tudo antes do índice da phase atual no PHASE_REGISTRY
     é 'done'; a phase atual é 'current'; tudo depois é 'pending'.
     Phases não percorridas pelo log permanecem 'pending'. */
  const currentIdx = currentPhaseId
    ? PHASE_REGISTRY.findIndex((p) => p.id === currentPhaseId)
    : -1;

  const performance = getPhasePerformance();
  const visited = new Set(performance.map((p) => p.phase));

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-20 flex items-center justify-center bg-opacity-modal"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-overlay-title"
        className="bg-neutral-white rounded-md w-[calc(100%-32px)] max-w-[640px] max-h-[calc(100%-32px)] flex flex-col"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}
      >
        <div className="flex justify-between items-center p-xxxs border-b-hairline border-neutral-lightest">
          <h2 id="progress-overlay-title" className="ds-body-large-bold text-brand-otimath-pure">
            Onde você está no OVA
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar painel de histórico"
            className="p-quarck rounded-sm text-neutral-dark hover:text-brand-otimath-pure focus:outline-none focus:ring-2 focus:ring-brand-otimath-pure"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-xxs">
          <p className="ds-small text-neutral-dark mb-micro">
            Use este painel a qualquer momento para revisar quanto do percurso já completou
            e quanto falta. Os ícones em verde são as etapas concluídas; o indicador laranja
            é a etapa atual; as cinzas ainda estão por vir.
          </p>
          <ol className="flex flex-col gap-y-quarck">
            {PHASE_REGISTRY.map((phase, idx) => {
              const status =
                idx < currentIdx ? 'done' :
                idx === currentIdx ? 'current' :
                'pending';
              const wasVisited = visited.has(phase.id);
              const color =
                status === 'current'
                  ? 'var(--color-feedback-warning-darkest)'
                  : status === 'done' || wasVisited
                  ? 'var(--color-feedback-success-darkest)'
                  : 'var(--color-neutral-dark)';
              const bg =
                status === 'current'
                  ? 'var(--color-feedback-warning-lighter)'
                  : status === 'done' || wasVisited
                  ? 'var(--color-feedback-success-lighter)'
                  : 'var(--color-neutral-lightest)';
              return (
                <li
                  key={'progress-' + phase.id}
                  className="flex items-center gap-x-micro p-quarck rounded-sm"
                  style={{ background: bg, color }}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <span
                    aria-hidden="true"
                    className="ds-caption-bold"
                    style={{ minWidth: 18, textAlign: 'center' }}
                  >
                    {status === 'done' || wasVisited ? '✓' : status === 'current' ? '◉' : '○'}
                  </span>
                  <span className="ds-small flex-1">{phase.title}</span>
                  <span className="ds-caption">
                    {BLOCK_TITLES[phase.block]}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex justify-end p-xxxs border-t-hairline border-neutral-lightest">
          <Button style="primary" size="small" onClick={onClose}>
            Voltar ao OVA
          </Button>
        </div>
      </div>
    </div>
  );
}
