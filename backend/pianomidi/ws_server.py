#!/usr/bin/env python3
"""FastAPI WebSocket server that publishes MIDI-detected chords to connected clients.

Run with: `python backend/pianomidi/ws_server.py` (it starts uvicorn).

This file listens to the first MIDI input port and broadcasts JSON messages to WebSocket clients
on `/ws` with payloads like: {"type":"chord","chord": {"name": "Cmaj", "notes": ["C","E","G"], "chroma": [...] }}
"""
import asyncio
import asyncio.subprocess as asp
import json
import os
import sys
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
import uvicorn

app = FastAPI()
CLIENTS: Set[WebSocket] = set()
LOOP: asyncio.AbstractEventLoop | None = None


async def broadcast(message: dict):
    text = json.dumps(message)
    dead = []
    for ws in list(CLIENTS):
        try:
            await ws.send_text(text)
        except Exception:
            dead.append(ws)
    for d in dead:
        CLIENTS.discard(d)
    # debug log
    try:
        sys.stderr.write('[ws_server] broadcast: ' + text + '\n')
    except Exception:
        pass


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    CLIENTS.add(ws)
    try:
        while True:
            # keep connection alive; ignore client messages
            await ws.receive_text()
    except WebSocketDisconnect:
        CLIENTS.discard(ws)


@app.on_event("startup")
async def startup_event():
    global LOOP
    LOOP = asyncio.get_running_loop()
    # Optionally spawn the external detector subprocess and stream its JSON lines
    if os.environ.get('USE_DETECTOR_SUBPROCESS') in ('1', 'true', 'True'):
        detector_path = os.path.join(os.path.dirname(__file__), 'pianomidi', 'detector.py')
        # if file doesn't exist at that path, try the nested package path
        if not os.path.exists(detector_path):
            detector_path = os.path.join(os.path.dirname(__file__), 'pianomidi', 'pianomidi', 'detector.py')

        if not os.path.exists(detector_path):
            print('Requested detector subprocess but detector.py not found at', detector_path, file=sys.stderr)
            return

        async def run_detector_and_pipe():
            try:
                proc = await asp.create_subprocess_exec(sys.executable, detector_path, stdout=asp.PIPE, stderr=asp.PIPE)
            except Exception as e:
                print('Failed to spawn detector subprocess:', e, file=sys.stderr)
                return

            async def read_stdout():
                assert proc.stdout is not None
                while True:
                    line = await proc.stdout.readline()
                    if not line:
                        break
                    try:
                        text = line.decode('utf-8').strip()
                        if not text:
                            continue
                        try:
                            sys.stderr.write('[ws_server] detector stdout: ' + text + '\n')
                        except Exception:
                            pass
                        obj = json.loads(text)
                        # Normalize detector output to ensure a simple chord object
                        # detector may emit: {"chord": <name|null>, "notes": [...], "chroma": [...]}
                        # or {"chord": {...}} or other shapes. Produce {name, notes, chroma}.
                        chord_field = None
                        if isinstance(obj, dict):
                            if 'chord' in obj and (isinstance(obj.get('chord'), (str, dict)) and obj.get('chord')):
                                chord_field = obj.get('chord')
                            else:
                                # fallback to constructing from top-level keys
                                chord_field = {
                                    'name': obj.get('chord') if isinstance(obj.get('chord'), str) else obj.get('name'),
                                    'notes': obj.get('notes') or [],
                                    'chroma': obj.get('chroma') or []
                                }
                        else:
                            chord_field = {'name': str(obj), 'notes': [], 'chroma': []}

                        # If chord_field is a string (name), wrap into object
                        if isinstance(chord_field, str):
                            chord_field = {'name': chord_field, 'notes': [], 'chroma': []}

                        # Ensure required keys exist
                        # Ensure name is a usable string
                        notes_val = chord_field.get('notes') if isinstance(chord_field, dict) else []
                        chroma_val = chord_field.get('chroma') if isinstance(chord_field, dict) else []
                        name_val = None
                        if isinstance(chord_field, dict):
                            if isinstance(chord_field.get('name'), str) and chord_field.get('name'):
                                name_val = chord_field.get('name')
                            elif isinstance(chord_field.get('chord'), str) and chord_field.get('chord'):
                                name_val = chord_field.get('chord')
                            elif isinstance(notes_val, list) and notes_val:
                                name_val = ','.join(notes_val)
                        if not name_val:
                            name_val = '—'

                        chord_norm = {
                            'name': name_val,
                            'notes': notes_val,
                            'chroma': chroma_val,
                        }

                        msg = {"type": "chord", "chord": chord_norm}
                        await broadcast(msg)
                    except Exception as e:
                        print('Failed to parse detector line:', e, 'line:', line, file=sys.stderr)

            async def read_stderr():
                assert proc.stderr is not None
                while True:
                    line = await proc.stderr.readline()
                    if not line:
                        break
                    try:
                        sys.stderr.write('[detector] ' + line.decode('utf-8'))
                    except Exception:
                        pass

            read_tasks = [asyncio.create_task(read_stdout()), asyncio.create_task(read_stderr())]
            # wait for detector to exit
            await proc.wait()
            for t in read_tasks:
                t.cancel()

        asyncio.create_task(run_detector_and_pipe())
        print('Detector subprocess mode enabled (USE_DETECTOR_SUBPROCESS=1)', file=sys.stderr)
        return

    # start MIDI detector in-process
    # import here to avoid requiring rtmidi when only running frontend
    # allow disabling MIDI (useful for environments without MIDI devices or to avoid native crashes)
    if os.environ.get('DISABLE_MIDI') in ('1', 'true', 'True'):
        print('MIDI initialization disabled via DISABLE_MIDI env var', file=sys.stderr)
        return

    try:
        import rtmidi
        from pychord.analyzer import find_chords_from_notes
    except Exception as e:
        print("MIDI dependencies missing or unavailable:", e, file=sys.stderr)
        return

    NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    try:
        midi_in = rtmidi.MidiIn()
        ports = midi_in.get_ports()

        if not ports:
            print("No MIDI input ports found. Connect a MIDI device and try again.", file=sys.stderr)
            return
    except BaseException as e:
        # catch native errors (e.g., bus error originating from the underlying rtmidi/native library)
        print("Failed to initialize MIDI input (native error):", e, file=sys.stderr)
        return

    held_notes: set[int] = set()

    def midi_callback(event, _data=None):
        message, _dt = event
        status = message[0] & 0xF0
        note = message[1]
        velocity = message[2] if len(message) > 2 else 0

        if status == 0x90 and velocity > 0:
            held_notes.add(note)
            _detect_and_publish()
        elif status == 0x80 or (status == 0x90 and velocity == 0):
            held_notes.discard(note)
            _detect_and_publish()

    def _detect_and_publish():
        # called from rtmidi thread; schedule broadcast on main loop
        if LOOP is None:
            return
        chroma = [1 if i in {n % 12 for n in held_notes} else 0 for i in range(12)]
        pitch_classes = sorted({n % 12 for n in held_notes})
        names = [NOTE_NAMES[pc] for pc in pitch_classes]

        chord_name = None
        if len(names) >= 2:
            chords = find_chords_from_notes(names)
            if chords:
                chord_name = str(chords[0])

        payload = {"type": "chord", "chord": {"name": chord_name, "notes": names, "chroma": chroma}}
        asyncio.run_coroutine_threadsafe(broadcast(payload), LOOP)

    midi_in.set_callback(midi_callback)
    midi_in.open_port(0)
    print(f"MIDI WebSocket server: opened MIDI port {ports[0]}", file=sys.stderr)


@app.on_event("shutdown")
async def shutdown_event():
    CLIENTS.clear()


@app.post("/debug/publish")
async def debug_publish(req: Request):
    try:
        body = await req.json()
    except Exception:
        body = {}
    msg = {"type": "chord", "chord": body}
    await broadcast(msg)
    return {"ok": True}


@app.get("/debug/publish-test")
async def debug_publish_test():
    sample = {"type": "chord", "chord": {"name": "Cmaj", "notes": ["C", "E", "G"], "chroma": [1,0,0,0,1,0,0,1,0,0,0,0]}}
    await broadcast(sample)
    return {"ok": True, "sample": sample}


@app.get("/debug/clients")
async def debug_clients():
    return {"clients": len(CLIENTS)}


@app.post("/api/log-chord")
async def api_log_chord(req: Request):
    """Endpoint for the client to POST compact chord state during dev or when enabled.

    Proxied from the frontend `/api` during local dev (vite), so client can POST to `/api/log-chord`.
    """
    try:
        body = await req.json()
    except Exception:
        body = {}
    msg = {"type": "chord", "chord": body}
    await broadcast(msg)
    return {"ok": True}


if __name__ == "__main__":
    # Run uvicorn with this module
    uvicorn.run(app, host="0.0.0.0", port=8000)
