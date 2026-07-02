export interface Option {
  value: string;
  label: string;
}

/** 2D coordinate on the canvas */
export interface Point {
  x: number;
  y: number;
}

/**
 * Waveform type IDs matching oscillator.rs WaveType enum order:
 * 0=Sine, 1=Square, 2=Saw, 3=Triangle, 4=Noise
 */
export type WaveTypeId = 0 | 1 | 2 | 3 | 4;

/** Per-operator state visible on the canvas */
export interface OperatorPatch {
  position: Point;
  waveform: WaveTypeId;
  ratio: number;        // 0.25 – 16.0
  ringAngle: number;    // radians, used to derive ratio via snap table
}

/** A directed modulation connection between two operators */
export interface Connection {
  src: number;  // operator index 0-3
  dst: number;  // operator index 0-3  (src === dst means self-loop / feedback)
  srcOffset: Point;
  dstOffset: Point;
}

/** Self-loop visual state for feedback */
export interface SelfLoop {
  opIndex: number;
  radius: number;  // visual radius in px → maps to feedback amount
}

/** The entire serializable patch for the FM canvas */
export interface FMCanvasPatch {
  operators: [OperatorPatch, OperatorPatch, OperatorPatch, OperatorPatch];
  connections: Connection[];
  selfLoops: SelfLoop[];

  // Derived engine params (computed from spatial layout)
  algorithmIndex: number;   // 0-7
  modDepthA: number;        // 0-127 (legacy, kept for LFO compat)
  modDepthB: number;        // 0-127 (legacy, kept for LFO compat)
  /** Per-connection FM depth. Index = src * 4 + dst. Values 0–127. */
  modDepthMatrix: number[];
  operatorFeedback: [number, number, number, number]; // 0-127 per operator
  operatorDetune: [number, number, number, number];   // -100 to +100 cents per operator
  operatorHarm: [number, number, number, number];     // -26 to +26 per operator
  operatorLevel: [number, number, number, number];    // 0-127 output level per operator
  harm: number;             // -26 to 26 (global, legacy)
  carrierMix: number;       // 0.0–1.0
  detune: number;           // 0-127 (global, legacy)
  ampAttack: number;        // 0-127
  ampDecay: number;         // 0-127
  ampSustain: number;       // 0-127
  ampRelease: number;       // 0-127
  masterVolume: number;
  masterPan: number;
  masterOverdrive: number;   // 0.0-1.0
  octave: number;            // -2 to +2
  portamentoTime: number;
  pitchBendRange: number;
  pitchBend: number;
  filterType: number;
  filterCutoff: number;
  filterResonance: number;
  filterEnvAttack: number;
  filterEnvDecay: number;
  filterEnvSustain: number;
  filterEnvRelease: number;
  filterEnvAmount: number;

  // Effects
  delayEnabled: boolean;
  delayMs: number;         // 0-1000ms
  delayFeedback: number;   // 0.0-0.99
  delayMix: number;        // 0.0-1.0

  reverbEnabled: boolean;
  reverbDecay: number;     // 0.0-1.0
  reverbDamping: number;   // 0.0-1.0
  reverbMix: number;       // 0.0-1.0

  chorusEnabled: boolean;
  chorusDepth: number;     // 0.0-1.0
  chorusSpeed: number;     // 0.1-10.0 Hz
  chorusWidth: number;     // 0.0-1.0
  chorusHpfCutoff: number;  // Hz
  chorusDelayMs: number;    // ms
  chorusReverbSend: number; // 0.0-1.0

  bitcrushEnabled: boolean;
  bitcrushBits: number;    // 1-16 bit depth
  bitcrushRate: number;    // 0.01-1.0 sample rate fraction

  // LFOs
  lfo1Speed: number;        // 0.0-10.0 Hz
  lfo1Depth: number;        // 0.0-1.0
  lfo1Waveform: number;     // 0=Triangle,1=Sine,2=Square,3=Sawtooth,4=Exp,5=Ramp,6=Random
  lfo1Mode: number;         // 0=Free,1=Trigger,2=Hold,3=One,4=Half
  lfo1Destination: number;  // LfoDestination index
  lfo1Multiplier: number;   // integer multiplier
  lfo1Fade: number;         // -64 to 63

  lfo2Speed: number;
  lfo2Depth: number;
  lfo2Waveform: number;
  lfo2Mode: number;
  lfo2Destination: number;
  lfo2Multiplier: number;
  lfo2Fade: number;

  // Per-operator mod envelopes (ADE: Attack, Decay, End level)
  operatorModEnv: [
    { attack: number; decay: number; end: number },
    { attack: number; decay: number; end: number },
    { attack: number; decay: number; end: number },
    { attack: number; decay: number; end: number }
  ];

  operatorWaveforms: [WaveTypeId, WaveTypeId, WaveTypeId, WaveTypeId];
}
