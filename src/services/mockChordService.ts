import type { ChordNode, ChordGraphState, ChordEvent, HistoryEntry } from '../types/chord';
import type { ChordService, ChordEventListener } from './chordService';

const CHORD_POOL = [
  'Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am', 'Bdim',
  'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7',
  'Cm', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb',
  'D', 'A', 'E', 'B', 'F#m', 'C#m',
];

let idCounter = 0;
function makeNode(chordId: string, probability?: number): ChordNode {
  return {
    id: `${chordId}-${++idCounter}`,
    chordId,
    probability,
  };
}

function pickRandom(exclude: string, count: number): ChordNode[] {
  const available = CHORD_POOL.filter((c) => c !== exclude);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const probs = [0.6 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.1 + Math.random() * 0.3];
  return shuffled.slice(0, count).map((c, i) => makeNode(c, probs[i]));
}

export function createMockChordService(): ChordService {
  const listeners = new Set<ChordEventListener>();
  let autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  const history: HistoryEntry[] = [];

  const initialCurrent = makeNode('Cmaj', 1);
  let state: ChordGraphState = {
    current: initialCurrent,
    previous: pickRandom('Cmaj', 3),
    next: pickRandom('Cmaj', 3),
  };

  function emit(event: ChordEvent) {
    listeners.forEach((l) => l(event));
  }

  function triggerNext(chosenIndex = 0) {
    const idx = Math.min(chosenIndex, state.next.length - 1);
    const chosen = state.next[idx];

    history.push({
      current: state.current,
      next: [...state.next],
      chosenIndex: idx,
      timestamp: Date.now(),
    });

    const newPrevious = [state.current, ...state.previous].slice(0, 3);
    const newNext = pickRandom(chosen.chordId, 3);

    state = {
      current: { ...chosen, probability: 1 },
      previous: newPrevious,
      next: newNext,
    };

    emit({ type: 'CHORD_CHANGE', payload: state });
  }

  return {
    subscribe(listener: ChordEventListener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getState() {
      return state;
    },
    getHistory() {
      return history;
    },
    triggerNext,
    startAutoPlay(intervalMs = 3000) {
      if (autoPlayTimer) return;
      autoPlayTimer = setInterval(() => {
        const idx = Math.floor(Math.random() * state.next.length);
        triggerNext(idx);
      }, intervalMs);
    },
    stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    },
    destroy() {
      if (autoPlayTimer) clearInterval(autoPlayTimer);
      listeners.clear();
    },
  };
}
