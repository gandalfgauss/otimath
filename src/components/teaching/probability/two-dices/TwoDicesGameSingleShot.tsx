'use client';

/* ═══════════════════════════════════════════════════════════════════
   TwoDicesGameSingleShot — adaptador single-shot do TwoDicesGame.

   PROPÓSITO
     Renderiza UMA ÚNICA RODADA de desafio (um par A,B + uma operação
     ∈ {Union, Intersection}) reusando 100% das primitivas visuais
     já existentes (TwoDicesTable, TwoDicesFormulation, Alerts, Modal),
     mas com motor de estado (useTwoDicesSingleShotHooks) que aplica
     R14 (validação de fração equivalente) em TODAS as etapas que
     envolvem fração.

   USO
     <TwoDicesGameSingleShot
       candidate={ex6Candidate}
       onChallengeFinished={() => avançarRodada()}
       onStepError={(step) => abrirAjudaSugerida(step)}
     />
   ═══════════════════════════════════════════════════════════════════ */

import React, { forwardRef, useImperativeHandle, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/global/Button';
import { Alerts } from '@/components/global/Alerts';
import { Modal } from '@/components/global/Modal';
import { TextBlock } from '@/components/global/TextBlock';
import { Check, X, ArrowRight, CheckSquare } from 'lucide-react';
import { TwoDicesTable } from './TwoDicesTable';
import { TwoDicesFormulation } from './TwoDicesFormulation';
import {
  useTwoDicesSingleShotHooks,
  type SingleShotStepKind,
} from '@/hooks/teaching/probability/two-dices/useTwoDicesSingleShotHooks';
import type { Ex6Candidate } from './shared/exercise6Challenges';

interface TwoDicesGameSingleShotProps {
  candidate: Ex6Candidate;
  onChallengeFinished: () => void;
  onStepError?: (stepKind: SingleShotStepKind) => void;
  /** Notifica o pai (UnionExercise6Review) a cada mudança de stepIndex/inputs.
   *  Permite o ex6 persistir o snapshot interno do single-shot pra F5. */
  onPhaseChange?: (phaseId: string) => void;
  /** Snapshot JSON v2 vindo do pai pra restaurar pós-F5. Aplicado no mount. */
  initialPhaseSnapshot?: string;
}

// Handle exposto ao painel DEV — permite avançar pelas 5 sub-fases internas
// (mark-A → mark-B → mark-D → identify-operation → compute-probability).
export interface TwoDicesGameSingleShotHandle {
  advance: () => void;
  getCurrentPhaseId: () => string;
  setCurrentPhaseId: (phaseId: string) => void;
}

export const TwoDicesGameSingleShot = forwardRef<TwoDicesGameSingleShotHandle, TwoDicesGameSingleShotProps>(
function TwoDicesGameSingleShot({
  candidate,
  onChallengeFinished,
  onStepError,
  onPhaseChange,
  initialPhaseSnapshot,
}: Readonly<TwoDicesGameSingleShotProps>, ref) {
  const {
    instructions,
    activeEvents,
    eventsCheckboxes,
    updateEventsCheckboxes,
    probabilitiesTextInputs,
    operationSelectInputs,
    disabledCheckButton,
    disabledNextStepButton,
    disabledClearButton,
    checkOnClick,
    goToNextStepOnClick,
    dicesChecksClearOnClick,
    alerts,
    updateAlert,
    deleteAlerts,
    modal,
    updateModal,
    eventColors,
    hideIfUnchecked,
    markAllOnClick,
    disabledMarkAllButton,
    devAdvance,
    restoreSnapshot,
    snapshotData,
  } = useTwoDicesSingleShotHooks({
    candidate,
    onChallengeFinished,
    onStepError,
  });

  const snapshotPayload = JSON.stringify({ v: 2, ...snapshotData });

  const applyPhaseId = useCallback((phaseId: string) => {
    try {
      const obj = JSON.parse(phaseId);
      if (obj && typeof obj === 'object') {
        restoreSnapshot({
          stepIndex: typeof obj.stepIndex === 'number' ? obj.stepIndex : undefined,
          eventsCheckboxes: obj.eventsCheckboxes && typeof obj.eventsCheckboxes === 'object' ? obj.eventsCheckboxes : undefined,
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

  useEffect(() => {
    if (initialPhaseSnapshot && !didInitialRestoreRef.current) return;
    onPhaseChange?.(snapshotPayload);
  }, [snapshotPayload, onPhaseChange, initialPhaseSnapshot]);

  useImperativeHandle(ref, () => ({
    advance: () => devAdvance(),
    getCurrentPhaseId: () => snapshotPayload,
    setCurrentPhaseId: applyPhaseId,
  }), [devAdvance, snapshotPayload, applyPhaseId]);

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock paragraph={instructions} maxWidthParagraph="max-w-[805px]" centralize={true} />

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          <div className="flex items-center gap-x-xxxs justify-end w-full max-w-[747px]">
            <span title="Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento.">
              <Button
                style="borderless"
                size="extra-small"
                icon={<CheckSquare aria-hidden="true" />}
                onClick={markAllOnClick}
                disabled={disabledMarkAllButton}
                ariaLabel="Marcar todos os casos: Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento."
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

          <TwoDicesTable
            eventsCheckboxes={eventsCheckboxes ?? {}}
            updateEventsCheckboxes={updateEventsCheckboxes}
            eventColors={eventColors}
            hideIfUnchecked={hideIfUnchecked}
          />

          <div className="flex gap-xxxs items-center">
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
              onClick={goToNextStepOnClick}
              disabled={disabledNextStepButton}
            >
              Próximo passo
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
    </div>
  );
});
TwoDicesGameSingleShot.displayName = 'TwoDicesGameSingleShot';
