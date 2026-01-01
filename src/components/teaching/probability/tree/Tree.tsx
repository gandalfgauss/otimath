import { Game } from "@/hooks/teaching/probability/tree/useTreeHooks";

interface TreeProps {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

export function Tree({game, setGame}:Readonly<TreeProps>) {
  const events = game?.challenges[game.currentChallenge].problem.eventOptions;


  return (
    <div className="w-full h-[500px] rounded-md bg-neutral-lightest shadow-level-1">
      
    </div>
  );
}

/* Example 
<Tree/>
*/