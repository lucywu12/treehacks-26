import type { ChordNode, ChordGraphState, HistoryEntry } from '../types/chord';
import type { ChordService, ChordEventListener } from './chordService';
import { Note, Chord } from '@tonaljs/tonal';

const CHORD_POOL = [
  'Cmaj', 'Dm', 'Em', 'Fmaj', 'Gmaj', 'Am', 'Bdim',
  'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7',
  'Cm', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb',
  'D', 'A', 'E', 'B', 'F#m', 'C#m',
];

let idCounter = 0;
function makeNode(chordId: string, probability?: number): ChordNode {
  return { id: `${chordId}-${++idCounter}`, chordId, probability };
}

function pickRandom(exclude: string, count: number): ChordNode[] {
  const available = CHORD_POOL.filter((c) => c !== exclude);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const probs = [0.6 + Math.random() * 0.4, 0.3 + Math.random() * 0.4, 0.1 + Math.random() * 0.3];
  return shuffled.slice(0, count).map((c, i) => makeNode(c, probs[i]));
}

export function createClientMidiService(backendUrl?: string): ChordService {
  const listeners = new Set<ChordEventListener>();
  const history: HistoryEntry[] = [];
  let state: ChordGraphState | null = null;

  let midiAccess: WebMidi.MIDIAccess | null = null;
  const heldNotes = new Set<number>();
  let timer: number | null = null;

  function emit(event: any) {
    listeners.forEach((l) => l(event));
  }

  function computeAndEmit() {
    const pitchClasses = Array.from(new Set(Array.from(heldNotes).map((n) => Note.get(Note.fromMidi(n)).pc))).filter(Boolean);
    const names = pitchClasses; // e.g. ["C","E","G"]
    let chordName: string | null = null;
    if (names.length >= 2) {
      try {
        const detections = Chord.detect(names as string[]);
        if (detections && detections.length > 0) chordName = detections[0];
      } catch (e) {
        // ignore
      }
    }

    const currentName = chordName || (names.length ? names.join(',') : '—');

    const newState: ChordGraphState = {
      current: makeNode(currentName, 1),
      previous: state ? [state.current, ...state.previous].slice(0, 3) : pickRandom(currentName, 3),
      next: pickRandom(currentName, 3),
    };

    if (state) {
      history.push({ current: state.current, next: [...state.next], chosenIndex: 0, timestamp: Date.now() });
    }

    state = newState;
    emit({ type: 'CHORD_CHANGE', payload: state });

    // optional POST to backend for logging or server-side processing
    if (backendUrl) {
      const payload = { chord: chordName, notes: names, ts: Date.now() };
      try { fetch(backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); } catch (_) {}
    }
  }

  function onMidiMessage(event: WebMidi.MIDIMessageEvent) {
    const [status, note, velocity] = event.data;
    const cmd = status & 0xf0;
    if (cmd === 0x90 && velocity > 0) {
      heldNotes.add(note);
    } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
      heldNotes.delete(note);
    }
    // debounced compute
  }

  function start() {
    if (!('requestMIDIAccess' in navigator)) return;
    navigator.requestMIDIAccess().then((m) => {
      midiAccess = m;
      for (const input of Array.from(midiAccess.inputs.values())) {
        input.onmidimessage = onMidiMessage as any;
      }
      // listen for new inputs
      midiAccess.onstatechange = () => {
        for (const input of Array.from(midiAccess!.inputs.values())) {
          input.onmidimessage = onMidiMessage as any;
        }
      };
      if (!timer) timer = window.setInterval(computeAndEmit, 120);
    }).catch(() => {});
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (midiAccess) {
      for (const input of Array.from(midiAccess.inputs.values())) {
        input.onmidimessage = null as any;
      }
      midiAccess = null;
    }
    heldNotes.clear();
  }

  return {
    subscribe(listener: ChordEventListener) { listeners.add(listener); return () => listeners.delete(listener); },
    getState() { return state; },
    getHistory() { return history; },
    triggerNext() {},
    startAutoPlay() {},
    stopAutoPlay() {},
    destroy() { stop(); listeners.clear(); },
    // helper to begin MIDI capture
    connect() { start(); }
  } as unknown as ChordService & { connect(): void };
}
