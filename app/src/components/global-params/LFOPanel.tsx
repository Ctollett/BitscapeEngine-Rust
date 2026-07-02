import { useState } from 'react';
import { usePatch } from '../../fm-canvas/patch-context';
import { LFOSliders } from './LFOSliders';
import { LFOWave } from './LFOWave';
import { TabSelect } from '../TabSelect';
import { Panel } from '../Panel';
import { PanelKnob } from '../PanelKnob';
import { PanelGroup } from '../PanelGroup';
import { colors, typography } from '../../tokens';

// Ordered to match LfoDestination enum in lfo.rs
const DESTINATIONS: { value: number; label: string; group: string }[] = [
  // FM Synth
  { value: 0,  label: 'Mod A',      group: 'FM Synth' },
  { value: 1,  label: 'Mod B',      group: 'FM Synth' },
  { value: 2,  label: 'Ratio C',    group: 'FM Synth' },
  { value: 3,  label: 'Ratio A',    group: 'FM Synth' },
  { value: 4,  label: 'Ratio B',    group: 'FM Synth' },
  { value: 5,  label: 'Feedback',   group: 'FM Synth' },
  { value: 6,  label: 'Harm',       group: 'FM Synth' },
  { value: 7,  label: 'Carrier Mix',group: 'FM Synth' },
  // Amp
  { value: 8,  label: 'Amp Atk',    group: 'Amp' },
  { value: 9,  label: 'Amp Dec',    group: 'Amp' },
  { value: 10, label: 'Amp Sus',    group: 'Amp' },
  { value: 11, label: 'Amp Rel',    group: 'Amp' },
  { value: 12, label: 'Overdrive',  group: 'Amp' },
  { value: 13, label: 'Pan',        group: 'Amp' },
  { value: 14, label: 'Volume',     group: 'Amp' },
  // Filter
  { value: 15, label: 'Flt Atk',    group: 'Filter' },
  { value: 16, label: 'Flt Dec',    group: 'Filter' },
  { value: 17, label: 'Flt Sus',    group: 'Filter' },
  { value: 18, label: 'Flt Rel',    group: 'Filter' },
  { value: 19, label: 'Cutoff',     group: 'Filter' },
  { value: 20, label: 'Resonance',  group: 'Filter' },
  { value: 21, label: 'Env Amt',    group: 'Filter' },
];



const MODES = [
  { value: 0, label: 'Free' },
  { value: 1, label: 'Trig' },
  { value: 2, label: 'Hold' },
  { value: 3, label: 'One' },
  { value: 4, label: 'Half' },
];

interface LFOPanelProps {
  lfoIndex: 1 | 2;
  lfoColor: string
}

export function LFOPanel({ lfoIndex, lfoColor }: LFOPanelProps) {
  const { patch, dispatch } = usePatch();
  const [assigning, setAssigning] = useState(false);

  const speed = lfoIndex === 1 ? patch.lfo1Speed : patch.lfo2Speed;
  const depth = lfoIndex === 1 ? patch.lfo1Depth : patch.lfo2Depth;
  const waveform = lfoIndex === 1 ? patch.lfo1Waveform : patch.lfo2Waveform;
  const mode = lfoIndex === 1 ? patch.lfo1Mode : patch.lfo2Mode;
  const destination = lfoIndex === 1 ? patch.lfo1Destination : patch.lfo2Destination;
  const multiplier = lfoIndex === 1 ? patch.lfo1Multiplier : patch.lfo2Multiplier;
  const fade = lfoIndex === 1 ? patch.lfo1Fade : patch.lfo2Fade;

  const update = (partial: Partial<{ speed: number; depth: number; waveform: number; mode: number; destination: number; multiplier: number; fade: number }>) => {
    const next = { speed, depth, waveform, mode, destination, multiplier, fade, ...partial };
    dispatch({ type: lfoIndex === 1 ? 'SET_LFO1' : 'SET_LFO2', ...next });
  };

  const activeDest = DESTINATIONS.find(d => d.value === destination);

  // ── Assignment panel ──────────────────────────────────────────────────────
  if (assigning) {
    return (
      <div style={{ width: '100%', alignSelf: 'stretch', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', paddingTop: 36, alignContent: 'space-between' }}>
        {DESTINATIONS.map(d => (
          <button
            key={d.value}
            onClick={() => { update({ destination: d.value }); setAssigning(false); }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              ...typography.label.lg, fontSize: 10,
              color: destination === d.value ? lfoColor : colors.text.muted,
            }}
          >
            {d.label}
          </button>
        ))}
      </div>
    );
  }

  // ── Normal panel ──────────────────────────────────────────────────────────
  return (
    <Panel spread>

      {/* Mode tabs + Wave */}
      <PanelGroup gap={20}>
        <TabSelect options={MODES} value={mode} onChange={(v) => update({ mode: v })} />
        <LFOWave speed={speed} depth={depth} waveform={waveform} color={lfoColor} onWaveformChange={(v) => update({ waveform: v })} />
      </PanelGroup>

      {/* Speed + Depth sliders */}
      <LFOSliders
        speed={speed}
        depth={depth}
        lfoIndex={lfoIndex}
        onSpeedChange={(v) => update({ speed: v })}
        onDepthChange={(v) => update({ depth: v })}
      />

      {/* Destination */}
      <PanelGroup>
        <button
          onClick={() => setAssigning(true)}
          style={{
            padding: '5px 10px',
            background: 'transparent',
            border: '1px solid',
            borderColor: activeDest ? lfoColor : '#333',
            borderRadius: '4px',
            color: activeDest ? lfoColor: '#555',
            fontSize: '10px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {activeDest ? activeDest.label : 'None'} ›
        </button>
         <span style={{ ...typography.label.sm, color: colors.text.muted }}>Destination</span>
      </PanelGroup>

      {/* Mult + Fade knobs */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <PanelKnob color={lfoColor} label="Mult" value={(multiplier - 1) / 7} onChange={(v) => update({ multiplier: Math.round(v * 7) + 1 })} />
        <PanelKnob color={lfoColor} label="Fade" value={(fade + 64) / 127} onChange={(v) => update({ fade: Math.round(v * 127) - 64 })} />
      </div>


    </Panel>
  );
}
