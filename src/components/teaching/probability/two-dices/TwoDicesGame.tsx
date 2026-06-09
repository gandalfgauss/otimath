'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X, ArrowRight, CheckSquare } from "lucide-react";
import { useTelemetryExercise } from "@/hooks/teaching/probability/useTelemetry";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { Alerts } from "@/components/global/Alerts";
import { Modal } from "@/components/global/Modal";
import { TwoDicesFormulation } from "./TwoDicesFormulation";
import { TextBlock } from "@/components/global/TextBlock";

interface TwoDicesGameProps {
  /** Quando true, exibe o botão "Marcar todos!" ao lado de "Limpar".
   *  Default false — preserva comportamento original da seção introdutória.
   *  Usado pelo Ex7 (Exercícios de Fixação) onde a estratégia "marcar tudo
   *  e desmarcar não-favoráveis" é útil para eventos com cardinalidade alta. */
  enableMarkAll?: boolean;
}

export function TwoDicesGame({ enableMarkAll = false }: Readonly<TwoDicesGameProps> = {}) {
  // Telemetria — Ex7: jogo livre com a tabela 6×6 (eventos pré-definidos
  // ou modo "marcar tudo"). `enableMarkAll=true` em Ex7 (exercícios de
  // fixação); `false` na seção introdutória da Cena 7.
  useTelemetryExercise(
    enableMarkAll ? 'twoDices-cena7-twoDicesGame-ex7' : 'twoDices-cena7-twoDicesGame-intro',
    enableMarkAll
      ? 'Exercício 7 — Marcação livre da tabela 6×6 (fixação)'
      : 'Apresentação da tabela 6×6 — primeira marcação',
    'Aluno marca células favoráveis a um evento sorteado e identifica P(A) via Laplace.',
  );
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
    markAllOnClick,
  } = useTwoDicesHooks();

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock 
        paragraph={instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          {/* Barra de botões: `gap-y-micro` pra respiro vertical quando
              quebra linha no mobile. `flex-wrap` permite quebra; antes ficava
              sem espaço entre as linhas e os botões se colavam. `px-micro`
              evita os botões encostarem nas bordas da viewport. */}
          <div className="flex flex-wrap items-center gap-x-xxxs gap-y-micro justify-between w-full max-w-[747px] px-micro">
            <Button style="secondary" size="small" icon={<RefreshCw aria-hidden="true" />} onClick={resetGameOnClick}>Novo</Button>
            <div className="flex flex-wrap items-center gap-x-xxxs gap-y-micro">
              {enableMarkAll && (
                <span title="Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento.">
                  <Button
                    style="borderless"
                    size="extra-small"
                    icon={<CheckSquare aria-hidden="true" />}
                    onClick={markAllOnClick}
                    disabled={disabledClearButton}
                    ariaLabel="Marcar todos os casos: Para eventos com número grande de casos favoráveis é mais fácil usar esse recurso e desmarcar os casos não favoráveis ao evento."
                  >
                    Marcar todos!
                  </Button>
                </span>
              )}
              <Button style="borderless" size="extra-small" icon={<X aria-hidden="true" />} onClick={dicesChecksClearOnClick} disabled={disabledClearButton}>Limpar</Button>
            </div>
          </div>

          <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>

          <div className="flex flex-wrap gap-x-xxxs gap-y-micro items-center justify-center px-micro">
            <Button style="secondary" size="small" icon={<Check aria-hidden="true" />} onClick={checkOnClick} disabled={disabledCheckButton}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight aria-hidden="true" />} onClick={goToNextStepOnClick} disabled={disabledNextStepButton}>Próximo Desafio</Button>
          </div>
        </div>
        <TwoDicesFormulation events={activeEvents} textsInputs={probabilitiesTextInputs} selectInputs={operationSelectInputs}/>
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
        <Modal modal={modal} updateModal={updateModal}/>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/