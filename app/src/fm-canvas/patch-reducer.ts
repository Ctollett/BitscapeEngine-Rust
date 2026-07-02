import type { FMCanvasPatch } from './types';
import type { PatchAction } from './patch-context';
import { computeModDepths, computeModDepthMatrix } from './depth-mapper';
import { RATIO_SNAPS, SELF_LOOP_MIN_RADIUS, SELF_LOOP_MAX_RADIUS } from './constants';

/** Map self-loop radius (px) to feedback amount (0-127). */
function mapSelfLoopToFeedback(radius: number): number {
  const clamped = Math.max(
    0,
    Math.min(1, (radius - SELF_LOOP_MIN_RADIUS) / (SELF_LOOP_MAX_RADIUS - SELF_LOOP_MIN_RADIUS)),
  );
  return Math.round(clamped * 127);
}

/** Snap a ring angle to the nearest ratio in RATIO_SNAPS. */
function angleToRatio(angle: number): number {
  const TWO_PI = 2 * Math.PI;
  const normalized = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  const fraction = normalized / TWO_PI;
  const snapIndex = Math.round(fraction * (RATIO_SNAPS.length - 1));
  return RATIO_SNAPS[Math.max(0, Math.min(RATIO_SNAPS.length - 1, snapIndex))];
}

/** Shallow-clone patch with a new operators tuple (avoids structuredClone cost). */
function shallowCopy(state: FMCanvasPatch): FMCanvasPatch {
  return {
    ...state,
    operators: [
      { ...state.operators[0], position: { ...state.operators[0].position } },
      { ...state.operators[1], position: { ...state.operators[1].position } },
      { ...state.operators[2], position: { ...state.operators[2].position } },
      { ...state.operators[3], position: { ...state.operators[3].position } },
    ],
    connections: [...state.connections],
    selfLoops: [...state.selfLoops],
    operatorWaveforms: [...state.operatorWaveforms] as [any, any, any, any],
    operatorDetune: [...state.operatorDetune] as [number, number, number, number],
    operatorHarm: [...state.operatorHarm] as [number, number, number, number],
    operatorLevel: [...state.operatorLevel] as [number, number, number, number],
    operatorModEnv: state.operatorModEnv.map(env => ({ ...env })) as [any, any, any, any],
  };
}

export function patchReducer(state: FMCanvasPatch, action: PatchAction): FMCanvasPatch {
  switch (action.type) {
    case 'MOVE_OPERATOR': {
      const next = shallowCopy(state);
      next.operators[action.opIndex].position = action.position;
      const depths = computeModDepths(next);
      next.modDepthA = depths.modDepthA;
      next.modDepthB = depths.modDepthB;
      next.modDepthMatrix = computeModDepthMatrix(next);
      return next;
    }

    case 'SET_RING_ANGLE': {
      const next = shallowCopy(state);
      next.operators[action.opIndex].ringAngle = action.angle;
      next.operators[action.opIndex].ratio = angleToRatio(action.angle);
      return next;
    }

    case 'ADD_CONNECTION': {
      const exists = state.connections.some(
        (c) => c.src === action.src && c.dst === action.dst,
      );
      if (exists) return state;
      const next = shallowCopy(state);
      next.connections.push({ src: action.src, dst: action.dst, srcOffset: action.srcOffset, dstOffset: action.dstOffset });
      const depths = computeModDepths(next);
      next.modDepthA = depths.modDepthA;
      next.modDepthB = depths.modDepthB;
      next.modDepthMatrix = computeModDepthMatrix(next);
      return next;
    }

    case 'REMOVE_CONNECTION': {
      const next = shallowCopy(state);
      next.connections = next.connections.filter(
        (c) => !(c.src === action.src && c.dst === action.dst),
      );
      const depths = computeModDepths(next);
      next.modDepthA = depths.modDepthA;
      next.modDepthB = depths.modDepthB;
      next.modDepthMatrix = computeModDepthMatrix(next);
      return next;
    }

    case 'SET_SELF_LOOP': {
      const next = shallowCopy(state);
      const idx = next.selfLoops.findIndex((s) => s.opIndex === action.opIndex);
      if (idx >= 0) {
        next.selfLoops[idx] = { ...next.selfLoops[idx], radius: action.radius };
      } else {
        next.selfLoops.push({ opIndex: action.opIndex, radius: action.radius });
      }
      // Update per-operator feedback
      next.operatorFeedback = [0, 0, 0, 0] as [number, number, number, number];
      for (const loop of next.selfLoops) {
        next.operatorFeedback[loop.opIndex] = mapSelfLoopToFeedback(loop.radius);
      }
      return next;
    }

    case 'REMOVE_SELF_LOOP': {
      const next = shallowCopy(state);
      next.selfLoops = next.selfLoops.filter((s) => s.opIndex !== action.opIndex);
      // Update per-operator feedback
      next.operatorFeedback = [0, 0, 0, 0] as [number, number, number, number];
      for (const loop of next.selfLoops) {
        next.operatorFeedback[loop.opIndex] = mapSelfLoopToFeedback(loop.radius);
      }
      return next;
    }

    case 'SET_RATIO': {
      const next = shallowCopy(state);
      next.operators[action.opIndex].ratio = action.ratio;
      return next;
    }

    case 'SET_WAVEFORM': {
      const next = shallowCopy(state);
      next.operatorWaveforms[action.opIndex] = action.waveform;
      return next;
    }

    case 'SET_OPERATOR_FEEDBACK': {
      const next = shallowCopy(state);
      next.operatorFeedback = [...next.operatorFeedback] as [number, number, number, number];
      next.operatorFeedback[action.opIndex] = action.value;
      return next;
    }

    case 'SET_OPERATOR_DETUNE': {
      const next = shallowCopy(state);
      next.operatorDetune = [...next.operatorDetune] as [number, number, number, number];
      next.operatorDetune[action.opIndex] = action.value;
      return next;
    }

    case 'SET_OPERATOR_HARM': {
      const next = shallowCopy(state);
      next.operatorHarm = [...next.operatorHarm] as [number, number, number, number];
      next.operatorHarm[action.opIndex] = action.value;
      return next;
    }

    case 'SET_OPERATOR_LEVEL': {
      const next = shallowCopy(state);
      next.operatorLevel = [...next.operatorLevel] as [number, number, number, number];
      next.operatorLevel[action.opIndex] = action.value;
      return next;
    }

    case 'SET_HARM':
      return { ...state, harm: action.value };

    case 'SET_CARRIER_MIX':
      return { ...state, carrierMix: action.value };

    case 'SET_FEEDBACK':
      // Legacy action: sets all operators to the same feedback value
      return { ...state, operatorFeedback: [action.value, action.value, action.value, action.value] };

    case 'SET_DETUNE':
      return { ...state, detune: action.value };

    case 'SET_AMP_ENV':
      return { ...state, ampAttack: action.attack, ampDecay: action.decay, ampSustain: action.sustain, ampRelease: action.release };

    case 'SET_MASTER_VOLUME':
    return { ...state, masterVolume: action.value };

    case 'SET_MASTER_PAN':
    return { ...state, masterPan: action.value };

    case 'SET_MASTER_OVERDRIVE':
      return { ...state, masterOverdrive: action.value };

    case 'SET_OCTAVE':
      return { ...state, octave: action.value };

    case 'SET_PORTAMENTO_TIME':
    return { ...state, portamentoTime: action.value };

    case 'SET_PITCH_BEND_RANGE':
    return { ...state, pitchBendRange: action.value };

    case 'SET_PITCH_BEND':
    return { ...state, pitchBend: action.value };

    case 'SET_OPERATOR_MOD_ENV': {
      const next = shallowCopy(state);
      next.operatorModEnv[action.opIndex] = { attack: action.attack, decay: action.decay, end: action.end };
      return next;
    }

    case 'SET_FILTER_TYPE':
      return { ...state, filterType: action.value };

    case 'SET_FILTER_CUTOFF':
      return { ...state, filterCutoff: action.value };

    case 'SET_FILTER_RESONANCE':
      return { ...state, filterResonance: action.value };

    case 'SET_FILTER_ENV':
      return {
        ...state,
        filterEnvAttack: action.attack,
        filterEnvDecay: action.decay,
        filterEnvSustain: action.sustain,
        filterEnvRelease: action.release
      };

    case 'SET_FILTER_ENV_AMOUNT':
      return { ...state, filterEnvAmount: action.value };

    case 'SET_DELAY':
      return { ...state, delayEnabled: action.enabled, delayMs: action.ms, delayFeedback: action.feedback, delayMix: action.mix };

    case 'SET_REVERB':
      return { ...state, reverbEnabled: action.enabled, reverbDecay: action.decay, reverbDamping: action.damping, reverbMix: action.mix };

    case 'SET_CHORUS':
      return { ...state, chorusEnabled: action.enabled, chorusDepth: action.depth, chorusSpeed: action.speed, chorusWidth: action.width, chorusHpfCutoff: action.hpfCutoff, chorusDelayMs: action.delayMs, chorusReverbSend: action.reverbSend };

    case 'SET_LFO1':
      return { ...state, lfo1Speed: action.speed, lfo1Depth: action.depth, lfo1Waveform: action.waveform, lfo1Mode: action.mode, lfo1Destination: action.destination, lfo1Multiplier: action.multiplier, lfo1Fade: action.fade };

    case 'SET_LFO2':
      return { ...state, lfo2Speed: action.speed, lfo2Depth: action.depth, lfo2Waveform: action.waveform, lfo2Mode: action.mode, lfo2Destination: action.destination, lfo2Multiplier: action.multiplier, lfo2Fade: action.fade };

    case 'SET_BITCRUSH':
      return { ...state, bitcrushEnabled: action.enabled, bitcrushBits: action.bits, bitcrushRate: action.rate };

    case 'LOAD_PATCH': {
      const loaded = action.patch;
      if (!loaded.modDepthMatrix) {
        const next = { ...loaded };
        next.modDepthMatrix = computeModDepthMatrix(loaded);
        return next;
      }
      return loaded;
    }

    default:
      return state;
  }
}
