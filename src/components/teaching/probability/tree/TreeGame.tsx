'use client'

import { Button } from "@/components/global/Button";
import { RefreshCw, Check, X, ArrowRight } from "lucide-react";
import { TextBlock } from "@/components/global/TextBlock";
import { useTreeHooks } from "@/hooks/teaching/probability/tree/useTreeHooks";

export function TreeGame() {
  const { 
    game
  } = useTreeHooks();

  return (
    <div className="flex flex-col gap-y-xxs">
       <TextBlock 
        paragraph={game?.challenges[game.currentChallenge].problem.description}
      ></TextBlock>

      <TextBlock 
        paragraph={game?.challenges[game.currentChallenge].steps[game.challenges[game.currentChallenge].currentStep].instructions}
     ></TextBlock>

      <div className="flex gap-x-xs gap-y-xs max-lg:flex-col-reverse">
        <div className="w-full flex flex-col gap-y-xxs max-lg:items-center max-sm:item-start">
          <div className="flex items-center gap-x-xxxs justify-between w-full max-w-[747px]">
            <Button style="secondary" size="small" icon={<RefreshCw />}>Novo</Button>
            <Button style="borderless" size="extra-small" icon={<X />}>Limpar</Button>
          </div>

          <div>Árvore aqui</div>
          
          <div className="flex gap-xxxs items-center">
            <Button style="secondary" size="small" icon={<Check />}>Conferir</Button>
            <Button style="primary" size="small" icon={<ArrowRight />} onClick={game?.gameFunctions?.goToNextChallengeOnClick}>Próximo Desafio</Button>
          </div>
        </div>
        <div>Menu Aqui</div>
      </div>
    </div>
  );
}


/* Example 

<TwoDicesGame />

*/