import { AnimatePresence } from 'framer-motion';
import type { ChordGraphState } from '../../types/chord';
import { GlowDefs } from '../GlowDefs/GlowDefs';
import { ChordNodeComponent } from '../ChordNode/ChordNode';
import { ChordEdge } from '../ChordEdge/ChordEdge';

interface ChordGraphProps {
  state: ChordGraphState;
  rawChord?: any;
}

const VIEWBOX_W = 900;
const VIEWBOX_H = 500;
const CENTER = { x: VIEWBOX_W / 2, y: VIEWBOX_H / 2 };

const SLOT_POSITIONS = {
  'prev-0': { x: -260, y: -130 },
  'prev-1': { x: -300, y: 0 },
  'prev-2': { x: -260, y: 130 },
  'center': { x: 0, y: 0 },
  'next-0': { x: 260, y: -130 },
  'next-1': { x: 300, y: 0 },
  'next-2': { x: 260, y: 130 },
} as const;

type SlotId = keyof typeof SLOT_POSITIONS;

function getAbsPos(slot: SlotId) {
  return {
    x: CENTER.x + SLOT_POSITIONS[slot].x,
    y: CENTER.y + SLOT_POSITIONS[slot].y,
  };
}

export function ChordGraph({ state, rawChord }: ChordGraphProps) {
  const { current, previous, next } = state;

  // Build a flat list of all nodes with their target positions and roles
  const allNodes = [
    ...previous.map((node, i) => ({
      node,
      slot: `prev-${i}` as SlotId,
      role: 'previous' as const,
      notesOverride: undefined,
    })),
    { node: current, slot: 'center' as SlotId, role: 'current' as const, notesOverride: rawChord?.notes },
    ...next.map((node, i) => ({
      node,
      slot: `next-${i}` as SlotId,
      role: 'next' as const,
      notesOverride: undefined,
    })),
  ];

  // Build edges from center to all neighbors
  const centerPos = getAbsPos('center');
  const edges = [
    ...previous.map((node, i) => ({
      key: `edge-prev-${node.id}`,
      from: centerPos,
      to: getAbsPos(`prev-${i}` as SlotId),
      variant: 'previous' as const,
    })),
    ...next.map((node, i) => ({
      key: `edge-next-${node.id}`,
      from: centerPos,
      to: getAbsPos(`next-${i}` as SlotId),
      variant: 'next' as const,
    })),
  ];

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
      preserveAspectRatio="xMidYMid meet"
    >
      <GlowDefs />

      {/* Background subtle grid */}
      <rect width={VIEWBOX_W} height={VIEWBOX_H} fill="transparent" />

      {/* Edges layer */}
      <AnimatePresence mode="popLayout">
        {edges.map((edge) => (
          <ChordEdge
            key={edge.key}
            edgeKey={edge.key}
            fromX={edge.from.x}
            fromY={edge.from.y}
            toX={edge.to.x}
            toY={edge.to.y}
            variant={edge.variant}
          />
        ))}
      </AnimatePresence>

      {/* Nodes layer (rendered after edges so they appear on top) */}
      <AnimatePresence mode="popLayout">
        {allNodes.map(({ node, slot, role, notesOverride }: any) => {
          const pos = getAbsPos(slot);
          return (
            <ChordNodeComponent
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              role={role}
              notesOverride={notesOverride}
            />
          );
        })}
      </AnimatePresence>
    </svg>
  );
}
