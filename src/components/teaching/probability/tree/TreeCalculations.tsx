import { SelectInput } from "@/components/global/SelectInput";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback, useMemo } from "react";
import TreeCalculator from "./TreeCalculator";


interface TreeCalculationsProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

type CalculationKey =
  | "calculationsEventA"
  | "calculationsEventB"
  | "calculationsOperation";

export function TreeCalculations({game, setGame}:Readonly<TreeCalculationsProps>) {
  const problem = useMemo(() => {
      return game?.challenges[game.currentChallenge].problem;
    }, [game]);

  const currentStep = useMemo(() => {
      return game?.challenges[game.currentChallenge].steps[game.currentStep];
    }, [game]);

  const eventsOptions = useMemo(() => {    
    return Array.from(
      new Map(
        game?.challenges[game.currentChallenge].problem.eventsTree
          .map(eventTree => ({
            label: eventTree.event.label
              ? eventTree.event.label
              : '',
            value: eventTree.event.description,
          }))
          .map(item => [item.value, item])
      ).values()
    ).slice(1);
  }, [game]);

  const setSelectInputValue = useCallback((value: string, selectInputItem: CalculationKey) => {
    setGame(prevGame => {
      if(!prevGame) return prevGame;

      return {
        ...prevGame,
        challenges: prevGame.challenges.map((challenge, index) => {
          if(prevGame.currentChallenge == index) {
            const currentSelect = challenge.problem[selectInputItem];

            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                [selectInputItem]: {
                  ...currentSelect,
                  value: value,
                  disabled: currentSelect?.disabled ?? false,
                  error: currentSelect?.error ?? false,
                }
              }
            }
          }

          return challenge;
        })
      }
    });
  }, [setGame]);

  return (
    <div className={`w-full rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1
      ${problem?.boardCalculationsDisabled ? 'opacity-level-intense' : ''}`}
    >
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Cálculos</h3>
      <div className={`flex flex-col flex-wrap gap-y-macro p-micro items-center justify-center
        overflow-auto [scrollbar-width:thin] snap-both snap-mandatory scroll-pt-micro
        min-h-[140px]
        transition-[opacity] duration-300 ease-in-out
        ${problem?.boardCalculationsDisabled ? 'opacity-0 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-quarck">
          <span>P(</span>
          {currentStep?.calculations?.eventA && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.calculationsEventA?.value,
              disabled: problem?.calculationsEventA?.disabled ,
              required: true,
              error: problem?.calculationsEventA?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventA")
              },
              options: eventsOptions
            }}
          /> }
          {currentStep?.calculations?.operation && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.calculationsOperation?.value,
              disabled: problem?.calculationsOperation?.disabled ,
              required: true,
              error: problem?.calculationsOperation?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsOperation")
              },
              options: problem?.calculationsOperation?.options
            }}
          />}
          {currentStep?.calculations?.eventB&& 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.calculationsEventB?.value,
              disabled: problem?.calculationsEventB?.disabled ,
              required: true,
              error: problem?.calculationsEventB?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventB")
              },
              options: eventsOptions
            }}
          />
          }
          <span>) =</span>
        </div>
        <TreeCalculator game={game} setGame={setGame}/>
      </div>
    </div>
  );
}

/* Example 
<TreeCalculations />
*/