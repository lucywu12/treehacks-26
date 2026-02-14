import './index.css';
import { useChordProgression } from './hooks/useChordProgression';
import { ChordGraph } from './components/ChordGraph/ChordGraph';
import { DebugPanel } from './components/DebugPanel/DebugPanel';

function App() {
  const { state, triggerNext, startAutoPlay, stopAutoPlay } = useChordProgression();

  if (!state) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(240, 230, 211, 0.4)',
        fontSize: 14,
      }}>
        Waiting for chord input...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ChordGraph state={state} />
      <DebugPanel
        state={state}
        onTriggerNext={triggerNext}
        onStartAutoPlay={startAutoPlay}
        onStopAutoPlay={stopAutoPlay}
      />
    </div>
  );
}

export default App;
