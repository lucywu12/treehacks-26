import { motion } from 'framer-motion';

interface OrbitingDotsProps {
  notes: string[];
  parentRadius: number;
  role: 'previous' | 'current' | 'next';
}

const ROLE_DOT_CONFIG = {
  current: { dotRadius: 8, orbitOffset: 22, color: '#ffe066', fontSize: 8 },
  next: { dotRadius: 6, orbitOffset: 16, color: '#f5c542', fontSize: 6.5 },
  previous: { dotRadius: 5, orbitOffset: 14, color: '#c850c0', fontSize: 5.5 },
} as const;

export function OrbitingDots({ notes, parentRadius, role }: OrbitingDotsProps) {
  const { dotRadius, orbitOffset, color, fontSize } = ROLE_DOT_CONFIG[role];
  const orbitRadius = parentRadius + orbitOffset;
  const angleStep = 360 / notes.length;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      {notes.map((note, i) => {
        const angleDeg = -90 + i * angleStep;
        const angleRad = (angleDeg * Math.PI) / 180;
        const cx = Math.cos(angleRad) * orbitRadius;
        const cy = Math.sin(angleRad) * orbitRadius;

        return (
          <motion.g
            key={note + i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: 0.4 + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ x: cx, y: cy }}
          >
            <circle
              r={dotRadius}
              fill={color}
              opacity={0.85}
              filter="url(#glow-edge)"
            />
            <text
              textAnchor="middle"
              dy="0.35em"
              fill="#fff"
              fontSize={fontSize}
              fontWeight={600}
              fontFamily="'Inter', system-ui, sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {note}
            </text>
          </motion.g>
        );
      })}
    </motion.g>
  );
}
