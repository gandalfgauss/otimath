import { Game, operationsOptions } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback } from "react";


interface ProbabilityHistoryProps {
  game: Game | null;
}

export function ProbabilityHistory({game}:Readonly<ProbabilityHistoryProps>) {
  const getOperationLabel = useCallback((value: string) => {
    const operation = operationsOptions.find(op => op.value === value);
    return operation ? operation.label : '';
  }, []);

  return (
    <div className={`p-micro ${game?.challenges[game?.currentChallenge]?.problem?.calculationsHistory?.length ?? 0 ? 'block' : 'hidden'}`}>
      <h3 className="ds-body-large-bold">Probabilidades Calculadas:</h3>
      <div className="flex flex-wrap gap-x-xs gap-y-xxxs p-micro max-h-[280px] overflow-auto [scrollbar-width:thin] snap-both snap-mandatory scroll-pt-micro">
        {game?.challenges[game.currentChallenge].problem.calculationsHistory?.map((calculation, index) => (
          <div key={index} className="ds-body-bold text-center snap-start bg-brand-otimath-lightest p-quarck rounded-md shadow-level-1 max-w-[150px] w-full">
            <span>P({calculation.eventA.label}{calculation.operation ? `${getOperationLabel(calculation.operation)}`: ''}{calculation.eventB?.label ? ` ${calculation.eventB?.label}`: ''})={calculation.result.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


/* Example 

<ProbabilityHistory />

*/