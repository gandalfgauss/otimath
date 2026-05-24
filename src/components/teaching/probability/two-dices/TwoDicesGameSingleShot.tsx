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

import React, { forwardRef, useImperativeHandle } from 'react';
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
}

// Handle exposto ao painel DEV — permite avançar pelas 5 sub-fases internas
// (mark-A → mark-B → mark-D → identify-operation → compute-probability).
export interface TwoDicesGameSingleShotHandle {
  advance: () => void;
}

export const TwoDicesGameSingleShot = forwardRef<TwoDicesGameSingleShotHandle, TwoDicesGameSingleShotProps>(
function TwoDicesGameSingleShot({
  candidate,
  onChallengeFinished,
  onStepError,
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
  } = useTwoDicesSingleShotHooks({
    candidate,
    onChallengeFinished,
    onStepError,
  });

  useImperativeHandle(ref, () => ({
    advance: () => devAdvance(),
  }), [devAdvance]);

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
