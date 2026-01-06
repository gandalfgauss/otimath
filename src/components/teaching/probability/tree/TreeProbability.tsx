import { Button } from "@/components/global/Button";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback, useMemo } from "react";


interface TreeProbabilityProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export function TreeProbability({game, setGame}:Readonly<TreeProbabilityProps>) {
  const probabilities = useMemo(() => {
    if (!game) return [];
    return game.challenges[game.currentChallenge].problem.probabilitiesToAssemble;
  }, [game]);

  const boardProbabilityDisabled = useMemo(() => {
    if (!game) return [];
    return game.challenges[game.currentChallenge].problem.boardProbabilityDisabled;
  }, [game]);

  const probabilityOnClick = useCallback((index: number) => {
    setGame((prevGame) => {
      if (!prevGame) return prevGame;

      const newGame = { ...prevGame, challenges: [...prevGame.challenges] };

      const currentChallengeIndex = newGame.currentChallenge;
      const currentChallenge = {
        ...newGame.challenges[currentChallengeIndex],
      };

      const currentProblem = {
        ...currentChallenge.problem,
        eventsTree: [...currentChallenge.problem.eventsTree],
        probabilitiesToAssemble: [...currentChallenge.problem.probabilitiesToAssemble],
      };

      const probabilityChosen = currentProblem.probabilitiesToAssemble[index];
      const eventTreeChosenIndex = currentProblem.eventsTree.findIndex(eventTree => eventTree.probability?.selected);
      const eventTreeChosen = currentProblem.eventsTree[eventTreeChosenIndex];

      if(eventTreeChosen) {
        currentProblem.eventsTree[currentProblem.eventsTree.indexOf(eventTreeChosen)] = {
          ...eventTreeChosen,
          probability: {
            ...eventTreeChosen.probability,
            probabilityText: probabilityChosen.probabilityText,
            probabilityOfOccurring: probabilityChosen.probabilityOfOccurring,
            selected: false,
          }
        }
      } else {
        currentProblem.probabilitiesToAssemble = currentProblem.probabilitiesToAssemble.map((probability, indexProbability) => {
          if(index == indexProbability) {
             return {
              ...probability,
              selected: !probability.selected
            }
          }

          return {
            ...probability,
            selected: false
          }
        });
      }

      currentChallenge.problem = currentProblem;
      newGame.challenges[currentChallengeIndex] = currentChallenge;

      return newGame;
    });
  }, [setGame]);

  return (
    <div className="w-full
      rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Probabilidades</h3>
      <div className={`flex flex-wrap gap-macro p-micro items-center justify-center
        overflow-auto [scrollbar-width:thin] snap-both snap-mandatory scroll-pt-micro
        min-h-[140px]
        transition-[opacity] duration-300 ease-in-out
        ${boardProbabilityDisabled ? 'opacity-0 pointer-events-none' : ''}`}
      >
        {probabilities?.map((probability, index) => {
          return ( probability.show &&
            <Button 
              style="secondary" 
              size="small"
              key={index}
              disabled={probability.disabled}
              type="button"
              additionalStyles={`text-neutral-dark hover:text-neutral-dark ${probability.selected ? '!bg-brand-otimath-lightest !border-brand-otimath-pure !text-brand-otimath-pure' : ' bg-neutral-lightest border-neutral-lighter hover:!border-neutral-medium'}`}
              onClick={() => probabilityOnClick(index)}
            > 
              {probability.probabilityText}
            </Button>
          )
        })}
      </div>
    </div>
  );
}

/* Example 
<TreeEvents />
*/