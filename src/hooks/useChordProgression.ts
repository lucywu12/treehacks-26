import { useState, useEffect, useRef } from 'react';
import type { ChordGraphState } from '../types/chord';
import type { ChordService } from '../services/chordService';
import { createMockChordService } from '../services/mockChordService';

export function useChordProgression(service?: ChordService) {
  const serviceRef = useRef<ChordService>(
    service ?? createMockChordService()
  );
  const [state, setState] = useState<ChordGraphState | null>(
    serviceRef.current.getState()
  );

  useEffect(() => {
    const svc = serviceRef.current;
    const unsub = svc.subscribe((event) => {
      if (event.type === 'CHORD_CHANGE') {
        setState(event.payload);
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
    triggerNext: (index?: number) => serviceRef.current.triggerNext(index),
    startAutoPlay: (ms?: number) => serviceRef.current.startAutoPlay(ms),
    stopAutoPlay: () => serviceRef.current.stopAutoPlay(),
  };
}
