'use client';

/* ═══════════════════════════════════════════════════════════════════
   TwoDicesGameAdvanced — Componente do Exercício 8 (Fixação avançada)

   PROPÓSITO
     Renderiza o jogo completo do Ex8 (2 desafios simples + 4 compostos
     parametrizados via eventParametrization), com:
       • marcação sequencial A → B → D nos compostos (Opção i)
       • cores nítidas por evento (eventColors)
       • remoção progressiva de placeholders (hideIfUnchecked)
       • botão "Marcar todos!" com tooltip didático
       • StudyMenu integrado com feedback específico por step
       • cursor not-allowed e congelamento via TwoDicesTable

   ARQUITETURA
     Reusa 100% das primitivas visuais já existentes:
       TwoDicesTable, TwoDicesFormulation, Alerts, Modal, Button,
       TextBlock, StudyMenu — sem criar componentes globais novos.
   ═══════════════════════════════════════════════════════════════════ */

import React, { useCallback, useEffect, useMemo, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/global/Button';
import { Alerts } from '@/components/global/Alerts';
import { Modal } from '@/components/global/Modal';
import { TextBlock } from '@/components/global/TextBlock';
import { Check, X, ArrowRight, RefreshCw, CheckSquare, BookOpen } from 'lucide-react';
import { TwoDicesTable } from './TwoDicesTable';
import { TwoDicesFormulation } from './TwoDicesFormulation';
import { StudyMenu } from './shared/StudyMenu';
import {
  getSuggestedEntriesAdvanced,
  getFeedbackMessageAdvanced,
  type Ex8AdvancedStepKind,
  type AdvancedOperation,
  type GlossaryEntryId,
} from './shared/studyMenuContent';
import {
  useTwoDicesGameAdvancedHooks,
  type AdvancedStepKind,
} from '@/hooks/teaching/probability/two-dices/useTwoDicesGameAdvancedHooks';
import { logStudyMenuOpened } from '@/hooks/teaching/probability/two-dices/useTwoDicesLog';
import { useTelemetryExercise, telemetryRecordInteracaoExercicio } from '@/hooks/teaching/probability/useTelemetry';

export interface TwoDicesGameAdvancedHandle {
  getCurrentPhaseId: () => string;
  setCurrentPhaseId: (phaseId: string) => void;
}

interface TwoDicesGameAdvancedProps {
  /** Disparado quando o estudante conclui o último step do último desafio. */
  onGameFinished?: () => void;
  /** Emite snapshot JSON v2 pro pai (TwoDicesExperiment) persistir. */
  onPhaseChange?: (phaseId: string) => void;
  /** Snapshot pra restauração pós-F5 no mount. */
  initialPhaseSnapshot?: string;
}

export const TwoDicesGameAdvanced = forwardRef<TwoDicesGameAdvancedHandle, TwoDicesGameAdvancedProps>(function TwoDicesGameAdvanced(
  { onGameFinished, onPhaseChange, initialPhaseSnapshot }: Readonly<TwoDicesGameAdvancedProps>,
  ref,
) {
  const [studyMenuOpen, setStudyMenuOpen] = useState(false);
  const [lastErrorStep, setLastErrorStep] = useState<AdvancedStepKind | null>(null);
  const [pulseHelp, setPulseHelp] = useState(false);

  /* Inferimos a operação corrente a partir dos `activeEvents` (D existe nos
     compostos). Nos desafios simples, a operação é irrelevante para o
     feedback porque o step usa apenas verbetes não-operacionais. */
  const handleStepError = useCallback((stepKind: AdvancedStepKind) => {
    setLastErrorStep(stepKind);
  }, []);

  const {
    instructions,
    resetGameOnClick,
    disabledClearButton, dicesChecksClearOnClick,
    disabledCheckButton, checkOnClick,
    disabledNextStepButton, goToNextStepOnClick,
    activeEvents, eventsCheckboxes, updateEventsCheckboxes,
    operationSelectInputs, probabilitiesTextInputs,
    alerts, updateAlert, deleteAlerts,
    modal, updateModal,
    eventColors,
    hideIfUnchecked,
    markAllOnClick,
    disabledMarkAllButton,
    currentStepKind,
    challenge,
    step,
    restoreSnapshot,
    snapshotData,
  } = useTwoDicesGameAdvancedHooks({
    onStepError: handleStepError,
    onGameFinished,
  });

  // Snapshot JSON v2 — challenge + step + eventsCheckboxes.
  const snapshotPayload = JSON.stringify({ v: 2, ...snapshotData });
  useEffect(() => {
    onPhaseChange?.(snapshotPayload);
  }, [snapshotPayload, onPhaseChange]);

  const applyPhaseId = useCallback((phaseId: string) => {
    try {
      const obj = JSON.parse(phaseId);
      if (obj && typeof obj === 'object') {
        restoreSnapshot({
          challenge: typeof obj.challenge === 'number' ? obj.challenge : undefined,
          step: typeof obj.step === 'number' ? obj.step : undefined,
          eventsCheckboxes: obj.eventsCheckboxes && typeof obj.eventsCheckboxes === 'object' ? obj.eventsCheckboxes : undefined,
          setup: obj.setup && typeof obj.setup === 'object' ? obj.setup : undefined,
          probValues: obj.probValues && typeof obj.probValues === 'object' ? obj.probValues : undefined,
          selectValues: obj.selectValues && typeof obj.selectValues === 'object' ? obj.selectValues : undefined,
          disabledCheckButton: typeof obj.disabledCheckButton === 'boolean' ? obj.disabledCheckButton : undefined,
          disabledNextStepButton: typeof obj.disabledNextStepButton === 'boolean' ? obj.disabledNextStepButton : undefined,
          disabledClearButton: typeof obj.disabledClearButton === 'boolean' ? obj.disabledClearButton : undefined,
          probInputsDisabled: typeof obj.probInputsDisabled === 'boolean' ? obj.probInputsDisabled : undefined,
          selectInputsDisabled: typeof obj.selectInputsDisabled === 'boolean' ? obj.selectInputsDisabled : undefined,
        });
      }
    } catch { /* JSON inválido — ignora */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const didInitialRestoreRef = useRef(false);
  useEffect(() => {
    if (didInitialRestoreRef.current) return;
    didInitialRestoreRef.current = true;
    if (initialPhaseSnapshot) applyPhaseId(initialPhaseSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getCurrentPhaseId: () => snapshotPayload,
    setCurrentPhaseId: applyPhaseId,
  }), [snapshotPayload, applyPhaseId]);

  // Telemetria — Ex8: operações avançadas com eventos. Descrição
  // dinâmica refletindo o estado atual do aluno.
  const activeEventDescriptions = (activeEvents ?? [])
    .map((e, i) => `${e.name ?? `E${i + 1}`}: ${e.description}`)
    .join(' | ');
  const cellSummary = Object.entries(eventsCheckboxes ?? {})
    .map(([eventName, grid]) => {
      let count = 0;
      for (const row of grid) for (const cell of row) if (cell?.checked) count++;
      return count > 0 ? `${eventName}=${count}` : '';
    })
    .filter(Boolean)
    .join(' ');
  const fracSummary = (() => {
    const p = probabilitiesTextInputs;
    if (!p?.numerator?.value && !p?.denominator?.value) return '';
    return `P(${p.eventName ?? '?'})=${p.numerator?.value || '_'}/${p.denominator?.value || '_'}`;
  })();
  const selectSummary = (() => {
    const s = operationSelectInputs;
    if (!s?.eventsA?.value && !s?.operations?.value && !s?.eventsB?.value) return '';
    return `select(A=${s.eventsA?.value || '_'} op=${s.operations?.value || '_'} B=${s.eventsB?.value || '_'})`;
  })();
  const contextParts = [
    activeEventDescriptions && `eventos: [${activeEventDescriptions}]`,
    cellSummary && `marcações: ${cellSummary}`,
    fracSummary,
    selectSummary,
  ].filter(Boolean);
  // SEÇÃO POR (challenge, step) — vide TwoDicesGame.
  // Título dinâmico — inclui desafio + step + currentStepKind (mark-A,
  // mark-B, mark-D, prob, etc.) + evento(s) ativo(s) pra que a seção
  // telemétrica reflita a tela vista pelo aluno.
  const eventNamesAdv = (activeEvents ?? []).map(e => e.name ?? '?').join(', ');
  const dynamicTitleAdv = `Exercício 8 — Operações avançadas (Desafio ${challenge}, Step ${step}${currentStepKind ? ` — fase: ${currentStepKind}` : ''}${eventNamesAdv ? ` — eventos: ${eventNamesAdv}` : ''})`;
  // Instruções da tela atual — texto do enunciado/topo visível.
  const stripTextAdv = (raw: string, max: number): string => {
    const cleaned = (raw || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.length > max ? `${cleaned.slice(0, max)}…` : cleaned;
  };
  const screenTextAdv = stripTextAdv(instructions || '', 480);
  // Descrição literal de cada evento ativo (A, B, D quando presentes).
  const eventosBlocoEx8 = (activeEvents ?? []).length > 0
    ? (activeEvents ?? []).map(e => `Evento ${e.name ?? '?'}: "${e.description ?? '?'}"`).join(' | ')
    : '(nenhum evento ativo)';
  // O que está sendo calculado na fase atual baseado em currentStepKind.
  const oQueCalculaEx8 =
    currentStepKind === 'mark-A' ? 'Marcação das células favoráveis ao evento A (atômico) na tabela 6×6.'
    : currentStepKind === 'mark-B' ? 'Marcação das células favoráveis ao evento B (atômico) na tabela 6×6.'
    : currentStepKind === 'mark-D' ? 'Marcação das células favoráveis ao evento composto D = (A op B). O aluno precisa inferir a operação a partir do enunciado.'
    : currentStepKind === 'compute-probability' ? 'Cálculo de P(D) = n(D)/36 via definição clássica de Laplace, onde D é o evento composto.'
    : currentStepKind === 'compute-probability-and-complementary' ? 'Cálculo de P(D) e P(D̄) = 1 − P(D) (par complementar) para o evento composto D.'
    : currentStepKind === 'identify-operation' ? 'Identificação da operação (União / Interseção / Complementar / Diferença) que produz D a partir de A e B — escolha em select.'
    : `Fase ${currentStepKind ?? '?'} do Ex8.`;
  const fullDescricaoAdv = [
    screenTextAdv && `Tela: ${screenTextAdv}`,
    `Eventos do desafio atual: ${eventosBlocoEx8} | Espaço amostral: 36 pares ordenados`,
    `Ação atual do aluno / cálculo: ${oQueCalculaEx8}`,
    'Atividade global (Ex8): Aluno encadeia união, interseção e complementar em desafios variados, com acesso a glossário.',
    contextParts.length > 0 ? `[aluno ${contextParts.join('; ')}]` : '',
  ].filter(Boolean).join(' || ');
  useTelemetryExercise(
    `twoDices-cena7-twoDicesGameAdvanced-ex8-c${challenge}-s${step}`,
    dynamicTitleAdv,
    fullDescricaoAdv,
  );

  /* ──────────────────────────────────────────────────────────────
     PULSO DO BOTÃO AJUDA APÓS ERRO
     Princípio da sinalização (Mayer 2014, p. 285): após erro, o
     botão Ajuda chama atenção visualmente sem abrir automaticamente.
     ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!lastErrorStep) return;
    setPulseHelp(true);
    const t = setTimeout(() => setPulseHelp(false), 3000);
    return () => clearTimeout(t);
  }, [lastErrorStep]);

  /* Limpa marca de erro ao avançar de step (compara via currentStepKind). */
  useEffect(() => {
    setLastErrorStep(null);
  }, [currentStepKind]);

  /* ──────────────────────────────────────────────────────────────
     Inferência da operação corrente para sugestão de verbetes:
     usamos a presença/ausência de D em activeEvents e o evento D.name
     como indício. Como não temos acesso direto à `operation` do step,
     inferimos pela validação cruzada de D contra A e B nas 36 células.
     Se D = A ∪ B → "Union"; A ∩ B → "Intersection"; etc. Função pura.
     ─────────────────────────────────────────────────────────────── */
  const inferredOperation: AdvancedOperation = useMemo(() => {
    const D = activeEvents.find((e) => e.name === 'D');
    const A = activeEvents.find((e) => e.name === 'A');
    const B = activeEvents.find((e) => e.name === 'B');
    if (!D || !A || !B) return 'Union'; // fallback irrelevante (sem D na tela)

    let isUnion = true, isIntersection = true, isDifference = true, isReverse = true;
    for (let g = 1; g <= 6 && (isUnion || isIntersection || isDifference || isReverse); g++) {
      for (let b = 1; b <= 6 && (isUnion || isIntersection || isDifference || isReverse); b++) {
        const a = A.validation(g, b);
        const c = B.validation(g, b);
        const d = D.validation(g, b);
        if (d !== (a || c))   isUnion = false;
        if (d !== (a && c))   isIntersection = false;
        if (d !== (a && !c))  isDifference = false;
        if (d !== (!a && c))  isReverse = false;
      }
    }
    if (isUnion) return 'Union';
    if (isIntersection) return 'Intersection';
    if (isDifference) return 'Difference';
    if (isReverse) return 'ReverseDifference';
    return 'Union';
  }, [activeEvents]);

  const suggestedGlossaryEntryIds: readonly GlossaryEntryId[] = useMemo(() => {
    if (!lastErrorStep) return [];
    return getSuggestedEntriesAdvanced(
      lastErrorStep as Ex8AdvancedStepKind,
      inferredOperation,
    );
  }, [lastErrorStep, inferredOperation]);

  const feedbackMessage: string | null = useMemo(() => {
    if (!lastErrorStep) return null;
    return getFeedbackMessageAdvanced(
      lastErrorStep as Ex8AdvancedStepKind,
      inferredOperation,
    );
  }, [lastErrorStep, inferredOperation]);

  const initialGlossaryEntryId: GlossaryEntryId | undefined = suggestedGlossaryEntryIds[0];

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock
        paragraph={instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      />

      {feedbackMessage && (
        <div
          role="alert"
          className="p-micro rounded-sm border-thin border-feedback-warning-darkest bg-feedback-warning-lighter"
        >
          <p className="ds-small text-feedback-warning-darkest">{feedbackMessage}</p>
        </div>
      )}

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          {/* Barra de botões: `gap-y-micro` + `px-micro` evitam que os
              botões colem nas bordas da tela e fiquem grudados verticalmente
              quando quebram linha no mobile (Ex8 tem 4-5 botões aqui). */}
          <div className="flex items-center gap-x-xxxs gap-y-micro justify-between w-full max-w-[747px] flex-wrap px-micro">
            <Button style="secondary" size="small" icon={<RefreshCw aria-hidden="true" />} onClick={resetGameOnClick}>
              Novo
            </Button>
            <div className="flex items-center gap-x-xxxs gap-y-micro flex-wrap">
              <Button
                style="secondary"
                size="extra-small"
                icon={<BookOpen aria-hidden="true" />}
                onClick={() => {
                  telemetryRecordInteracaoExercicio(
                    `Ex8 — clicou em "Ajuda — Menu de Revisão" (Desafio ${challenge}, Step ${step}, fase ${currentStepKind ?? '?'}; último erro: ${lastErrorStep ?? 'nenhum'}) — abriu o modal de glossário/revisão`,
                  );
                  logStudyMenuOpened('unionExercise8', currentStepKind ?? '', initialGlossaryEntryId, lastErrorStep ?? undefined);
                  setStudyMenuOpen(true);
                }}
                ariaLabel="Abrir Menu de Revisão"
                additionalStyles={pulseHelp ? 'animate-pulse ring-2 ring-feedback-warning-darkest' : ''}
              >
                Ajuda — Menu de Revisão
              </Button>
              <span title="Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento.">
                <Button
                  style="borderless"
                  size="extra-small"
                  icon={<CheckSquare aria-hidden="true" />}
                  onClick={markAllOnClick}
                  disabled={disabledMarkAllButton}
                  ariaLabel="Marcar todos os casos do evento da sub-fase atual."
                >
                  Marcar todos!
                </Button>
              </span>
              <Button
                style="borderless"
                size="extra-small"
                icon={<X aria-hidden="true" />}
                onClick={dicesChecksClearOnClick}
                disabled={disabledClearButton}
              >
                Limpar
              </Button>
            </div>
          </div>

          <TwoDicesTable
            eventsCheckboxes={eventsCheckboxes ?? {}}
            updateEventsCheckboxes={updateEventsCheckboxes}
            eventColors={eventColors}
            hideIfUnchecked={hideIfUnchecked}
          />

          <div className="flex flex-wrap gap-x-xxxs gap-y-micro items-center justify-center px-micro">
            <Button
              style="secondary"
              size="small"
              icon={<Check aria-hidden="true" />}
              onClick={checkOnClick}
              disabled={disabledCheckButton}
            >
              Conferir
            </Button>
            <Button
              style="primary"
              size="small"
              icon={<ArrowRight aria-hidden="true" />}
              onClick={() => {
                telemetryRecordInteracaoExercicio(`clicou em "Próximo Desafio" (Ex8 — saindo do Desafio ${challenge}, Step ${step}${currentStepKind ? ', fase: ' + currentStepKind : ''})`);
                goToNextStepOnClick();
              }}
              disabled={disabledNextStepButton}
            >
              Próximo Desafio
            </Button>
          </div>
        </div>
        <TwoDicesFormulation
          events={activeEvents}
          textsInputs={probabilitiesTextInputs}
          selectInputs={operationSelectInputs}
          eventColors={eventColors}
        />
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts} />
        <Modal modal={modal} updateModal={updateModal} />
      </div>

      <StudyMenu
        open={studyMenuOpen}
        onClose={() => setStudyMenuOpen(false)}
        suggestedGlossaryEntryIds={suggestedGlossaryEntryIds}
        initialGlossaryEntryId={initialGlossaryEntryId}
      />
    </div>
  );
});
