import { SelectInput } from "@/components/global/SelectInput";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback, useMemo} from "react";
import TreeCalculator from "./TreeCalculator";


interface TreeCalculationsProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

type CalculationKey =
  | "calculationsEventA"
  | "calculationsOperationA"
  | "calculationsEventB"
  | "calculationsOperationB"
  | "calculationsEventC"
  | "calculationsOperationC"
  | "calculationsEventD";

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
            const currentSelect = challenge.problem.problemCalculations?.[selectInputItem];

            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                problemCalculations: {
                  ...challenge.problem.problemCalculations,
                  [selectInputItem]: {
                    ...currentSelect,
                    value: value,
                    disabled: currentSelect?.disabled ?? false,
                    error: currentSelect?.error ?? false,
                  }
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
        <div className="flex flex-wrap items-center gap-quarck">
          <span>P(</span>
          {currentStep?.calculations?.eventA && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsEventA?.value,
              disabled: problem?.problemCalculations?.calculationsEventA?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsEventA?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventA")
              },
              options: eventsOptions
            }}
          /> }
          {currentStep?.calculations?.operationA && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsOperationA?.value,
              disabled: problem?.problemCalculations?.calculationsOperationA?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsOperationA?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsOperationA")
              },
              options: problem?.problemCalculations?.calculationsOperationA?.options
            }}
          />}
          {currentStep?.calculations?.eventB && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsEventB?.value,
              disabled: problem?.problemCalculations?.calculationsEventB?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsEventB?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventB")
              },
              options: eventsOptions
            }}
          />
          }
          {currentStep?.calculations?.operationB && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsOperationB?.value,
              disabled: problem?.problemCalculations?.calculationsOperationB?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsOperationB?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsOperationB")
              },
              options: problem?.problemCalculations?.calculationsOperationB?.options
            }}
          />}
          {currentStep?.calculations?.eventC && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsEventC?.value,
              disabled: problem?.problemCalculations?.calculationsEventC?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsEventC?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventC")
              },
              options: eventsOptions
            }}
          />
          }
          {currentStep?.calculations?.operationC && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsOperationC?.value,
              disabled: problem?.problemCalculations?.calculationsOperationC?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsOperationC?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsOperationC")
              },
              options: problem?.problemCalculations?.calculationsOperationC?.options
            }}
          />}
          {currentStep?.calculations?.eventD && 
          <SelectInput
            selectInput={{ 
              styles: "w-[50px] h-[40px] text-center",
              placeholder: " ",
              value: problem?.problemCalculations?.calculationsEventD?.value,
              disabled: problem?.problemCalculations?.calculationsEventD?.disabled ,
              required: true,
              error: problem?.problemCalculations?.calculationsEventD?.error,
              setValue: (value: string) => {
                setSelectInputValue(value, "calculationsEventD")
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