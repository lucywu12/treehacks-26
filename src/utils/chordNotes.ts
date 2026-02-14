const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

type ChromaticNote = typeof CHROMATIC[number];

const ENHARMONIC: Record<string, ChromaticNote> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  'E#': 'F',
  'B#': 'C',
};

// Intervals in semitones from root
const QUALITY_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7],
  m: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

// Ordered longest-first so we match "maj7" before "maj"
const QUALITY_KEYS = Object.keys(QUALITY_INTERVALS).sort((a, b) => b.length - a.length);

function parseChord(chordId: string): { root: string; quality: string } {
  // Normalize: strip slash-bass parts (e.g., Am/C -> Am)
  const base = String(chordId ?? '').split('/')[0].trim();
  // Root is 1 or 2 chars: letter + optional # or b
  const rootMatch = base.match(/^([A-G][#b]?)/);
  if (!rootMatch) return { root: 'C', quality: 'maj' };
  const root = rootMatch[1];
  const rest = base.slice(root.length);

  // Match a known quality at the start of the rest (handles things like "m(no5)")
  const quality = QUALITY_KEYS.find((q) => rest.startsWith(q)) ?? 'maj';
  return { root, quality };
}

function normalizeNote(note: string): ChromaticNote {
  return (ENHARMONIC[note] ?? note) as ChromaticNote;
}

export function getChordNotes(chordId: string): string[] {
  const { root, quality } = parseChord(chordId);
  const rootNorm = normalizeNote(root);
  const rootIndex = CHROMATIC.indexOf(rootNorm);
  if (rootIndex === -1) return [chordId];

  const intervals = QUALITY_INTERVALS[quality] ?? QUALITY_INTERVALS.maj;
  return intervals.map((semitones) => CHROMATIC[(rootIndex + semitones) % 12]);
}
