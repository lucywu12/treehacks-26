import { useState } from 'react';
import type { ChordGraphState } from '../../types/chord';

interface DebugPanelProps {
  state: ChordGraphState;
  onTriggerNext: (index: number) => void;
  onStartAutoPlay: (ms?: number) => void;
  onStopAutoPlay: () => void;
}

export function DebugPanel({ state, onTriggerNext, onStartAutoPlay, onStopAutoPlay }: DebugPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 16,
      background: 'rgba(10, 14, 26, 0.85)',
      border: '1px solid rgba(245, 197, 66, 0.2)',
      borderRadius: 12,
      backdropFilter: 'blur(12px)',
      zIndex: 100,
      minWidth: 180,
    }}>
      <div style={{
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
        color: 'rgba(240, 230, 211, 0.4)',
        marginBottom: 4,
      }}>
        Next Chords
      </div>

      {state.next.map((node, i) => (
        <button
          key={node.id}
          onClick={() => onTriggerNext(i)}
          style={{
            background: 'rgba(245, 197, 66, 0.1)',
            border: '1px solid rgba(245, 197, 66, 0.3)',
            borderRadius: 8,
            padding: '8px 16px',
            color: '#f0e6d3',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(245, 197, 66, 0.25)';
            e.currentTarget.style.borderColor = 'rgba(245, 197, 66, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(245, 197, 66, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(245, 197, 66, 0.3)';
          }}
        >
          {node.chordId}
          {node.probability !== undefined && (
            <span style={{ marginLeft: 8, opacity: 0.5, fontSize: 11 }}>
              {Math.round(node.probability * 100)}%
            </span>
          )}
        </button>
      ))}

      <div style={{ borderTop: '1px solid rgba(245, 197, 66, 0.1)', paddingTop: 8, marginTop: 4 }}>
        <button
          onClick={() => {
            if (isPlaying) {
              onStopAutoPlay();
            } else {
              onStartAutoPlay(2500);
            }
            setIsPlaying(!isPlaying);
          }}
          style={{
            width: '100%',
            background: isPlaying ? 'rgba(200, 80, 192, 0.2)' : 'rgba(245, 197, 66, 0.08)',
            border: `1px solid ${isPlaying ? 'rgba(200, 80, 192, 0.4)' : 'rgba(245, 197, 66, 0.15)'}`,
            borderRadius: 8,
            padding: '8px 16px',
            color: '#f0e6d3',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}
        >
          {isPlaying ? 'Stop Auto-Play' : 'Start Auto-Play'}
        </button>
      </div>
    </div>
  );
}
