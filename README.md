# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Local WebSocket setup

Files added:

- `backend/pianomidi/ws_server.py` — FastAPI WebSocket server that reads MIDI (via `python-rtmidi`/`pychord`) and broadcasts JSON chord events on `/ws`.
- `hooks/useWsChord.js` — frontend hook that connects to `/ws` and returns the latest chord object.

Install dependencies for the backend:

```bash
pip install fastapi uvicorn[standard] python-rtmidi pychord
```

Run the server (it opens the first MIDI input port it finds):

```bash
python backend/pianomidi/ws_server.py
```

The frontend hook defaults to `ws://localhost:8000/ws` (or `wss://HOST/ws` when served over HTTPS). In your app you can use it like:

```js
import useWsChord from '../hooks/useWsChord'

function Live() {
  const chord = useWsChord()
  return <pre>{chord ? JSON.stringify(chord, null, 2) : 'Waiting for MIDI...'}</pre>
}
```

Deployment note: Vercel does not support long-lived WebSocket servers. To host the WebSocket backend for remote access, use a provider that supports persistent servers (e.g., Render, Railway, Fly, or a VPS) and set the frontend to connect to `wss://your-backend.example.com/ws`.

