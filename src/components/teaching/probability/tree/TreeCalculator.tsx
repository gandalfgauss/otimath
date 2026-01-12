'use client';

import { Button } from "@/components/global/Button";
import { TextInput } from "@/components/global/TextInput";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback, useMemo, useRef} from "react";

interface TreeCalculatorProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export default function TreeCalculator({game, setGame}:Readonly<TreeCalculatorProps>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const calculationsResult = useMemo(() => {
      return game?.challenges[game.currentChallenge].problem.problemCalculations?.calculationsResult;
  }, [game]);

  const expression = useMemo(() => {
      return game?.challenges[game.currentChallenge].problem.problemCalculations?.calculationsResult?.value ?? '';
  }, [game]);

  const setExpression = useCallback((value: string) => {
    setGame(prevGame => {
      if(!prevGame) return prevGame;
      const newGame = { ...prevGame, challenges: [...prevGame.challenges] };
      const currentChallengeIndex = newGame.currentChallenge;
      const currentChallenge = {
        ...newGame.challenges[currentChallengeIndex],
        problem: {
          ...newGame.challenges[currentChallengeIndex].problem,
          problemCalculations: {
            ...newGame.challenges[currentChallengeIndex].problem.problemCalculations,
            calculationsResult: {
              ...newGame.challenges[currentChallengeIndex].problem.problemCalculations?.calculationsResult,
              value: value,
              disabled: newGame.challenges[currentChallengeIndex].problem.problemCalculations?.calculationsResult?.disabled ?? false,
              error: newGame.challenges[currentChallengeIndex].problem.problemCalculations?.calculationsResult?.error ?? false,
            }
          }
        }
      };
      newGame.challenges[currentChallengeIndex] = currentChallenge;
      return newGame;
    });
  }, [setGame]);

  const appendExpression = (value: string) => {
    setExpression(expression + value);
  };

  const clearExpression = () => {
    setExpression("");
  };

  const calculateExpression = () => {
    try {
      const sanitized = expression.replaceAll(',', '.');
      const result = new Function(`"use strict"; return (${sanitized})`)();
      if(result === Infinity || Number.isNaN(result)) {
        setExpression("Erro");
        return;
      }
      setExpression(String(result));
    } catch {
      setExpression("Erro");
    }
  };

  return (
    <div className="flex flex-col gap-y-macro">
      <TextInput textInput={{
        id:"TextInput_ExpressionResult",
        styles: "w-full",
        type: "text",
        value: expression,
        setValue: setExpression,
        disabled: calculationsResult?.disabled,
        error: calculationsResult?.error,
        getInputRef: (input) => {inputRef.current = input}
      }}/>

      <div className="grid grid-cols-4 gap-quarck items-center">
        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("(");
            inputRef.current?.focus();
          }}
        >
          (
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression(")");
            inputRef.current?.focus();
          }}
        >
          )
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            clearExpression();
            inputRef.current?.focus();
          }}
        >
          C
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("/");
            inputRef.current?.focus();
          }}
        >
          ÷
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("7");
            inputRef.current?.focus();
          }}
        >
          7
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("8");
            inputRef.current?.focus();
          }}
        >
          8
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("9");
            inputRef.current?.focus();
          }}
        >
          9
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("*");
            inputRef.current?.focus();
          }}
        >
          ×
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("4");
            inputRef.current?.focus();
          }}
        >
          4
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("5");
            inputRef.current?.focus();
          }}
        >
          5
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("6");
            inputRef.current?.focus();
          }}
        >
          6
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("-");
            inputRef.current?.focus();
          }}
        >
          −
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("1");
            inputRef.current?.focus();
          }}
        >
          1
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("2");
            inputRef.current?.focus();
          }}
        >
          2
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("3");
            inputRef.current?.focus();
          }}
        >
          3
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("+");
            inputRef.current?.focus();
          }}
        >
          +
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression("0");
            inputRef.current?.focus();
          }}
        >
          0
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            appendExpression(",");
            inputRef.current?.focus();
          }}
        >
          ,
        </Button>

        <Button
          disabled={calculationsResult?.disabled}
          additionalStyles="w-[50px]!"
          style="secondary"
          size="small"
          type="button"
          onClick={() => {
            calculateExpression();
            inputRef.current?.focus();
          }}
        >
          =
        </Button>

      </div>
    </div>
  );
}

/* Example 
<TreeCalculator />
*/