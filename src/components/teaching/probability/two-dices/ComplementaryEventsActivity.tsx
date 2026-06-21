'use client';

/* ═══════════════════════════════════════════════════════════════
   ComplementaryEventsActivity — seção "Probabilidade de Eventos
   Complementares" do OVA Dois Dados.

   ARQUITETURA ESPELHA TwoDicesGame.tsx (layout 2 colunas, tabela
   + formulation, responsividade e UX idênticas).

   Adicionais pedagógicos (R0 obrigatório):
     • Passo 1 — hipótese registrada (SEM validação)
     • Passo strategyReview — confronto com a hipótese
     • Passo formalization — derivação de P(Ā) = 1 − P(A)

   Em R≥2 (treino): pula para marking → probabilities.
   ═══════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { useTelemetryExercise, telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';
import { Alerts } from '@/components/global/Alerts';
import { Modal } from '@/components/global/Modal';
import { TextBlock } from '@/components/global/TextBlock';
import { RefreshCw, Check, X, ArrowRight, Repeat2, BookOpen } from 'lucide-react';
import { TwoDicesTable } from './TwoDicesTable';
import { TwoDicesFormulation } from './TwoDicesFormulation';
import { ComplementaryReviewModal } from './shared/ComplementaryReviewModal';
import { BarA, BAR_A_CSS } from './shared/BarA';
import { useComplementaryEventsHooks } from '@/hooks/teaching/probability/two-dices/useComplementaryEventsHooks';
import { serializeComplementaryEventData, deserializeComplementaryEventData, type ComplementaryEventDataSerialized } from './shared/eventBank';

const COMPLEMENT_LABEL = 'Ā';
const A_LABEL = 'A';
const COLOR_COMPLEMENT = '#FF6A00';   // laranja queimado — Ā
const COLOR_A_MARK = '#0050FF';       // azul royal — A (marcação automática)

interface ComplementaryEventsActivityProps {
  onContinue: () => void;
  /** Notifica o pai (TwoDicesExperiment) quando a sub-fase muda — usado
   *  para o cenaId DEV refletir cada transição interna como snapshot. */
  onPhaseChange?: (phaseId: string) => void;
  /** Snapshot JSON v2 pra restauração pós-F5. Aplicado NO MOUNT do
   *  componente, antes do useEffect onPhaseChange disparar — evita a
   *  janela onde o hook montaria com defaults e seu emit sobrescreveria
   *  o JSON do banco no pai. Esse mecanismo substitui o caminho do
   *  setCurrentPhaseId via RAF (mais frágil em StrictMode). */
  initialPhaseSnapshot?: string;
}

// Handle exposto ao painel DEV para avançar pelas sub-fases internas
// (strategyChoice → marking → reveal → strategyReview → ... → complete).
export interface ComplementaryEventsActivityHandle {
  getCurrentPhaseId: () => string;
  advance: () => void;
  /** Restauração pós-F5 — parseia o `composedPhaseId` (formato:
   *  `formalization|step=N` ou sub-phase pura) e propaga pro hook. */
  setCurrentPhaseId: (phaseId: string) => void;
}

export const ComplementaryEventsActivity = forwardRef<
  ComplementaryEventsActivityHandle,
  ComplementaryEventsActivityProps
>(function ComplementaryEventsActivity({ onContinue, onPhaseChange, initialPhaseSnapshot }, ref) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const h = useComplementaryEventsHooks({ onContinue, isRestoringFromSnapshot: !!initialPhaseSnapshot });

  // Contexto dinâmico do aluno — sub-fase + escolhas registradas, pra
  // que o JSON da seção mostre QUE ESTRATÉGIA ele apostou primeiro,
  // que decisão tomou no confronto, frações que digitou, etc.
  const contextParts: string[] = [];
  if (h.subPhase) contextParts.push(`sub-fase: ${h.subPhase}`);
  if (h.strategyChoice) contextParts.push(`estratégia inicial: "${h.strategyChoice}"`);
  if (h.reviewChoice) contextParts.push(`decisão pós-confronto: ${h.reviewChoice === 'keep' ? 'manter' : 'mudar'}`);
  // Marcações resumidas por evento.
  const cellSummary = Object.entries(h.eventsCheckboxes ?? {})
    .map(([name, grid]) => {
      let n = 0; for (const row of grid) for (const cell of row) if (cell?.checked) n++;
      return n > 0 ? `${name}=${n}` : '';
    }).filter(Boolean).join(' ');
  if (cellSummary) contextParts.push(`marcações: ${cellSummary}`);
  // Fração principal digitada.
  const pp = h.probabilitiesTextInputs;
  if (pp?.numerator?.value || pp?.denominator?.value) {
    contextParts.push(`P(${pp.eventName ?? '?'})=${pp.numerator?.value || '_'}/${pp.denominator?.value || '_'}`);
  }
  // Computa o phaseId composto (inclui formStep durante a formalização) e
  // notifica o pai a cada mudança. Sem isso, o pai mantém scene7ExperimentPhase
  // em 'complementaryEvents' o tempo todo e o painel DEV não captura snapshots
  // das sub-fases internas — o contador não anda mesmo a seta funcionando.
  const composedPhaseId =
    h.subPhase === 'formalization' ? `formalization|step=${h.formStep}` : h.subPhase;
  // SEÇÃO POR SUB-FASE (+ formStep) — cada tela vira uma seção própria.
  // Mudou a fase → seção anterior é finalizada, exercícios não se misturam.
  // Título dinâmico — inclui a sub-fase pra refletir a tela específica.
  const subPhaseLabel = h.subPhase === 'strategyChoice' ? 'Escolha da estratégia'
                      : h.subPhase === 'marking' ? 'Marcação na tabela 6×6'
                      : h.subPhase === 'reveal' ? 'Revelação A ∪ Ā = Ω'
                      : h.subPhase === 'strategyReview' ? 'Confronto / revisão da estratégia'
                      : h.subPhase === 'computeComplementProb' ? 'Cálculo de P(Ā) pela definição clássica'
                      : h.subPhase === 'formalization' ? `Formalização P(Ā) = 1 − P(A) (passo ${h.formStep})`
                      : h.subPhase === 'probabilities' ? 'Cálculo final de P(A) = 1 − P(Ā)'
                      : h.subPhase === 'complete' ? 'Concluído'
                      : (h.subPhase || 'iniciando');
  // Instruções/texto da tela atual.
  const stripTextComp = (raw: string, max: number): string => {
    const cleaned = (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
  };
  const screenTextComp = stripTextComp(h.instructions || '', 480);
  // ─── Nomes dos eventos do problema ATUAL — sem isso, a coleta perdia
  // a descrição do evento A e do complementar Ā que o aluno está vendo
  // na tela. Cada rodada sorteia um par diferente, e quem ler o JSON
  // depois precisa saber qual evento está sendo trabalhado.
  const eventoADesc = h.data?.eventA?.description ?? '?';
  const eventoCompDesc = h.data?.eventComplement?.description ?? '?';
  const nA = h.data?.nA;
  const nE = h.data?.nE;
  const eventosBloco =
    `Evento A: "${eventoADesc}" (n(A) = ${nA ?? '?'} casos favoráveis) | ` +
    `Evento complementar Ā: "${eventoCompDesc}" (n(Ā) = ${nE ?? '?'} casos favoráveis) | ` +
    `Total de pares ordenados (espaço amostral Ω): 36`;
  // ─── O que está sendo CALCULADO em cada sub-fase ───
  const oQueCalcula =
    h.subPhase === 'strategyChoice' ? 'Decisão metacognitiva sobre o caminho: marcar A diretamente ou marcar Ā (mais rápido em eventos densos).'
    : h.subPhase === 'marking' ? (h.strategyChoice === COMPLEMENT_LABEL
        ? `Marcação dos ${nE ?? '?'} casos favoráveis a Ā (complementar) na tabela 6×6.`
        : `Marcação dos ${nA ?? '?'} casos favoráveis a A diretamente na tabela 6×6.`)
    : h.subPhase === 'reveal' ? 'Visualização da relação A ∪ Ā = Ω (universo): juntos cobrem TODAS as 36 células.'
    : h.subPhase === 'strategyReview' ? `Confronto: o aluno escolheu "${h.strategyChoice ?? '?'}". Agora decide se mantém ou muda essa estratégia.`
    : h.subPhase === 'computeComplementProb' ? `Cálculo: P(Ā) = n(Ā) / n(Ω) = ${nE ?? '?'} / 36 — definição clássica de Laplace aplicada ao complementar.`
    : h.subPhase === 'formalization' ? (() => {
        const stepDesc =
          h.formStep === 0 ? 'Passo 0 — Reconhecer que A e Ā cobrem Ω: P(A ∪ Ā) = P(Ω) = 1.'
          : h.formStep === 1 ? 'Passo 1 — Reconhecer que A e Ā são disjuntos: P(A ∪ Ā) = P(A) + P(Ā).'
          : h.formStep === 2 ? `Passo 2 — Substituir P(A ∪ Ā) por 1: 1 = P(A) + P(Ā).`
          : h.formStep === 3 ? 'Passo 3 — Substituir P(Ā) calculado pela definição clássica: 1 = P(A) + n(Ā)/36.'
          : h.formStep === 4 ? `Passo 4 — Isolar P(A): P(A) = 1 − P(Ā) = 1 − ${nE ?? '?'}/36 = ${(36 - (nE ?? 0))}/36.`
          : h.formStep === 5 ? `Passo 5 — Reduzir a fração ${(36 - (nE ?? 0))}/36 (se aplicável) e expressar P(A) na forma simplificada.`
          : `Passo ${h.formStep}`;
        return `Derivação algébrica da fórmula P(A) = 1 − P(Ā). ${stepDesc}`;
      })()
    : h.subPhase === 'probabilities' ? `Cálculo final do problema: P(A) = ? para o evento "${eventoADesc}". Esperado: P(A) = ${nA ?? '?'}/36.`
    : h.subPhase === 'complete' ? `Conclusão: P(A) = ${nA ?? '?'}/36 para o evento "${eventoADesc}".`
    : '';
  const fullDescricaoComp = [
    screenTextComp && `Tela: ${screenTextComp}`,
    eventosBloco,
    oQueCalcula && `Ação atual do aluno / cálculo: ${oQueCalcula}`,
    'Atividade global: aluno descobre P(A) + P(Ā) = 1 explorando casos na tabela 6×6 e formaliza P(Ā) = 1 − P(A).',
    contextParts.length > 0 ? `[aluno ${contextParts.join('; ')}]` : '',
  ].filter(Boolean).join(' || ');
  useTelemetryExercise(
    `twoDices-cena7-complementaryEvents-${composedPhaseId}`,
    `Eventos complementares — ${subPhaseLabel} — Evento A: "${eventoADesc}"`,
    fullDescricaoComp,
  );
  // Snapshot v2 COMPLETO do componente — inclui sub-fase, marcações da
  // tabela, estratégia, escolha pós-confronto, e TODOS os inputs de
  // fração da formalização (passos 0-5 + decimal/percent finais).
  const snapshotPayload = JSON.stringify({
    v: 2,
    composed: composedPhaseId,
    // Persiste o ComplementaryEventData REAL sorteado nesta rodada —
    // sem isso, F5 re-sorteava outro evento e o aluno via problema
    // diferente do que estava resolvendo.
    data: h.data ? serializeComplementaryEventData(h.data) : null,
    round: h.round,
    subPhase: h.subPhase,
    formStep: h.formStep,
    checkboxes: h.eventsCheckboxes,
    strategy: h.strategyChoice ?? '',
    reviewChoice: h.reviewChoice ?? null,
    formStep0Value: h.formStep0Value,
    formStep1Value: h.formStep1Value,
    formStep2Value: h.formStep2Value,
    formStep2DenValue: h.formStep2DenValue,
    formStep3NumValue: h.formStep3NumValue,
    formStep3DenValue: h.formStep3DenValue,
    formStep4NumValue: h.formStep4NumValue,
    formStep4DenValue: h.formStep4DenValue,
    formStep5NumValue: h.formStep5NumValue,
    formStep5DenValue: h.formStep5DenValue,
    formStep5Validated: h.formStep5Validated,
    formStep5Decimal: h.formStep5Decimal,
    formStep5Percent: h.formStep5Percent,
    // Persistência dos VALUES de probabilitiesTextInputs (sub-fase
    // computeComplementProb/probabilities). O objeto inteiro tem closures
    // `setValue` que não passam por JSON.stringify — extraímos só os
    // strings de valor; as closures são reconstruídas pelo restoreSnapshot.
    probNum: h.probabilitiesTextInputs?.numerator?.value ?? '',
    probDen: h.probabilitiesTextInputs?.denominator?.value ?? '',
    probCompNum: h.probabilitiesTextInputs?.complementaryNumerator?.value ?? '',
    probCompDen: h.probabilitiesTextInputs?.complementaryDenominator?.value ?? '',
  });
  useEffect(() => {
    // GUARD anti-overwrite: enquanto o `applyPhaseId(initialPhaseSnapshot)`
    // não rodou no mount, o `snapshotPayload` reflete state DEFAULT
    // (startRound zerou tudo). Emitir esse default sobrescreveria o
    // bom snapshot que o pai recebeu do banco — corrompendo a próxima
    // restauração caso o aluno dê F5 em sequência. Quando NÃO há
    // initialPhaseSnapshot (primeiro acesso à fase), emite normalmente.
    if (initialPhaseSnapshot && !didInitialRestoreRef.current) return;
    onPhaseChange?.(snapshotPayload);
  }, [snapshotPayload, onPhaseChange, initialPhaseSnapshot]);

  // Helper de restauração — usado tanto pelo setCurrentPhaseId (DevPanel)
  // quanto pelo initialPhaseSnapshot (pós-F5 via prop no mount).
  const applyPhaseId = useCallback((phaseId: string) => {
    // Fallback formato antigo: string única ('marking', 'formalization|step=2', etc).
    const applyComposedFallback = (composed: string) => {
      if (composed.startsWith('formalization|step=')) {
        const stepNum = parseInt(composed.slice('formalization|step='.length), 10);
        h.restoreSnapshot({ subPhase: 'formalization', formStep: Number.isFinite(stepNum) ? stepNum : 0 });
        return;
      }
      h.restoreSnapshot({ subPhase: composed as Parameters<typeof h.restoreSnapshot>[0]['subPhase'] });
    };
    try {
      const obj = JSON.parse(phaseId);
      if (obj && typeof obj === 'object') {
        // Formato v2: passa o objeto inteiro pro hook (todos os campos
        // opcionais são tratados internamente; campos extras são ignorados).
        h.restoreSnapshot({
          // Restaura o ComplementaryEventData REAL — reconstrói validation
          // como `(g,b) => E.has(...)` (closures não passam por JSON).
          data: obj.data && typeof obj.data === 'object'
            ? deserializeComplementaryEventData(obj.data as ComplementaryEventDataSerialized)
            : undefined,
          round: typeof obj.round === 'number' ? obj.round : undefined,
          subPhase: obj.subPhase ?? (typeof obj.composed === 'string' && !obj.composed.startsWith('formalization|') ? obj.composed as Parameters<typeof h.restoreSnapshot>[0]['subPhase'] : undefined),
          formStep: typeof obj.formStep === 'number' ? obj.formStep : undefined,
          eventsCheckboxes: obj.checkboxes && typeof obj.checkboxes === 'object' ? obj.checkboxes : undefined,
          strategyChoice: typeof obj.strategy === 'string' ? obj.strategy : undefined,
          reviewChoice: obj.reviewChoice === 'keep' || obj.reviewChoice === 'change' || obj.reviewChoice === null ? obj.reviewChoice : undefined,
          formStep0Value: typeof obj.formStep0Value === 'string' ? obj.formStep0Value : undefined,
          formStep1Value: typeof obj.formStep1Value === 'string' ? obj.formStep1Value : undefined,
          formStep2Value: typeof obj.formStep2Value === 'string' ? obj.formStep2Value : undefined,
          formStep2DenValue: typeof obj.formStep2DenValue === 'string' ? obj.formStep2DenValue : undefined,
          formStep3NumValue: typeof obj.formStep3NumValue === 'string' ? obj.formStep3NumValue : undefined,
          formStep3DenValue: typeof obj.formStep3DenValue === 'string' ? obj.formStep3DenValue : undefined,
          formStep4NumValue: typeof obj.formStep4NumValue === 'string' ? obj.formStep4NumValue : undefined,
          formStep4DenValue: typeof obj.formStep4DenValue === 'string' ? obj.formStep4DenValue : undefined,
          formStep5NumValue: typeof obj.formStep5NumValue === 'string' ? obj.formStep5NumValue : undefined,
          formStep5DenValue: typeof obj.formStep5DenValue === 'string' ? obj.formStep5DenValue : undefined,
          formStep5Validated: typeof obj.formStep5Validated === 'boolean' ? obj.formStep5Validated : undefined,
          formStep5Decimal: typeof obj.formStep5Decimal === 'string' ? obj.formStep5Decimal : undefined,
          formStep5Percent: typeof obj.formStep5Percent === 'string' ? obj.formStep5Percent : undefined,
          probNum: typeof obj.probNum === 'string' ? obj.probNum : undefined,
          probDen: typeof obj.probDen === 'string' ? obj.probDen : undefined,
          probCompNum: typeof obj.probCompNum === 'string' ? obj.probCompNum : undefined,
          probCompDen: typeof obj.probCompDen === 'string' ? obj.probCompDen : undefined,
        });
        return;
      }
    } catch { /* não é JSON — formato antigo */ }
    applyComposedFallback(phaseId);
  // h é estável (instância do hook); ok com lint.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aplica initialPhaseSnapshot UMA VEZ no mount — antes do useEffect
  // onPhaseChange disparar com defaults sobrescrevendo o JSON do banco
  // no pai. Sem isso, a janela entre mount-com-defaults e propagação
  // via RAF do pai era suscetível a races em StrictMode dev.
  const didInitialRestoreRef = useRef(false);
  useEffect(() => {
    if (didInitialRestoreRef.current) return;
    didInitialRestoreRef.current = true;
    if (initialPhaseSnapshot) applyPhaseId(initialPhaseSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => snapshotPayload,
    advance: () => h.devAdvance(),
    setCurrentPhaseId: applyPhaseId,
  }), [snapshotPayload, h, applyPhaseId]);

  // ─── Cores e rótulos customizados passados aos componentes ───
  const eventColors: Record<string, string> = {
    [A_LABEL]: COLOR_A_MARK,
    [COMPLEMENT_LABEL]: COLOR_COMPLEMENT,
  };
  const eventLabels: Record<string, React.ReactNode> = {
    [A_LABEL]: <span style={{ color: COLOR_A_MARK, fontWeight: 700 }}>A</span>,
    [COMPLEMENT_LABEL]: <BarA color={COLOR_COMPLEMENT} bold thickness={3} />,
  };

  // blinkLabel: durante reveal, segue a sequência Ā → A.
  const blinkLabel: string | null =
    h.revealPhase === 'blinkingRed' ? COMPLEMENT_LABEL
    : h.revealPhase === 'blinkingGreen' ? A_LABEL
    : null;

  // hideIfUnchecked: durante marking, NÃO oculta nada (aluno precisa ver Ā
  // em todas as células para poder marcar). A partir de reveal, oculta as
  // células unchecked para que cada uma mostre APENAS o evento ao qual
  // pertence (Ā XOR A — materializa a complementaridade mutuamente exclusiva).
  const hideIfUnchecked: string[] | undefined =
    h.subPhase === 'marking' ? undefined : [A_LABEL, COMPLEMENT_LABEL];

  // NOTA: removido o visibilityMask pós-Conferir em marking. Ocultar as
  // células não-Ā entregava a resposta (aluno completava pelas células que
  // restavam). Em marking, o aluno vê SEMPRE todas as 36 células com
  // placeholder Ā — a complementaridade só é revelada na sub-fase reveal,
  // após acertar tudo.

  // ─── Card do Passo 1 — strategyChoice ────────────────────────
  function renderStrategyCard() {
    if (h.subPhase !== 'strategyChoice') return null;
    const choice = h.strategyChoice;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: '2px solid transparent',
        }}
      >
        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Qual caminho será mais rápido?
        </p>
        <div className="flex flex-col gap-micro">
          <label className="flex items-center gap-micro cursor-pointer p-micro">
            <input
              type="radio"
              name="comp-strategy"
              checked={choice === A_LABEL}
              onChange={() => {
                telemetryRecordInteracaoExercicio('marcou estratégia: "Marcar diretamente os casos favoráveis ao evento A"');
                h.setStrategyChoice(A_LABEL);
              }}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">
              Marcar diretamente os casos favoráveis ao evento <strong>A</strong>.
            </span>
          </label>
          <label className="flex items-center gap-micro cursor-pointer p-micro">
            <input
              type="radio"
              name="comp-strategy"
              checked={choice === COMPLEMENT_LABEL}
              onChange={() => {
                telemetryRecordInteracaoExercicio('marcou estratégia: "Marcar os casos favoráveis ao evento complementar de A (Ā)"');
                h.setStrategyChoice(COMPLEMENT_LABEL);
              }}
              style={{ width: 18, height: 18, accentColor: COLOR_COMPLEMENT }}
            />
            <span className="ds-body">
              Marcar os casos favoráveis ao evento complementar de A{' '}
              (<BarA color={COLOR_COMPLEMENT} bold thickness={3} />).
            </span>
          </label>
        </div>
      </section>
    );
  }

  // ─── Card do Passo strategyReview — confronto ────────────────
  function renderStrategyReviewCard() {
    if (h.subPhase !== 'strategyReview') return null;
    const choice = h.strategyChoice;
    const reviewed = h.reviewChoice;
    const chooseLabel = choice === A_LABEL
      ? 'evento A (marcar os casos favoráveis ao evento A)'
      : 'complementar Ā (marcar os casos favoráveis ao complementar)';
    const chooseColor = choice === COMPLEMENT_LABEL ? COLOR_COMPLEMENT : 'var(--color-brand-otimath-pure)';
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: h.reviewError ? '2px solid var(--color-feedback-error-dark)' : '2px solid transparent',
        }}
      >
        {/* Escolha congelada */}
        <div className="mb-micro p-micro rounded-md" style={{ background: 'var(--color-neutral-white)', border: '1px solid var(--color-neutral-lighter)' }}>
          <p className="ds-caption-bold mb-nano text-neutral-dark">
            Sua escolha inicial foi:
          </p>
          <p className="ds-body" style={{ color: chooseColor, fontWeight: 700 }}>
            {chooseLabel}
          </p>
        </div>

        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Com o que você observou, você mantém ou muda sua escolha?
        </p>
        {/* Após o Conferir, h.confrontMessage é preenchida e a resposta
            do aluno fica congelada — sem isso, ele podia alternar entre
            "mantenho/mudo" depois do confronto e a UI ficava incoerente
            com a mensagem exibida. */}
        <div className="flex flex-col gap-micro">
          <label
            className="flex items-center gap-micro p-micro"
            style={{
              cursor: h.confrontMessage ? 'not-allowed' : 'pointer',
              opacity: h.confrontMessage && reviewed !== 'keep' ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="comp-review"
              checked={reviewed === 'keep'}
              disabled={!!h.confrontMessage}
              onChange={() => {
                telemetryRecordInteracaoExercicio(`marcou revisão: "Mantenho minha escolha" (escolha inicial: ${chooseLabel})`);
                h.setReviewChoice('keep');
              }}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">Mantenho minha escolha.</span>
          </label>
          <label
            className="flex items-center gap-micro p-micro"
            style={{
              cursor: h.confrontMessage ? 'not-allowed' : 'pointer',
              opacity: h.confrontMessage && reviewed !== 'change' ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name="comp-review"
              checked={reviewed === 'change'}
              disabled={!!h.confrontMessage}
              onChange={() => {
                telemetryRecordInteracaoExercicio(`marcou revisão: "Mudo minha escolha" (escolha inicial: ${chooseLabel})`);
                h.setReviewChoice('change');
              }}
              style={{ width: 18, height: 18, accentColor: 'var(--color-brand-otimath-pure)' }}
            />
            <span className="ds-body">Mudo minha escolha.</span>
          </label>
        </div>

        {/* Mensagem de confronto após Conferir */}
        {h.confrontMessage && (
          <div
            className="mt-micro p-micro rounded-md"
            style={{
              background: 'var(--color-feedback-success-lighter)',
              borderLeft: '4px solid var(--color-feedback-success-dark)',
            }}
          >
            <p
              className="ds-body"
              style={{ color: 'var(--color-feedback-success-darkest)' }}
              dangerouslySetInnerHTML={{ __html: h.confrontMessage }}
            />
          </div>
        )}
      </section>
    );
  }

  // ─── Card do Passo formalization — 3 microetapas ─────────────
  function renderFormalizationCard() {
    if (h.subPhase !== 'formalization') return null;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-brand-otimath-lightest)',
          border: '2px solid transparent',
        }}
      >
        <p className="ds-body-bold mb-micro text-brand-otimath-darkest">
          Vamos formalizar a relação entre P(A) e P(Ā)
        </p>

        {/* Step 0 — Identificar a união */}
        <div className="mb-micro p-micro rounded-md bg-neutral-white">
          <p className="ds-body mb-nano">
            Sendo <strong>S</strong> o espaço amostral do experimento e os eventos <strong>A</strong> e{' '}
            <strong>Ā</strong>, então:
          </p>
          {/* `A ∪ Ā =` + select agrupados em flex-nowrap interno —
              o pai (`flex-wrap`) só permite quebra ENTRE pares, nunca
              dentro de uma equação. */}
          <div className="flex items-center gap-micro flex-wrap">
            <div className="flex flex-nowrap items-center gap-x-nano">
              <span className="ds-body-bold whitespace-nowrap">A ∪ Ā =</span>
              <select
                value={h.formStep0Value}
                onChange={e => {
                  telemetryRecordInteracaoExercicio(`formalização passo 0 — trocou opção do select "A ∪ Ā = ?" para "${e.target.value || '(?)'}"`);
                  h.setFormStep0Value(e.target.value);
                }}
                disabled={h.formStep > 0}
              style={{
                padding: '6px 10px',
                fontSize: '1rem',
                fontWeight: 700,
                border: h.formStep0Error
                  ? '2px solid var(--color-feedback-error-dark)'
                  : '2px solid var(--color-neutral-lighter)',
                borderRadius: 6,
                background: h.formStep > 0 ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
                color: h.formStep > 0 ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-darkest)',
                minWidth: 70,
              }}
            >
                <option value="">?</option>
                <option value="S">S</option>
                <option value="A">A</option>
                <option value="Ā">Ā</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 1 — P(A) + P(Ā) = P(S) = ? */}
        {h.formStep >= 1 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Então <strong className="whitespace-nowrap">P(A) + P(Ā) = P(S)</strong>. Logo:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) + P(Ā) =</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={h.formStep1Value}
                  onChange={e => h.setFormStep1Value(e.target.value)}
                  disabled={h.formStep > 1}
                  placeholder="?"
                  style={{
                    width: 60,
                    padding: '6px 10px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    border: h.formStep1Error
                      ? '2px solid var(--color-feedback-error-dark)'
                      : '2px solid var(--color-neutral-lighter)',
                    borderRadius: 6,
                    background: h.formStep > 1 ? 'var(--color-neutral-lightest)' : 'var(--color-neutral-white)',
                    color: h.formStep > 1 ? 'var(--color-feedback-success-dark)' : 'var(--color-neutral-darkest)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Substitua 1 por 36/36. A fórmula explicita P(A) (a resposta
             do problema) em função de P(Ā) que já foi calculado no passo anterior. */}
        {h.formStep >= 2 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Temos <strong className="whitespace-nowrap">P(A) = 1 − P(Ā)</strong>. Substitua <strong>1</strong> pela fração equivalente
              com denominador igual ao tamanho do espaço amostral:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep2Value}
                    onChange={e => h.setFormStep2Value(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 2}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep2Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 2 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 2 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep2DenValue}
                    onChange={e => h.setFormStep2DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 2}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep2Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 2 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 2 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
                <span className="ds-body-bold whitespace-nowrap">− P(<BarA color="#FF6A00" bold thickness={3} />)</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Substituir P(Ā) pelo valor calculado anteriormente. */}
        {h.formStep >= 3 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">
              Substitua <strong className="whitespace-nowrap">P(<BarA color="#FF6A00" bold thickness={3} />)</strong>{' '}
              pelo valor que você calculou:
            </p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                {/* Fração 36/36 com barra HORIZONTAL (não "/"). */}
                <div className="flex flex-col items-center">
                  <span style={{ fontSize: '1rem', fontWeight: 700, padding: '4px 8px', minWidth: 40, textAlign: 'center' }}>36</span>
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <span style={{ fontSize: '1rem', fontWeight: 700, padding: '4px 8px', minWidth: 40, textAlign: 'center' }}>36</span>
                </div>
                <span className="ds-body-bold">−</span>
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep3NumValue}
                    onChange={e => h.setFormStep3NumValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 3}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep3Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 3 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 3 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep3DenValue}
                    onChange={e => h.setFormStep3DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 3}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep3Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 3 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 3 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4 — Resultado da subtração: P(A) = nA/36 (ou equivalente).
             Step 5 (quando formStep >= 5): adiciona "= [fração irredutível]"
             na MESMA linha. Após validar Step 5, também anexa "= decimal = percent". */}
        {h.formStep >= 4 && (
          <div className="mb-micro p-micro rounded-md bg-neutral-white">
            <p className="ds-body mb-nano">Calcule o resultado da subtração:</p>
            <div className="flex items-center gap-micro flex-wrap">
              <div className="flex items-center gap-x-nano">
                <span className="ds-body-bold whitespace-nowrap">P(A) =</span>
                {/* Primeira fração: resultado direto (nA/36 ou equivalente). */}
                <div className="flex flex-col items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep4NumValue}
                    onChange={e => h.setFormStep4NumValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 4}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep4Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 4 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 4 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                  <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={h.formStep4DenValue}
                    onChange={e => h.setFormStep4DenValue(e.target.value.replace(/\D/g, ''))}
                    disabled={h.formStep > 4}
                    placeholder="?"
                    style={{
                      width: 50,
                      padding: '4px 8px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: h.formStep4Error
                        ? '2px solid var(--color-feedback-error-dark)'
                        : '2px solid var(--color-neutral-lighter)',
                      borderRadius: 4,
                      color: h.formStep > 4 ? 'var(--color-feedback-success-dark)' : undefined,
                      background: h.formStep > 4 ? 'var(--color-neutral-lightest)' : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Step 5: forma irredutível. Aparece com "=" quando desbloqueado. */}
              {h.formStep >= 5 && (
                <>
                  <span className="ds-body-bold">=</span>
                  <div className="flex flex-col items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={h.formStep5NumValue}
                      onChange={e => h.setFormStep5NumValue(e.target.value.replace(/\D/g, ''))}
                      disabled={h.formStep5Validated}
                      placeholder="?"
                      style={{
                        width: 50,
                        padding: '4px 8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: h.formStep5Error
                          ? '2px solid var(--color-feedback-error-dark)'
                          : '2px solid var(--color-neutral-lighter)',
                        borderRadius: 4,
                        color: h.formStep5Validated ? 'var(--color-feedback-success-dark)' : undefined,
                        background: h.formStep5Validated ? 'var(--color-neutral-lightest)' : undefined,
                      }}
                    />
                    <div style={{ width: 50, height: 2, background: 'var(--color-neutral-dark)' }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={h.formStep5DenValue}
                      onChange={e => h.setFormStep5DenValue(e.target.value.replace(/\D/g, ''))}
                      disabled={h.formStep5Validated}
                      placeholder="?"
                      style={{
                        width: 50,
                        padding: '4px 8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        border: h.formStep5Error
                          ? '2px solid var(--color-feedback-error-dark)'
                          : '2px solid var(--color-neutral-lighter)',
                        borderRadius: 4,
                        color: h.formStep5Validated ? 'var(--color-feedback-success-dark)' : undefined,
                        background: h.formStep5Validated ? 'var(--color-neutral-lightest)' : undefined,
                      }}
                    />
                  </div>
                </>
              )}

              {/* Após validar a forma irredutível, exibe decimal e percentagem automaticamente. */}
              {h.formStep5Validated && (
                <>
                  <span className="ds-body-bold text-feedback-success-dark">
                    = {h.formStep5Decimal}
                  </span>
                  <span className="ds-body-bold text-feedback-success-dark">
                    = {h.formStep5Percent}
                  </span>
                </>
              )}
            </div>
            {h.formStep === 5 && !h.formStep5Validated && (
              <p className="ds-caption text-neutral-dark mt-nano italic">
                Escreva na forma irredutível: numerador e denominador sem divisores comuns.
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  // ─── Card de síntese ao final da rodada ──────────────────────
  function renderSynthesisCard() {
    if (h.subPhase !== 'complete' || !h.data) return null;
    return (
      <section
        className="rounded-md p-xxs w-full max-w-[747px] mx-auto"
        style={{
          background: 'var(--color-feedback-success-lighter)',
          borderLeft: '4px solid var(--color-feedback-success-dark)',
        }}
      >
        <p className="ds-body-bold mb-micro" style={{ color: 'var(--color-feedback-success-darkest)' }}>
          Síntese — heurística do complementar
        </p>
        <p className="ds-body text-neutral-darkest mb-micro">
          Marcar diretamente o evento A exigiria <strong>{h.data.nA} células</strong>. Calcular pelo
          complementar precisou apenas de <strong>{h.data.nE}</strong>.
        </p>
        <p className="ds-body text-neutral-darkest">
          Quando um evento tem <strong>muitos casos favoráveis</strong>, a estratégia <span className="whitespace-nowrap">P(A) = 1 − P(Ā)</span>{' '}
          <strong>economiza trabalho</strong>.
        </p>
      </section>
    );
  }

  // ─── Botões de progressão (após a rodada) ────────────────────
  function renderProgressionButtons() {
    if (h.subPhase !== 'complete') return null;
    const hasNext = !h.disabledNextStepButton;
    const hasTrain = !h.disabledTrainAgainButton;
    const hasContinue = !h.disabledContinueButton;
    if (!hasNext && !hasTrain && !hasContinue) return null;
    return (
      <div className="flex gap-xxxs items-center justify-center flex-wrap">
        {hasNext && (
          <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={h.goToNextStepOnClick}>
            Próximo Desafio
          </Button>
        )}
        {hasTrain && (
          <Button style="secondary" size="small" icon={<Repeat2 aria-hidden="true" />} onClick={h.trainAgainOnClick}>
            Treinar novamente
          </Button>
        )}
        {hasContinue && (
          <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={h.continueOnClick}>
            Continuar
          </Button>
        )}
      </div>
    );
  }

  // ─── Label do botão Conferir conforme sub-fase ──────────────
  const checkButtonLabel = h.subPhase === 'strategyChoice' ? 'Continuar' : 'Conferir';

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // Sub-fases que NÃO mostram a tabela (só painéis próprios)
  const hideTable = h.subPhase === 'strategyChoice';

  return (
    <div className="flex flex-col gap-y-xxs" id="complementary-events">
      {/* CSS global para a classe .ova-bar-a usada em strings HTML (instruções/confronto). */}
      <style>{BAR_A_CSS}</style>

      {/* Título + botão Revisão */}
      <div className="flex items-center justify-between flex-wrap gap-micro">
        <div>
          <p className="ds-overline text-brand-otimath-pure">
            Entre evento simples e união
          </p>
          <h2
            className="ds-heading-large"
            style={{ color: 'var(--color-brand-otimath-darkest)', margin: 0 }}
          >
            Eventos Complementares
          </h2>
        </div>
        <Button
          style="secondary"
          size="small"
          icon={<BookOpen aria-hidden="true" />}
          onClick={() => setReviewOpen(true)}
        >
          Revisão
        </Button>
      </div>

      {/* Instruções */}
      <TextBlock
        paragraph={h.instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      />

      {/* Card de estratégia (Passo 1) */}
      {renderStrategyCard()}

      {/* Layout principal — mostra tabela + formulation nas sub-fases que
           operam sobre o espaço amostral (marking, reveal, strategyReview,
           formalization, probabilities, complete). */}
      {!hideTable && (
        <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
          <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start lg:min-w-[760px]">
            <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
              <Button
                style="secondary"
                size="small"
                icon={<RefreshCw aria-hidden="true" />}
                onClick={h.resetGameOnClick}
              >
                Novo
              </Button>
              <Button
                style="borderless"
                size="extra-small"
                icon={<X aria-hidden="true" />}
                onClick={h.dicesChecksClearOnClick}
                disabled={h.disabledClearButton}
              >
                Limpar
              </Button>
            </div>

            <TwoDicesTable
              eventsCheckboxes={h.eventsCheckboxes ?? {}}
              updateEventsCheckboxes={h.updateEventsCheckboxes}
              eventColors={eventColors}
              eventLabels={eventLabels}
              blinkLabel={blinkLabel}
              hideIfUnchecked={hideIfUnchecked}
            />

            {/* Cards específicos de sub-fases (ficam entre tabela e Conferir) */}
            {renderStrategyReviewCard()}
            {renderFormalizationCard()}
            {renderSynthesisCard()}

            <div className="flex gap-xxxs items-center">
              {h.subPhase !== 'complete' && h.subPhase !== 'reveal' && (
                <Button
                  style="secondary"
                  size="small"
                  icon={h.subPhase === 'strategyReview' && h.confrontMessage ? <ArrowRight aria-hidden="true" /> : <Check aria-hidden="true" />}
                  onClick={h.checkOnClick}
                  disabled={h.disabledCheckButton}
                >
                  {h.subPhase === 'strategyReview' && h.confrontMessage
                    ? 'Entendi, continuar'
                    : 'Conferir'}
                </Button>
              )}
              {renderProgressionButtons()}
            </div>
          </div>

          <TwoDicesFormulation
            events={h.activeEvents}
            textsInputs={h.probabilitiesTextInputs}
            selectInputs={h.operationSelectInputs}
            eventColors={eventColors}
            eventLabels={eventLabels}
          />

        </div>
      )}

      {/* Strategy choice — sem tabela, só botão Continuar */}
      {hideTable && (
        <div className="flex justify-center mt-micro">
          <Button
            style="primary"
            size="small"
            icon={<ArrowRight aria-hidden="true" />}
            onClick={h.checkOnClick}
          >
            {checkButtonLabel}
          </Button>
        </div>
      )}

      {/* Alerts e Modal montados UMA ÚNICA VEZ no topo do componente.
          Antes ficavam dentro dos blocos {hideTable && ...} e {!hideTable && ...},
          o que desmontava o Modal quando o subPhase mudava de 'marking' para
          'strategyChoice' (após o aluno confirmar "Reiniciar seção"). O
          transitionend handler do close não chegava a disparar, então o
          updateModal({status:'hide'}) nunca rodava — e o Modal recém-montado
          no outro bloco abria de novo com status='show'. */}
      <Alerts alerts={h.alerts} updateAlert={h.updateAlert} deleteAlerts={h.deleteAlerts} />
      <Modal modal={h.modal} updateModal={h.updateModal} />

      {/* Modal de Revisão */}
      <ComplementaryReviewModal open={reviewOpen} onClose={() => setReviewOpen(false)} />
    </div>
  );
});
ComplementaryEventsActivity.displayName = 'ComplementaryEventsActivity';
