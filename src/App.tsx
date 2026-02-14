import { useState, useMemo } from 'react';
import './index.css';
import { useChordProgression } from './hooks/useChordProgression';
import { ChordGraph } from './components/ChordGraph/ChordGraph';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { HistoryGraph } from './components/HistoryGraph/HistoryGraph';
import { createWsChordService } from './services/wsChordService';

type Tab = 'live' | 'history';

const tabStyle = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(245, 197, 66, 0.15)' : 'rgba(10, 14, 26, 0.6)',
  border: `1px solid ${active ? 'rgba(245, 197, 66, 0.4)' : 'rgba(245, 197, 66, 0.1)'}`,
  borderRadius: 8,
  padding: '6px 16px',
  color: active ? '#f5c542' : 'rgba(240, 230, 211, 0.5)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  letterSpacing: 1,
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s',
});

function App() {
  const [rawChord, setRawChord] = useState<any>(null);

  const wsService = useMemo(() => {
    const svc = createWsChordService(undefined, (d) => {
      console.log('RAW CHORD FROM WS:', d);
      setRawChord(d);
    });
    // connect to default ws://localhost:8000/ws
    if (typeof window !== 'undefined') {
      svc.connect();
    }
    return svc;
  }, []);

  const { state, history, triggerNext, startAutoPlay, stopAutoPlay } = useChordProgression(wsService as any);

  const [activeTab, setActiveTab] = useState<Tab>('live');

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
      {/* Raw chord debug overlay */}
      <div style={{position: 'fixed', right: 16, top: 80, zIndex: 200, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 8, borderRadius: 8, fontSize: 12, maxWidth: 320}}>
        <div style={{fontWeight: 700, marginBottom: 6}}>RAW CHORD</div>
        <pre style={{whiteSpace: 'pre-wrap', margin: 0}}>{rawChord ? JSON.stringify(rawChord, null, 2) : '—'}</pre>
      </div>
      {/* Tab bar */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 6,
        padding: 4,
        background: 'rgba(10, 14, 26, 0.85)',
        border: '1px solid rgba(245, 197, 66, 0.15)',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
        zIndex: 100,
      }}>
        <button style={tabStyle(activeTab === 'live')} onClick={() => setActiveTab('live')}>
          Live
        </button>
        <button style={tabStyle(activeTab === 'history')} onClick={() => setActiveTab('history')}>
          History
        </button>
      </div>

      {/* Content */}
      {activeTab === 'live' ? (
        <>
          <ChordGraph state={state} />
          <DebugPanel
            state={state}
            onTriggerNext={triggerNext}
            onStartAutoPlay={startAutoPlay}
            onStopAutoPlay={stopAutoPlay}
          />
        </>
      ) : (
        <HistoryGraph history={history} />
      )}
    </div>
  );
}

export default App;
