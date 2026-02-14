import type { ChordGraphState, HistoryEntry } from '../types/chord';
import type { ChordService, ChordEventListener } from './chordService';

export function createWsChordService(defaultUrl?: string, onRaw?: (data: any) => void): ChordService {
  const listeners = new Set<ChordEventListener>();
  let state: ChordGraphState | null = null;
  const history: HistoryEntry[] = [];
  let ws: WebSocket | null = null;

  function handleMessage(msgData: any) {
    if (onRaw) {
      try { onRaw(msgData); } catch (_) {}
    }

    const chordObj = msgData?.chord ?? msgData;
    // chordObj may be { name: 'Cmaj', notes: [...], chroma: [...] }
    // or it may be { chord: 'Cmaj', notes: [...], ... } (detector output).
    let name: string;
    if (typeof chordObj === 'string') {
      name = chordObj;
    } else if (chordObj == null) {
      name = '—';
    } else if (typeof chordObj.name === 'string' && chordObj.name.length) {
      name = chordObj.name;
    } else if (typeof chordObj.chord === 'string' && chordObj.chord.length) {
      name = chordObj.chord;
    } else if (Array.isArray(chordObj.notes) && chordObj.notes.length) {
      name = chordObj.notes.join(',');
    } else {
      name = '—';
    }

    const newState: ChordGraphState = {
      current: { id: `${name}-1`, chordId: name, probability: 1 },
      previous: [],
      next: [],
    };

    if (state) {
      history.push({ current: state.current, next: [...state.next], chosenIndex: 0, timestamp: Date.now() });
    }

    state = newState;
    listeners.forEach((l) => l({ type: 'CHORD_CHANGE', payload: state as ChordGraphState }));
  }

  function connect(url?: string) {
    const target = url || defaultUrl || (typeof window !== 'undefined' && `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:8000/ws`);
    if (!target) return;
    try {
      ws = new WebSocket(target);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data?.type === 'chord') handleMessage(data.chord ?? data);
          else handleMessage(data);
        } catch (err) {
          // if not JSON, ignore
        }
      };
      ws.onopen = () => {
        // no-op
      };
      ws.onclose = () => { ws = null; };
      ws.onerror = () => { /* ignore */ };
    } catch (e) {
      // ignore
    }
  }

  return {
    subscribe(listener: ChordEventListener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    getState() { return state; },
    getHistory() { return history; },
    triggerNext() {},
    startAutoPlay() {},
    stopAutoPlay() {},
    destroy() {
      try { if (ws) ws.close(); } catch (_) {}
      listeners.clear();
    },
    // helper exposed dynamically
    connect,
  } as unknown as ChordService & { connect(url?: string): void };
}
