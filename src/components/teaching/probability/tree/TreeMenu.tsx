import { TreeEvents } from "./TreeEvents";
import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";

interface TreeMenuProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export function TreeMenu({game, setGame}:Readonly<TreeMenuProps>) {
 
  return (
    <div className={`w-full flex flex-col gap-lg max-w-[438px] max-lg:items-center max-lg:self-center max-lg:gap-xxs`
      }
    >
      <TreeEvents game={game} setGame={setGame}/>
    </div>
  );
}


/* Example 

<TreeMenu />

*/