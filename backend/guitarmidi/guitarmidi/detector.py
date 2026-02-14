#!/usr/bin/env python3
"""Real-time audio-based guitar chord detection.

Listens to the default microphone and streams JSON Lines to stdout
whenever a chord or note changes. Drop-in replacement for pianomidi.
"""

import json
import sys
import time
import threading

import numpy as np
import sounddevice as sd
import librosa
from pychord.analyzer import find_chords_from_notes

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Scale intervals (semitones from root)
MAJOR_INTERVALS = {0, 2, 4, 5, 7, 9, 11}
MINOR_INTERVALS = {0, 2, 3, 5, 7, 8, 10}

def _build_scale(root: int, intervals: set) -> set:
    """Return set of pitch-class indices for a scale starting at *root*."""
    return {(root + i) % 12 for i in intervals}

def detect_key(chroma_norm: np.ndarray) -> set:
    """Pick the major or minor key that best fits the chroma vector.

    Returns the set of pitch-class indices belonging to that key.
    """
    best_score = -1.0
    best_scale = set(range(12))  # fallback: all notes
    for root in range(12):
        for intervals in (MAJOR_INTERVALS, MINOR_INTERVALS):
            scale = _build_scale(root, intervals)
            # score = energy inside key minus energy outside key
            score = sum(chroma_norm[pc] for pc in scale) - sum(chroma_norm[pc] for pc in range(12) if pc not in scale)
            if score > best_score:
                best_score = score
                best_scale = scale
    return best_scale

SAMPLE_RATE = 22050
FRAME_SIZE = 8192          # ~0.37s per frame
HOP_SIZE = 2048
CHROMA_THRESHOLD = 0.35    # relative threshold for binary chroma
SILENCE_DB = -20           # RMS below this → silence (volume floor)
MIN_EMIT_INTERVAL = 0.15   # seconds between emits
FMIN = librosa.note_to_hz("E2")  # lowest guitar string


class ChordDetector:
    def __init__(self):
        self._last_chroma = None
        self._last_emit_time = 0.0
        self._silence_emitted = False
        self._lock = threading.Lock()

    def process_audio(self, audio: np.ndarray):
        """Process a frame of mono audio and emit JSON if chord changed."""
        # Silence gate
        rms = np.sqrt(np.mean(audio ** 2))
        rms_db = 20 * np.log10(rms + 1e-10)

        if rms_db < SILENCE_DB:
            with self._lock:
                if not self._silence_emitted:
                    self._silence_emitted = True
                    self._last_chroma = None
                    self._emit(None, [], [0] * 12)
            return

        # Chroma extraction via CQT
        chroma = librosa.feature.chroma_cqt(
            y=audio.astype(np.float32),
            sr=SAMPLE_RATE,
            fmin=FMIN,
            n_octaves=4,
            hop_length=HOP_SIZE,
        )

        # Average across time frames → 12-element vector
        chroma_avg = np.mean(chroma, axis=1)

        # Normalize to max, apply threshold → binary chroma
        max_val = chroma_avg.max()
        if max_val < 1e-6:
            return  # effectively silent
        chroma_norm = chroma_avg / max_val
        chroma_binary = [1 if v >= CHROMA_THRESHOLD else 0 for v in chroma_norm]

        # Debounce: skip if unchanged or too soon
        now = time.monotonic()
        with self._lock:
            if chroma_binary == self._last_chroma and (now - self._last_emit_time) < MIN_EMIT_INTERVAL:
                return
            self._last_chroma = chroma_binary
            self._last_emit_time = now
            self._silence_emitted = False

        # Detect key and filter notes to only in-key pitch classes
        key_pcs = detect_key(chroma_norm)
        chroma_binary = [v if i in key_pcs else 0 for i, v in enumerate(chroma_binary)]

        # Map binary chroma to note names
        pitch_classes = [i for i, v in enumerate(chroma_binary) if v == 1]
        names = [NOTE_NAMES[pc] for pc in pitch_classes]

        # Chord detection
        chord = None
        if len(names) >= 2:
            chords = find_chords_from_notes(names)
            if chords:
                chord = str(chords[0])

        self._emit(chord, names, chroma_binary)

    def _emit(self, chord, notes, chroma):
        print(json.dumps({"chord": chord, "notes": notes, "chroma": chroma}), flush=True)


def main():
    detector = ChordDetector()
    buffer = np.zeros(FRAME_SIZE, dtype=np.float32)
    write_pos = 0
    buf_lock = threading.Lock()
    frame_ready = threading.Event()

    def audio_callback(indata, frames, time_info, status):
        nonlocal buffer, write_pos
        if status:
            print(f"Audio status: {status}", file=sys.stderr)
        mono = indata[:, 0]
        with buf_lock:
            space = FRAME_SIZE - write_pos
            if len(mono) <= space:
                buffer[write_pos:write_pos + len(mono)] = mono
                write_pos += len(mono)
            else:
                buffer[write_pos:] = mono[:space]
                write_pos = FRAME_SIZE
            if write_pos >= FRAME_SIZE:
                frame_ready.set()

    # Print device info to stderr (matches pianomidi pattern)
    device_info = sd.query_devices(kind="input")
    print(f"Listening on: {device_info['name']} ({SAMPLE_RATE} Hz, {FRAME_SIZE}-sample frames)", file=sys.stderr)
    print("Play guitar near the mic! Press Ctrl+C to quit.", file=sys.stderr)

    stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        channels=1,
        blocksize=1024,
        dtype="float32",
        callback=audio_callback,
    )

    try:
        with stream:
            while True:
                frame_ready.wait()
                frame_ready.clear()
                with buf_lock:
                    frame = buffer.copy()
                    write_pos = 0
                detector.process_audio(frame)
    except KeyboardInterrupt:
        print("\nBye!", file=sys.stderr)


if __name__ == "__main__":
    main()
