import type { Point, FMCanvasPatch, WaveTypeId } from './types';
import { colors } from '../tokens';

export const NATURAL_LENGTH = 350;
export const CANVAS_WIDTH  = 1200;
export const CANVAS_HEIGHT = 720;
export const NODE_RADIUS = 59;
export const RING_RADIUS = 77;
export const PANEL_WIDTH = 280;

/** Inner zone fraction — inside this radius = drag to move, outside = drag to connect */
export const INNER_ZONE_FRACTION = 0.7;

export const OPERATOR_LABELS = ['OPERATOR 1', 'OPERATOR 2', 'OPERATOR 3', 'OPERATOR 4'] as const;
export const OPERATOR_COLORS = [
  colors.operator.carrier,
  colors.operator.modA,
  colors.operator.modB1,
  colors.operator.modB2,
] as const;

export const WAVEFORM_NAMES = ['Sine', 'Square', 'Saw', 'Triangle', 'Noise'] as const;

/** Ratio snap points — discrete values the ring snaps to */
export const RATIO_SNAPS: number[] = [
  0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0,
  5.0, 6.0, 7.0, 8.0, 10.0, 12.0, 16.0,
];

/** Default diamond layout positions */
export const DEFAULT_POSITIONS: [Point, Point, Point, Point] = [
  { x: 600, y: 430 },  // Op 0 (C)  — bottom center
  { x: 600, y: 150 },  // Op 1 (A)  — top center
  { x: 400, y: 290 },  // Op 2 (B1) — left center
  { x: 800, y: 290 },  // Op 3 (B2) — right center
];

/** Self-loop radius range in pixels */
export const SELF_LOOP_MIN_RADIUS = 20;
export const SELF_LOOP_MAX_RADIUS = 80;
export const SELF_LOOP_DEFAULT_RADIUS = 30;

/** Exponential decay constant for distance → depth mapping (pixels) */
export const DEPTH_DECAY_CONSTANT = 350;

/** Default ratios per operator: C=1.0, A=2.0, B1=3.0, B2=4.0 */
const DEFAULT_RATIOS = [1.0, 2.0, 3.0, 4.0] as const;

function ratioToRingAngle(ratio: number): number {
  const idx = RATIO_SNAPS.indexOf(ratio);
  const i = idx >= 0 ? idx : RATIO_SNAPS.indexOf(1.0);
  return (i / (RATIO_SNAPS.length - 1)) * 2 * Math.PI;
}

export function createInitialPatch(): FMCanvasPatch {
  return {
    operators: DEFAULT_POSITIONS.map((pos, i) => ({
      position: { ...pos },
      waveform: 0 as WaveTypeId,
      ratio: DEFAULT_RATIOS[i],
      ringAngle: ratioToRingAngle(DEFAULT_RATIOS[i]),
    })) as [any, any, any, any],
    connections: [],  // No connections — all 4 operators are carriers
    selfLoops: [],
    algorithmIndex: 0,
    modDepthA: 0,
    modDepthB: 0,
    modDepthMatrix: new Array(16).fill(0),
    operatorFeedback: [0, 0, 0, 0],
    operatorDetune: [0, 0, 0, 0],
    operatorHarm: [0, 0, 0, 0],
    operatorLevel: [127, 127, 127, 127],
    harm: 0,
    carrierMix: 0.5,
    detune: 0,
    ampAttack: 30,
    ampDecay: 40,
    filterType: 0,             
    filterCutoff: 127,     // slider 0-127, fully open at init (20kHz)
    filterResonance: 4,    // slider 0-127, Q ≈ 0.73 (Butterworth)    
    filterEnvAttack: 0,       
    filterEnvDecay: 64,        
    filterEnvSustain: 100,    
    filterEnvRelease: 50,      
    filterEnvAmount: 0, 
    ampSustain: 100,
    ampRelease: 40,
    masterVolume: 100,
    masterPan: 64,
    masterOverdrive: 0,
    octave: 0,
    portamentoTime: 0,
    pitchBendRange: 2,
    pitchBend: 0.0,

    delayEnabled: false,
    delayMs: 375,
    delayFeedback: 0.4,
    delayMix: 0.3,

    reverbEnabled: false,
    reverbDecay: 0.5,
    reverbDamping: 0.5,
    reverbMix: 0.3,

    chorusEnabled: false,
    chorusDepth: 0.3,
    chorusSpeed: 1.0,
    chorusWidth: 0.5,
    chorusHpfCutoff: 200,
    chorusDelayMs: 7,
    chorusReverbSend: 0,

    bitcrushEnabled: false,
    bitcrushBits: 8,
    bitcrushRate: 0.25,

    lfo1Speed: 2.0,
    lfo1Depth: 0,
    lfo1Waveform: 1,
    lfo1Mode: 0,
    lfo1Destination: 0,
    lfo1Multiplier: 1,
    lfo1Fade: 0,

    lfo2Speed: 0.5,
    lfo2Depth: 0,
    lfo2Waveform: 0,
    lfo2Mode: 0,
    lfo2Destination: 19,
    lfo2Multiplier: 1,
    lfo2Fade: 0,

    operatorModEnv: [
      { attack: 64, decay: 64, end: 64 }, 
      { attack: 64, decay: 64, end: 64 },  
      { attack: 64, decay: 64, end: 64 },  
      { attack: 64, decay: 64, end: 64 },  
    ],
    operatorWaveforms: [0, 0, 0, 0],
  };
}
