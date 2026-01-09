import { TreeEvents } from "./TreeEvents";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";
import { TreeProbability } from "./TreeProbability";
import { TreeCalculations } from "./TreeCalculations";

interface TreeMenuProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export function TreeMenu({game, setGame}:Readonly<TreeMenuProps>) {
 
  return (
    <div className={`w-full flex flex-col gap-xs max-w-[438px] max-lg:items-center max-lg:self-center max-lg:gap-xxs`
      }
    >
      <TreeEvents game={game} setGame={setGame}/>
      {!game?.challenges[game.currentChallenge].problem.boardProbabilityDisabled && <TreeProbability game={game} setGame={setGame}/>}
      {!game?.challenges[game.currentChallenge].problem.boardCalculationsDisabled && <TreeCalculations game={game} setGame={setGame}/>}
    </div>
  );
}


/* Example 

<TreeMenu />

*/