import type { ChordGraphState, ChordEvent, HistoryEntry } from '../types/chord';

export type ChordEventListener = (event: ChordEvent) => void;

export interface ChordService {
  subscribe(listener: ChordEventListener): () => void;
  getState(): ChordGraphState | null;
  getHistory(): HistoryEntry[];
  triggerNext(chosenIndex?: number): void;
  startAutoPlay(intervalMs?: number): void;
  stopAutoPlay(): void;
  destroy(): void;
}
