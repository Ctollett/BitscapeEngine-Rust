import { useState } from 'react';
import { initAudio } from './audio/engine';
import Keyboard from './components/Keyboard';
import { PatchProvider } from './fm-canvas/PatchProvider';
import { FMCanvas } from './fm-canvas/FMCanvas';
import './App.css';
import { GlobalControlPanel } from './fm-canvas/GlobalControlPanel';
import { Header } from './components/Header';
import { colors, borderRadius, spacing } from './tokens';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './fm-canvas/constants';
import DesignGraphic from './assets/landing-reference/design.svg?react';

function App() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      await initAudio();
      setStarted(true);
    } catch (err) {
      console.error('Failed to start audio:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      {!started ? (
        <div className="landing">
          <DesignGraphic className="landing__graphic" />
          <h1 className="landing__title">TX-04</h1>
          <p className="landing__subtitle">BROWSER-BASED FM SOUND DESIGN INSTRUMENT</p>
          <button className="landing__cta" onClick={handleStart} disabled={loading}>
            {loading ? 'LOADING...' : 'START AUDIO'}
          </button>
        </div>
      ) : (
        <PatchProvider>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64, padding: spacing.md, width: '100%', boxSizing: 'border-box' }}>
            <div style={{display: 'flex', flexDirection: 'column', gap: spacing.md}}>
              <Header />
              <div style={{ display: 'flex', flexDirection: 'column', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderRadius: borderRadius.lg }}>
                {/* Canvas zone */}
                <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, borderRadius: `${borderRadius.lg}px ${borderRadius.lg}px 0 0`, background: colors.bg.canvas, overflow: 'hidden' }}>
                  <FMCanvas />
                </div>
                {/* Bottom panel */}
                <div style={{ borderRadius: `0 0 ${borderRadius.lg}px ${borderRadius.lg}px`, background: colors.bg.panel, overflow: 'hidden' }}>
                  <GlobalControlPanel />
                </div>
              </div>
            </div>
            <Keyboard />
          </div>
        </PatchProvider>
      )}
    </div>
  );
}

export default App;
