'use client';

import { useMemo, useEffect, useRef, useState, useCallback } from "react";
import ReactFlow, {
  type Edge,
  type Node,
  type NodeTypes,
  type ReactFlowInstance,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import "@/styles/teaching/probability/tree/tree.css"

import { Game, EventTree} from "@/hooks/teaching/probability/tree/useTreeHooks";
import { Button } from "@/components/global/Button";

interface Tree {
  game: Game | null;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

interface EventTreeNodeData {
  eventTree: EventTree;
  game: Game;
  setGame: React.Dispatch<React.SetStateAction<Game | null>>;
}

const nodeTypes: NodeTypes = { eventTreeNode: EventTreeNode };

const NODE_W = 120;
const NODE_H = 40;


function EventTreeNode({data}: Readonly<{data: {eventTree: EventTree, setGame: React.Dispatch<React.SetStateAction<Game | null>>}}>) {
  const probabilityOnClick = useCallback(() => {
    data.setGame((prevGame) => {
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

      const probabilityChosen = currentProblem.probabilitiesToAssemble.find(probability => probability?.selected);
      const probabilityChosenIndex = currentProblem.probabilitiesToAssemble.findIndex(probability => probability?.selected);

      const eventTreeChosen = {...data.eventTree};
      const eventTreeChosenIndex = currentProblem.eventsTree.findIndex(
        eventTree => 
          eventTree.event.description == data.eventTree.event.description &&
          eventTree.event.label == data.eventTree.event.label &&
          eventTree.parentEventTree?.event.description == data.eventTree.parentEventTree?.event.description
      );

      if(probabilityChosen) {
        currentProblem.eventsTree[eventTreeChosenIndex] = {
          ...eventTreeChosen,
          probability: {
            ...eventTreeChosen.probability,
            probabilityText: probabilityChosen.probabilityText,
            probabilityOfOccurring: probabilityChosen.probabilityOfOccurring,
          }
        }

        currentProblem.probabilitiesToAssemble[probabilityChosenIndex] = {
          ...probabilityChosen,
          selected: false,
        }
      } else {
        currentProblem.eventsTree = currentProblem.eventsTree.map((eventTree, indexEventTree) => {
          if(eventTreeChosenIndex == indexEventTree) {
             return {
              ...eventTree,
              probability: {
                ...eventTree.probability,
                selected: !eventTree.probability?.selected
              }
            }
          }

          return {
            ...eventTree,
            probability: {
              ...eventTree.probability,
              selected: false
            }
          }
        });
      }

      currentChallenge.problem = currentProblem;
      newGame.challenges[currentChallengeIndex] = currentChallenge;

      return newGame;
    });
  }, [data]);

  return (
    <div 
      className={`w-full h-full flex gap-x-macro items-center justify-center bg-neutral-white p-macro shadow-level-2 z-50
        rounded-md border-solid border-hairline border-neutral-light transition-[opacity] duration-300 ease-in-out
        ${data.eventTree.show ? 'opacity-level-visible' : 'opacity-level-transparent'}`
      }
    >
      <div className="ds-body-bold text-neutral-dark">{data.eventTree.event?.label}</div>

      {data.eventTree.probability?.show && 
        <Button
          style="secondary" 
          size="extra-small"
          disabled={data.eventTree.probability?.disabled}
          type="button"
          onClick={probabilityOnClick}
          additionalStyles={`text-neutral-dark hover:text-neutral-dark !w-[60px] shrink-0 node-button ${data.eventTree.probability?.selected ? '!bg-brand-otimath-lightest !border-brand-otimath-pure !text-brand-otimath-pure' : ' bg-neutral-lightest border-neutral-lighter hover:!border-neutral-medium'}`}
        > 
          {data.eventTree.probability?.probabilityText ? data.eventTree.probability?.probabilityText : '?'}
        </Button>
      }

      {data.eventTree.level != 0 && <Handle type="target" position={Position.Left} />}
      {(data.eventTree.childrenEventsTree?.length ?? 0) > 0 && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

function eventTreeToGraph(allNodes: EventTree[], game: Game, setGame: React.Dispatch<React.SetStateAction<Game | null>>) {
  const nodes: Node<EventTreeNodeData>[] = [];
  const edges: Edge[] = [];

  const makeId = (n: EventTree) =>
    `${n.level}:${n.event.description}:${n.parentEventTree?.event.description ?? "ROOT"}`;

  const showById = new Map<string, boolean>();

  for (const n of allNodes) {
    const id = makeId(n);
    showById.set(id, !!n.show);

    nodes.push({
      id,
      type: "eventTreeNode",
      data: { eventTree: {...n}, game, setGame },
      position: { x: 0, y: 0 },
      className: n.level === 0 ? "rf-node-anchor" : "",
    });
  }

  for (const n of allNodes) {
    if (!n.parentEventTree) continue;

    const source = makeId(n.parentEventTree);
    const target = makeId(n);

    const visible = (!!showById.get(source) && !!showById.get(target)) || (n.level == 0);

    edges.push({
      id: `e:${source}->${target}`,
      source,
      target,
      hidden: !visible,
      style: {
        stroke: 'var(--color-brand-otimath-pure)',
        strokeWidth: 2,
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease-in-out",
      },
    });
  }

  return { nodes, edges };
}

function layoutHorizontal(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 100 });

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const layoutedNodes = nodes.map((n) => {
    const p = g.node(n.id);
    return {
      ...n,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      style: { width: NODE_W, height: NODE_H },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function Tree({ game, setGame }: Readonly<Tree>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const { nodes, edges } = useMemo(() => {
    const roots =
    game?.challenges[game.currentChallenge].problem.eventsTree ?? [];
    const graph = eventTreeToGraph(roots, game as Game, setGame);
    return layoutHorizontal(graph.nodes, graph.edges);
  }, [game, setGame]);

  
  useEffect(() => {
    if(!containerRef.current)
      return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        rfInstance?.fitView({ padding: 0.2, duration: 0 });
      });
    });

    ro.observe(containerRef.current as Element);

    return () => {
      ro.disconnect();
    };
  }, [rfInstance, containerRef]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-[500px] rounded-md bg-neutral-lightest shadow-level-1"
    >
      <ReactFlow
        key={`${game?.currentChallenge}`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        onInit={(instance) => {
            setRfInstance(instance);
            instance.fitView({ padding: 0.2, duration: 0 });
          }
        }
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        selectNodesOnDrag={false}
        nodesFocusable={false}
        edgesFocusable={false}
      />
    </div>
  );
}


