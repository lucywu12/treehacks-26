import { useState, useEffect, useRef } from 'react';
import type { ChordGraphState, HistoryEntry } from '../types/chord';
import type { ChordService } from '../services/chordService';
import { createMockChordService } from '../services/mockChordService';

export function useChordProgression(service?: ChordService) {
  const serviceRef = useRef<ChordService>(
    service ?? createMockChordService()
  );
  const [state, setState] = useState<ChordGraphState | null>(
    serviceRef.current.getState()
  );
  const [history, setHistory] = useState<HistoryEntry[]>(
    serviceRef.current.getHistory()
  );

  // if a different service instance is passed later, swap to it
  useEffect(() => {
    if (service && serviceRef.current !== service) {
      try { serviceRef.current.destroy(); } catch (e) {}
      serviceRef.current = service;
      setState(serviceRef.current.getState());
      setHistory([...serviceRef.current.getHistory()]);
    }
  }, [service]);

  useEffect(() => {
    const svc = serviceRef.current;
    const unsub = svc.subscribe((event) => {
      if (event.type === 'CHORD_CHANGE') {
        setState(event.payload);
        setHistory([...svc.getHistory()]);
      } else if (event.type === 'RESET') {
        setState(null);
      }
    });
    return () => {
      unsub();
      svc.destroy();
    };
  }, []);

  return {
    state,
    history,
    triggerNext: (index?: number) => serviceRef.current.triggerNext(index),
    startAutoPlay: (ms?: number) => serviceRef.current.startAutoPlay(ms),
    stopAutoPlay: () => serviceRef.current.stopAutoPlay(),
  };
}
