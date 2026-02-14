import { useState } from 'react';
import './index.css';
import { useChordProgression } from './hooks/useChordProgression';
import { ChordGraph } from './components/ChordGraph/ChordGraph';
import { DebugPanel } from './components/DebugPanel/DebugPanel';
import { HistoryGraph } from './components/HistoryGraph/HistoryGraph';

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
  const { state, history, triggerNext, startAutoPlay, stopAutoPlay } = useChordProgression();
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
