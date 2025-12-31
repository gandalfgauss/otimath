import { Checkbox } from "@/components/global/Checkbox";
import { TextInput } from "@/components/global/TextInput";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { useCallback } from "react";

interface TreeEventsProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export function TreeEvents({game, setGame}:Readonly<TreeEventsProps>) {
  const events = game?.challenges[game.currentChallenge].problem.eventOptions;

  const setTextInputFocus = useCallback((index: number, focused: boolean) => {
    setGame((prevGame) => {
      if (!prevGame) return prevGame;

      const newGame = { ...prevGame,
        challenges: prevGame.challenges.map((challenge, challengeIndex) => {
          if (challengeIndex === prevGame.currentChallenge) {
            const updatedEvents = challenge.problem.eventOptions.map((event, eventIndex) => {
              if (eventIndex === index) {
                return { ...event, inputIsFocused: focused };
              }
              return event;
            });
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                eventOptions: updatedEvents
              }
            };
          }
          return challenge;
        })
      };
      
      return newGame;
    });
  },[setGame]);
    
  const setTextInputValue = useCallback((index: number, value: string) => {
    setGame((prevGame) => {
      if (!prevGame) return prevGame;

      const newGame = { ...prevGame,
        challenges: prevGame.challenges.map((challenge, challengeIndex) => {
          if (challengeIndex === prevGame.currentChallenge) {
            const updatedEvents = challenge.problem.eventOptions.map((event, eventIndex) => {
              if (eventIndex === index) {
                return { ...event, label: value };
              }
              return event;
            });
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                eventOptions: updatedEvents
              }
            };
          }
          return challenge;
        })
      };
      
      return newGame;
    });
  },[setGame]);

  const changeCheckbox = useCallback((index: number, checked: boolean) => {
    setGame((prevGame) => {
      if (!prevGame) return prevGame;

      const newGame = { ...prevGame,
        challenges: prevGame.challenges.map((challenge, challengeIndex) => {
          if (challengeIndex === prevGame.currentChallenge) {
            const updatedEvents = challenge.problem.eventOptions.map((event, eventIndex) => {
              if (eventIndex === index) {
                return { ...event, selected: checked };
              }
              return event;
            });
            return {
              ...challenge,
              problem: {
                ...challenge.problem,
                eventOptions: updatedEvents
              }
            };
          }
          return challenge;
        })
      };

      return newGame;
    });

    if(checked) {
      setTextInputFocus(index, true);
    } else {
      setTextInputValue(index, "");
    }

  }, [setGame, setTextInputValue, setTextInputFocus]);

  return (
    <div className="w-full min-h-[205px]
      rounded-md bg-background-otimath solid border-hairline border-neutral-lightest shadow-level-1">
      <h3 
        className="ds-heading-large text-center p-quarck border-neutral-lighter solid border-b-thin">Eventos(s)</h3>
      <div className="flex flex-col gap-y-micro p-micro max-h-[400px] overflow-auto [scrollbar-width:thin]">
        {events?.map((event, index) => {
          return (
            <div key={index} 
              className={` 
               text-neutral-dark  solid border-thin
               rounded-md cursor-pointer p-micro flex flex-col gap-y-micro
               transition-[background-color,border-color] duration-300 ease-in-out
                ${event?.selected ? 'bg-brand-otimath-lightest border-brand-otimath-pure' : 'bg-neutral-lightest border-neutral-lighter hover:border-neutral-medium'}
               `}>
            
               <Checkbox 
                  key={event?.description}
                  checkbox={
                    {
                      id: "Checkbox_" + event?.description,
                      label: event?.description,
                      checked: event?.selected,
                      disabled: event?.disabled,
                      styles: 'shrink-0',
                      containerStyles: 'flex flex-row-reverse justify-end gap-x-micro w-fit items-center w-full',
                      labelStyles: 'ds-body-bold grow-1 shrink-0',
                      onChange: (checked: boolean) => changeCheckbox(index, checked),
                    }
                  }
                />
                {
                  event?.selected &&

                  <TextInput textInput={{
                    id:"TextInput_" + event?.description,
                    styles: "w-full",
                    label: "Nome:",
                    placeholder: "Ex: F, M, 1A",
                    helperText: "Não repita o nome de um evento",
                    required: true,
                    type: "text",
                    value: event?.label,
                    disabled: event?.disabled,
                    error: event?.error,
                    isFocused: event?.inputIsFocused,
                    setValue: (value: string) => setTextInputValue(index, value),
                  }}/>
                }
            </div>
          )
        })}
      </div>
    </div>
  );
}

/* Example 
<TreeEvents />
*/