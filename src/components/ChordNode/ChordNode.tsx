import { motion } from 'framer-motion';
import type { ChordNode as ChordNodeType } from '../../types/chord';
import { getChordNotes } from '../../utils/chordNotes';
import { OrbitingDots } from './OrbitingDots';

interface ChordNodeProps {
  node: ChordNodeType;
  x: number;
  y: number;
  role: 'previous' | 'current' | 'next';
}

const ROLE_CONFIG = {
  current: {
    radius: 30,
    filter: 'url(#glow-center)',
    fill: 'url(#center-gradient)',
    stroke: '#ffe066',
    strokeWidth: 2,
    fontSize: 15,
    fontWeight: 700,
    labelColor: '#fff',
  },
  next: {
    radius: 20,
    filter: 'url(#glow)',
    fill: 'url(#next-gradient)',
    stroke: '#f5c542',
    strokeWidth: 1.5,
    fontSize: 12,
    fontWeight: 600,
    labelColor: '#f0e6d3',
  },
  previous: {
    radius: 17,
    filter: 'url(#glow)',
    fill: 'url(#prev-gradient)',
    stroke: '#c850c0',
    strokeWidth: 1,
    fontSize: 11,
    fontWeight: 500,
    labelColor: 'rgba(240, 230, 211, 0.7)',
  },
};

export function ChordNodeComponent({ node, x, y, role }: ChordNodeProps) {
  const config = ROLE_CONFIG[role];
  const opacity = role === 'previous' ? 0.7 : 1;
  const notes = getChordNotes(node.chordId);

  return (
    <motion.g
      layoutId={node.id}
      initial={{ opacity: 0, scale: 0.2 }}
      animate={{
        opacity,
        scale: 1,
        x,
        y,
      }}
      exit={{ opacity: 0, scale: 0.2 }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 20,
        mass: 1,
      }}
    >
      {/* Outer glow ring */}
      {role === 'current' && (
        <motion.circle
          r={config.radius + 12}
          fill="none"
          stroke="#f5c54230"
          strokeWidth={1}
          filter="url(#glow-edge)"
          animate={{
            r: [config.radius + 10, config.radius + 16, config.radius + 10],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Main circle */}
      <circle
        r={config.radius}
        fill={config.fill}
        stroke={config.stroke}
        strokeWidth={config.strokeWidth}
        filter={config.filter}
        opacity={node.probability ?? 1}
      />

      {/* Orbiting note dots */}
      <OrbitingDots notes={notes} parentRadius={config.radius} role={role} />

      {/* Chord label */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={config.labelColor}
        fontSize={config.fontSize}
        fontWeight={config.fontWeight}
        fontFamily="'Inter', system-ui, sans-serif"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.chordId}
      </text>
    </motion.g>
  );
}
