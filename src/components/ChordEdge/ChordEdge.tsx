import { motion } from 'framer-motion';

interface ChordEdgeProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  edgeKey: string;
  variant: 'previous' | 'next';
}

export function ChordEdge({ fromX, fromY, toX, toY, edgeKey, variant }: ChordEdgeProps) {
  const stroke = variant === 'next' ? '#f5c542' : '#c850c0';
  const opacity = variant === 'next' ? 0.5 : 0.3;

  // Compute a slight curve via a control point offset perpendicular to the line
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy);
  // Perpendicular offset for curvature
  const curveAmount = 15;
  const cpX = midX + (-dy / len) * curveAmount;
  const cpY = midY + (dx / len) * curveAmount;

  const pathD = `M ${fromX} ${fromY} Q ${cpX} ${cpY} ${toX} ${toY}`;

  return (
    <motion.path
      key={edgeKey}
      d={pathD}
      fill="none"
      stroke={stroke}
      strokeWidth={1.5}
      strokeDasharray="4 4"
      filter="url(#glow-edge)"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      exit={{ opacity: 0 }}
      transition={{
        pathLength: { type: 'spring', stiffness: 100, damping: 20 },
        opacity: { duration: 0.4 },
      }}
    />
  );
}
