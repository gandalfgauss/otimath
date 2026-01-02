'use client'

import { RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/global/Button";
import { Alerts } from "@/components/global/Alerts";
import { TextBlock } from "@/components/global/TextBlock";
import { useTreeHooks } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { TreeMenu } from "./TreeMenu";
import { Tree } from "./Tree";
import { Modal } from "@/components/global/Modal";

export function TreeGame() {
  const { 
    game, setGame, alerts, updateAlert, deleteAlerts, modal, updateModal
  } = useTreeHooks();

  return (
    <div className="flex flex-col gap-y-xxs">
       <TextBlock 
        title={<h3 className="ds-heading-large">Problema:</h3>}
        paragraph={game?.challenges[game.currentChallenge].problem.description}
      ></TextBlock>

      <TextBlock 
        title={<h3 className="ds-heading-large">Enunciado:</h3>}
        paragraph={game?.challenges[game.currentChallenge].steps[game.currentStep].instructions}
      ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
            <Button style="secondary" size="small" icon={<RefreshCw />} onClick={game?.newGameButton?.onClick} disabled={game?.newGameButton?.disabled}>Novo</Button>
            <Button style="borderless" size="extra-small" icon={<X />} onClick={game?.clearButton?.onClick} disabled={game?.clearButton?.disabled}>Limpar</Button>
          </div>

          <Tree game={game} setGame={setGame} />
          
          <div className="flex gap-xxxs items-center">
            <Button style="secondary" size="small" icon={<Check />} onClick={game?.checkButton?.onClick} disabled={game?.checkButton?.disabled}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight />} onClick={game?.nextChallengeButton?.onClick} disabled={game?.nextChallengeButton?.disabled}>Próximo Desafio</Button>
          </div>
        </div>
        <TreeMenu game={game} setGame={setGame} />
        <Alerts alerts={alerts} updateAlert={updateAlert} deleteAlerts={deleteAlerts}/>
        <Modal modal={modal} updateModal={updateModal}/>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/