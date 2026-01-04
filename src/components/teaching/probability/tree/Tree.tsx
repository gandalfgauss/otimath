'use client';

import { useMemo, useEffect, useRef, useState } from "react";
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

interface Tree {
  game: Game | null;
}

const nodeTypes: NodeTypes = { eventTreeNode: EventTreeNode };

const NODE_W = 70;
const NODE_H = 40;

function EventTreeNode({data}: Readonly<{data: EventTree}>) {
  return (
    <div 
      className={`w-full h-full flex items-center justify-center bg-neutral-white p-macro shadow-level-2
        rounded-md border-solid border-hairline border-neutral-light transition-[opacity] duration-300 ease-in-out
        ${data.show ? 'opacity-level-visible' : 'opacity-level-transparent'}`
      }
    >
      <div className="ds-body-bold text-neutral-dark">{data.event?.label}</div>

      {data.level != 1 && <Handle type="target" position={Position.Left} />}
      {(data.childrenEventsTree?.length ?? 0) > 0 && <Handle type="source" position={Position.Right} />}
    </div>
  );
}

function eventTreeToGraph(allNodes: EventTree[]) {
  const nodes: Node<EventTree>[] = [];
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
      data: { ...n },
      position: { x: 0, y: 0 },
    });
  }

  for (const n of allNodes) {
    if (!n.parentEventTree) continue;

    const source = makeId(n.parentEventTree);
    const target = makeId(n);

    const visible = !!showById.get(source) && !!showById.get(target);

    edges.push({
      id: `e:${source}->${target}`,
      source,
      target,
      hidden: !visible,
      style: {
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

export function Tree({ game }: Readonly<Tree>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const roots =
    game?.challenges[game.currentChallenge].problem.eventsTree ?? [];

  const { nodes, edges } = useMemo(() => {
    const graph = eventTreeToGraph(roots);
    return layoutHorizontal(graph.nodes, graph.edges);
  }, [game?.challenges[game.currentChallenge].problem.eventsTree]);

  
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
