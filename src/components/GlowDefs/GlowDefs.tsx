export function GlowDefs() {
  return (
    <defs>
      {/* Standard glow for outer nodes */}
      <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Stronger glow for center node */}
      <filter id="glow-center" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="8" result="blur1" />
        <feGaussianBlur stdDeviation="16" result="blur2" />
        <feMerge>
          <feMergeNode in="blur2" />
          <feMergeNode in="blur1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Subtle glow for edges */}
      <filter id="glow-edge" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Radial gradient for center node */}
      <radialGradient id="center-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffe066" />
        <stop offset="60%" stopColor="#f5c542" />
        <stop offset="100%" stopColor="#d4881c" stopOpacity="0.6" />
      </radialGradient>

      {/* Radial gradient for next nodes */}
      <radialGradient id="next-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f5c542" />
        <stop offset="100%" stopColor="#d4881c" stopOpacity="0.4" />
      </radialGradient>

      {/* Radial gradient for previous nodes */}
      <radialGradient id="prev-gradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#c850c0" />
        <stop offset="100%" stopColor="#7b2d8e" stopOpacity="0.4" />
      </radialGradient>
    </defs>
  );
}
