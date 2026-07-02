import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { FMCanvasPatch, Point, WaveTypeId } from './types';

// ─── Actions ────────────────────────────────────────────────────────────────
export type PatchAction =
  | { type: 'MOVE_OPERATOR'; opIndex: number; position: Point }
  | { type: 'SET_RING_ANGLE'; opIndex: number; angle: number }
  | { type: 'ADD_CONNECTION'; src: number; dst: number; srcOffset: Point, dstOffset: Point }
  | { type: 'REMOVE_CONNECTION'; src: number; dst: number }
  | { type: 'SET_SELF_LOOP'; opIndex: number; radius: number }
  | { type: 'REMOVE_SELF_LOOP'; opIndex: number }
  | { type: 'SET_RATIO'; opIndex: number; ratio: number }
  | { type: 'SET_WAVEFORM'; opIndex: number; waveform: WaveTypeId }
  | { type: 'SET_OPERATOR_FEEDBACK'; opIndex: number; value: number }
  | { type: 'SET_OPERATOR_DETUNE'; opIndex: number; value: number }
  | { type: 'SET_OPERATOR_HARM'; opIndex: number; value: number }
  | { type: 'SET_OPERATOR_LEVEL'; opIndex: number; value: number }
  | { type: 'SET_HARM'; value: number }
  | { type: 'SET_CARRIER_MIX'; value: number }
  | { type: 'SET_FEEDBACK'; value: number }
  | { type: 'SET_DETUNE'; value: number }
  | { type: 'SET_AMP_ENV'; attack: number; decay: number; sustain: number; release: number }
  | { type: 'SET_OPERATOR_MOD_ENV'; opIndex: number; attack: number; decay: number; end: number }
  | { type: 'LOAD_PATCH'; patch: FMCanvasPatch }
  | { type: 'SET_MASTER_VOLUME'; value: number }
  | { type: 'SET_MASTER_PAN'; value: number }
  | { type: 'SET_MASTER_OVERDRIVE'; value: number }
  | { type: 'SET_OCTAVE'; value: number }
  | { type: 'SET_PORTAMENTO_TIME'; value: number }
  | { type: 'SET_PITCH_BEND_RANGE'; value: number }
    | { type: 'SET_PITCH_BEND'; value: number }
  | { type: 'SET_FILTER_TYPE'; value: number }
  | { type: 'SET_FILTER_CUTOFF'; value: number }
  | { type: 'SET_FILTER_RESONANCE'; value: number }
  | { type: 'SET_FILTER_ENV'; attack: number; decay: number; sustain: number; release: number }
  | { type: 'SET_FILTER_ENV_AMOUNT'; value: number }
  | { type: 'SET_DELAY'; enabled: boolean; ms: number; feedback: number; mix: number }
  | { type: 'SET_REVERB'; enabled: boolean; decay: number; damping: number; mix: number }
  | { type: 'SET_CHORUS'; enabled: boolean; depth: number; speed: number; width: number; hpfCutoff: number; delayMs: number; reverbSend: number }
  | { type: 'SET_LFO1'; speed: number; depth: number; waveform: number; mode: number; destination: number; multiplier: number; fade: number }
  | { type: 'SET_LFO2'; speed: number; depth: number; waveform: number; mode: number; destination: number; multiplier: number; fade: number }
  | { type: 'SET_BITCRUSH'; enabled: boolean; bits: number; rate: number };

 


// ─── Context ────────────────────────────────────────────────────────────────
export interface PatchContextValue {
  patch: FMCanvasPatch;
  dispatch: Dispatch<PatchAction>;
}

export const PatchContext = createContext<PatchContextValue | null>(null);

export function usePatch(): PatchContextValue {
  const ctx = useContext(PatchContext);
  if (!ctx) throw new Error('usePatch must be used inside <PatchProvider>');
  return ctx;
}
