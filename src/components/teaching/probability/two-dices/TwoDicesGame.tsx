'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { TwoDicesTable } from "./TwoDicesTable";
import { useTwoDicesHooks } from "@/hooks/teaching/probability/two-dices/useTwoDicesHooks";
import { Alerts } from "@/components/global/Alerts";
import { useAlerts } from "@/hooks/global/useAlerts";
import { Modal } from "@/components/global/Modal";
import { useModal } from "@/hooks/global/useModal";
import { TwoDicesFormulation } from "./TwoDicesFormulation";
import { TextBlock } from "@/components/global/TextBlock";
import { useState} from 'react';

export function TwoDicesGame() {
  const {alerts, createAlert, updateAlert, deleteAlerts} = useAlerts();
  const {modal, updateModal} = useModal();
  const [disableCheckButton, setDisableCheckButton] = useState(false);
  const [disableNextChallengeButton, setDisableNextChallengeButton] = useState(true);
  const [disableClearButton, setDisableClearButton] = useState(false);
  const { eventsCheckboxes, updateEventsCheckboxes, buildCheckboxesState, resetEventsCheckboxes, activeEvents, instructions, setInstructions, checkSolution, resetGame, nextChallenge, isGameOver, probabilitiesTextInputs, finishedTheChallenge, disabledProbabilitiesTextInputs, getTypeOfVerify} = useTwoDicesHooks();
  
  const dicesChecksClearOnClick = () => { 
    updateModal({
        title: "Limpando marcações", 
        description:"Você gostaria de limpar as marcações da atividade atual?", 
        status: "show",
        confirmCallback: () => {
          createAlert("Dados limpos", "Todas as marcações foram limpas", "info");
          resetEventsCheckboxes();
          setDisableNextChallengeButton(true);
        }
    });
  }

  const checkProblemSolutionOnClick = () => {
    if(checkSolution()) {
      createAlert("Parabéns!", "Você acertou!", "success", 5000);
      setDisableCheckButton(true);
      setDisableClearButton(true);

      if(isGameOver()) {
        setInstructions("<p className='ds-body'>Parabéns, você finalizou todos os desafios!</p>");
        setDisableNextChallengeButton(true);
        disabledProbabilitiesTextInputs();
        buildCheckboxesState();

      } else {
        if(finishedTheChallenge()) {
          setDisableNextChallengeButton(false);
          setInstructions("<p className='ds-body'>Parabéns, passe para o próximo desafio!</p>");
          disabledProbabilitiesTextInputs();
          buildCheckboxesState();
        }
        else {
          goToNextChallengeOnClick();
        }
      }
    }
    else {
      createAlert("Ops!", "Você errou!", "error", 4000);
    }
  }

  const goToNextChallengeOnClick = () => {
    if(getTypeOfVerify() === "checkbox") {
      setDisableClearButton(true);
    } else {
      setDisableClearButton(false);
    }
    setDisableCheckButton(false);
    setDisableNextChallengeButton(true);

    const checkType = nextChallenge();
    if(checkType === "checkbox") {
      setDisableClearButton(false);
    } else {
      setDisableClearButton(true);
    }
  }

  const resetGameOnClick = () => {
    updateModal({
        title: "Reiniciando o jogo", 
        description:"Você gostaria de reiniciar o jogo?", 
        status: "show",
        confirmCallback: () => {
          createAlert("Jogo reiniciado", "O jogo foi reiniciado", "info");
          resetGame();
          setDisableCheckButton(false);
          setDisableNextChallengeButton(true);
          setDisableClearButton(false);
        }
    });
  }

  return (
    <div className="flex flex-col gap-y-xxs">
      <TextBlock 
        paragraph={instructions}
        maxWidthParagraph="max-w-[805px]"
        centralize={true}
      ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
            <Button style="secondary" size="small" icon={<RefreshCw />} onClick={resetGameOnClick}>Novo</Button>
            <Button style="borderless" size="extra-small" icon={<X />} onClick={dicesChecksClearOnClick} disabled={disableClearButton}>Limpar</Button>
          </div>

          <TwoDicesTable eventsCheckboxes={eventsCheckboxes ?? {}} updateEventsCheckboxes={updateEventsCheckboxes}/>
          
          <div className="flex gap-xxxs items-center">
            <Button style="secondary" size="small" icon={<Check />} onClick={checkProblemSolutionOnClick} disabled={disableCheckButton}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight />} onClick={goToNextChallengeOnClick} disabled={disableNextChallengeButton}>Próximo Desafio</Button>
          </div>
        </div>
        <TwoDicesFormulation events={activeEvents} textsInputs={probabilitiesTextInputs}/>
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
        <Modal modal={modal} updateModal={updateModal}/>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/