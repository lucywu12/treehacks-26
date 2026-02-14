#!/usr/bin/env python3
"""FastAPI WebSocket server that publishes MIDI-detected chords to connected clients.

Run with: `python backend/pianomidi/ws_server.py` (it starts uvicorn).

This file listens to the first MIDI input port and broadcasts JSON messages to WebSocket clients
on `/ws` with payloads like: {"type":"chord","chord": {"name": "Cmaj", "notes": ["C","E","G"], "chroma": [...] }}
"""
import asyncio
import json
import sys
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
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
    # start MIDI detector in the background
    # import here to avoid requiring rtmidi when only running frontend
    try:
        import rtmidi
        from pychord.analyzer import find_chords_from_notes
    except Exception as e:
        print("MIDI dependencies missing or unavailable:", e, file=sys.stderr)
        return

    NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    midi_in = rtmidi.MidiIn()
    ports = midi_in.get_ports()

    if not ports:
        print("No MIDI input ports found. Connect a MIDI device and try again.", file=sys.stderr)
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


if __name__ == "__main__":
    # Run uvicorn with this module
    uvicorn.run(app, host="0.0.0.0", port=8000)
