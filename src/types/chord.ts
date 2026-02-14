export type ChordId = string;

export interface ChordNode {
  id: string;
  chordId: ChordId;
  probability?: number;
}

export interface ChordGraphState {
  current: ChordNode;
  previous: ChordNode[];
  next: ChordNode[];
}

export type ChordEvent =
  | { type: 'CHORD_CHANGE'; payload: ChordGraphState }
  | { type: 'RESET' };
