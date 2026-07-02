import { useRef, useEffect } from 'react';
import { setParam, setBitcrush } from '../audio/engine';
import type { FMCanvasPatch } from './types';

/**
 * Scale factors for LFO depth per destination index.
 * The engine's LFO depth is unclamped, so we pre-scale here so that
 * depth=1.0 (100% in the UI) means "full meaningful range" for that dest.
 *
 * Destinations (must match LfoDestination enum order in lfo.rs):
 *  0=ModDepthA, 1=ModDepthB, 2=RatioC, 3=RatioA, 4=RatioB,
 *  5=Feedback, 6=Harm, 7=CarrierMix,
 *  8=AmpAttack, 9=AmpDecay, 10=AmpSustain, 11=AmpRelease,
 *  12=Overdrive, 13=Pan, 14=Volume,
 *  15=FilterAttack, 16=FilterDecay, 17=FilterSustain, 18=FilterRelease,
 *  19=FilterCutoff, 20=FilterResonance, 21=FilterEnvAmount
 */
const LFO_DEPTH_SCALE: number[] = [
  1.0,    // 0  ModDepthA     (0–1)
  1.0,    // 1  ModDepthB     (0–1)
  4.0,    // 2  RatioC        (ratio range; ±4 = wide vibrato)
  4.0,    // 3  RatioA
  4.0,    // 4  RatioB
  64.0,   // 5  Feedback      (0–127; scale to half-range)
  26.0,   // 6  Harm          (–26 to +26)
  1.0,    // 7  CarrierMix    (0–1)
  64.0,   // 8  AmpAttack     (0–127)
  64.0,   // 9  AmpDecay      (0–127)
  1.0,    // 10 AmpSustain    (0–1 internally)
  64.0,   // 11 AmpRelease    (0–127)
  1.0,    // 12 Overdrive     (0–1)
  63.0,   // 13 Pan           (0–127, centre=63)
  64.0,   // 14 Volume        (0–127)
  64.0,   // 15 FilterAttack  (0–127)
  64.0,   // 16 FilterDecay   (0–127)
  1.0,    // 17 FilterSustain (0–1 internally)
  64.0,   // 18 FilterRelease (0–127)
  8000.0, // 19 FilterCutoff  (20–20000 Hz; ±8000 = dramatic sweep)
  1.0,    // 20 FilterResonance (0–1)
  1.0,    // 21 FilterEnvAmount (0–1)
];

function scaledDepth(depth: number, destination: number): number {
  const scale = LFO_DEPTH_SCALE[destination] ?? 1.0;
  return depth * scale;
}

/**
 * Watches the patch and sends only changed values to the WASM engine.
 * Uses a ref to track the previously-synced patch for efficient diffing.
 */
export function useEngineSync(patch: FMCanvasPatch): void {
  const prevRef        = useRef<FMCanvasPatch | null>(null);
  const carrierCountRef = useRef(4); // tracks live carrier count for carrier_mix normalization

  useEffect(() => {
    const current = patch;
    const prev = prevRef.current;

    // Per-connection depth matrix — send whenever matrix changes
    const matrixChanged = !prev
      || !prev.modDepthMatrix
      || prev.modDepthMatrix.some((v, i) => v !== current.modDepthMatrix[i]);
    if (matrixChanged) {
      setParam('set_mod_depth_matrix', new Float32Array(current.modDepthMatrix));
    }

    // Connections → custom routing (set AFTER depths)
    // Also update routing when feedback changes (affects self-loops)
    const connsChanged = !prev
      || prev.connections.length !== current.connections.length
      || prev.connections.some((c, i) =>
          c.src !== current.connections[i].src || c.dst !== current.connections[i].dst);

    const feedbackChanged = !prev || prev.operatorFeedback.some((fb, i) => fb !== current.operatorFeedback[i]);

    if (connsChanged || feedbackChanged) {
      // Include both user connections AND automatic self-loops for feedback
      const allConnections = [...current.connections];

      // Add self-loops for ALL operators that have feedback > 0
      // This enables feedback to work on carriers and modulators alike
      for (let opIndex = 0; opIndex < 4; opIndex++) {
        if (current.operatorFeedback[opIndex] > 0) {
          // Only add self-loop if not already present
          if (!allConnections.some(c => c.src === opIndex && c.dst === opIndex)) {
            allConnections.push({ src: opIndex, dst: opIndex, srcOffset: { x: 0, y: 0 }, dstOffset: { x: 0, y: 0 } });
          }
        }
      }

      const modFlat = new Uint32Array(allConnections.length * 2);
      for (let i = 0; i < allConnections.length; i++) {
        modFlat[i * 2] = allConnections[i].src;
        modFlat[i * 2 + 1] = allConnections[i].dst;
      }

      // A carrier is any operator that doesn't modulate anything else.
      // If an op is a source it becomes a pure modulator, regardless of
      // whether it is also being modulated (intermediate chain node).
      const srcSet = new Set(current.connections.filter(c => c.src !== c.dst).map(c => c.src));
      const carriers: number[] = [];
      for (let i = 0; i < 4; i++) {
        if (!srcSet.has(i)) carriers.push(i);
      }
      if (carriers.length === 0) carriers.push(0);

      const carrierFlat = new Uint32Array(carriers);
      carrierCountRef.current = carriers.length;
      console.log('[engine-sync] routing:', current.connections.map(c => `${c.src}→${c.dst}`).join(', '), 'carriers:', carriers);
      setParam('set_custom_routing', modFlat, carrierFlat);
      // Re-send carrier_mix normalized by new carrier count
      setParam('set_carrier_mix', current.carrierMix / carriers.length);

    }

    // Per-operator feedback
    for (let i = 0; i < 4; i++) {
      if (!prev || prev.operatorFeedback[i] !== current.operatorFeedback[i]) {
        console.log(`[engine-sync] operatorFeedback[${i}]: ${prev?.operatorFeedback[i] ?? 'initial'} → ${current.operatorFeedback[i]}`);
        setParam('set_operator_feedback', i, current.operatorFeedback[i]);
      }
    }

    // Per-operator detune (in cents, ±100)
    for (let i = 0; i < 4; i++) {
      if (!prev || prev.operatorDetune[i] !== current.operatorDetune[i]) {
        setParam('set_operator_detune', i, current.operatorDetune[i]);
      }
    }

    // Per-operator harm (wave-folding, -26 to +26)
    for (let i = 0; i < 4; i++) {
      if (!prev || prev.operatorHarm[i] !== current.operatorHarm[i]) {
        setParam('set_operator_harm', i, current.operatorHarm[i]);
      }
    }

    // Per-operator level (output volume, 0-127)
    for (let i = 0; i < 4; i++) {
      if (!prev || prev.operatorLevel[i] !== current.operatorLevel[i]) {
        setParam('set_operator_level', i, current.operatorLevel[i]);
      }
    }

    // Harm (global, legacy)
    if (!prev || prev.harm !== current.harm) {
      setParam('set_harm', current.harm);
    }

    // Carrier mix — normalize by carrier count to prevent clipping when multiple carriers sum
    if (!prev || prev.carrierMix !== current.carrierMix) {
      setParam('set_carrier_mix', current.carrierMix / Math.max(1, carrierCountRef.current));
    }

    // Detune
    if (!prev || prev.detune !== current.detune) {
      setParam('set_detune', current.detune);
    }

    // Amp envelope
    if (!prev || prev.ampAttack !== current.ampAttack || prev.ampDecay !== current.ampDecay || prev.ampSustain !== current.ampSustain || prev.ampRelease !== current.ampRelease) {
      setParam('set_amp_env', current.ampAttack, current.ampDecay, current.ampSustain, current.ampRelease);
    }

    if (!prev || prev.masterVolume !== current.masterVolume) {
    setParam('set_volume', current.masterVolume);
    }

    if (!prev || prev.masterPan !== current.masterPan) {
      // Rust pan formula: pan_norm = pan / 63, where 0 = center, ±63 = hard L/R
      // Patch stores 0–127 with 64 = center, so subtract 64 before sending
      setParam('set_pan', current.masterPan - 64);
    }

    if (!prev || prev.portamentoTime !== current.portamentoTime) {
    setParam('set_portamento_time', current.portamentoTime);
    }

    if (!prev || prev.pitchBendRange !== current.pitchBendRange) {
    setParam('set_pitch_bend_range', current.pitchBendRange);
    }

    if (!prev || prev.pitchBend !== current.pitchBend) {
    setParam('set_pitch_bend', current.pitchBend);
    }

    if (!prev || prev.masterOverdrive !== current.masterOverdrive) {
      setParam('set_overdrive', current.masterOverdrive);
    }

    if (!prev || prev.octave !== current.octave) {
      setParam('set_octave', current.octave);
    }

    // Filter type — also force-resend cutoff & resonance so engine has
    // correct biquad coefficients for the new filter mode
    if (!prev || prev.filterType !== current.filterType) {
      setParam('set_filter_type', current.filterType);
      const rawCutoff = Math.min(127, current.filterCutoff);
      setParam('set_filter_cutoff', 20 * Math.pow(1000, rawCutoff / 127));
      const rawRes = Math.min(127, current.filterResonance);
      setParam('set_filter_resonance', Math.max(0.5, 0.1 + (rawRes / 127) * 19.9));
    }

    // Filter cutoff — map 0-127 → 20-20000 Hz (logarithmic)
    // Clamp to 127 max to guard against stale sessions that stored raw Hz
    if (!prev || prev.filterCutoff !== current.filterCutoff) {
      const rawCutoff = Math.min(127, current.filterCutoff);
      const hz = 20 * Math.pow(1000, rawCutoff / 127);
      setParam('set_filter_cutoff', hz);
    }

    // Filter resonance — map 0-127 → 0.1-20 Q factor, min Q=0.5 for stability
    if (!prev || prev.filterResonance !== current.filterResonance) {
      const rawRes = Math.min(127, current.filterResonance);
      const q = Math.max(0.5, 0.1 + (rawRes / 127) * 19.9);
      setParam('set_filter_resonance', q);
    }

    // Filter envelope
    if (!prev || prev.filterEnvAttack !== current.filterEnvAttack) {
      setParam('set_filter_attack', current.filterEnvAttack);
    }
    if (!prev || prev.filterEnvDecay !== current.filterEnvDecay) {
      setParam('set_filter_decay', current.filterEnvDecay);
    }
    if (!prev || prev.filterEnvSustain !== current.filterEnvSustain) {
      setParam('set_filter_sustain', current.filterEnvSustain);
    }
    if (!prev || prev.filterEnvRelease !== current.filterEnvRelease) {
      setParam('set_filter_release', current.filterEnvRelease);
    }

    // Filter envelope amount
    if (!prev || prev.filterEnvAmount !== current.filterEnvAmount) {
      setParam('set_filter_env_amount', current.filterEnvAmount);
    }

    // Delay
    if (!prev || prev.delayEnabled !== current.delayEnabled) {
      setParam('set_delay_enabled', current.delayEnabled);
    }
    if (!prev || prev.delayMs !== current.delayMs) {
      setParam('set_delay_ms', current.delayMs);
    }
    if (!prev || prev.delayFeedback !== current.delayFeedback) {
      setParam('set_delay_feedback', current.delayFeedback);
    }
    if (!prev || prev.delayMix !== current.delayMix) {
      setParam('set_delay_mix', current.delayMix);
    }

    // Reverb
    if (!prev || prev.reverbEnabled !== current.reverbEnabled) {
      setParam('set_reverb_enabled', current.reverbEnabled);
    }
    if (!prev || prev.reverbDecay !== current.reverbDecay) {
      setParam('set_reverb_decay', current.reverbDecay);
    }
    if (!prev || prev.reverbDamping !== current.reverbDamping) {
      setParam('set_reverb_damping', current.reverbDamping);
    }
    if (!prev || prev.reverbMix !== current.reverbMix) {
      setParam('set_reverb_mix', current.reverbMix);
    }

    // Chorus
    if (!prev || prev.chorusEnabled !== current.chorusEnabled) {
      setParam('set_chorus_enabled', current.chorusEnabled);
    }
    if (!prev || prev.chorusDepth !== current.chorusDepth) {
      setParam('set_chorus_depth', current.chorusDepth);
    }
    if (!prev || prev.chorusSpeed !== current.chorusSpeed) {
      setParam('set_chorus_speed', current.chorusSpeed);
    }
    if (!prev || prev.chorusWidth !== current.chorusWidth) {
      setParam('set_chorus_width', current.chorusWidth);
    }
    if (!prev || prev.chorusHpfCutoff !== current.chorusHpfCutoff) {
      setParam('set_chorus_hpf_cutoff', current.chorusHpfCutoff);
    }
    if (!prev || prev.chorusDelayMs !== current.chorusDelayMs) {
      setParam('set_chorus_delay_ms', current.chorusDelayMs);
    }
    if (!prev || prev.chorusReverbSend !== current.chorusReverbSend) {
      setParam('set_chorus_reverb_send', current.chorusReverbSend);
    }

    // LFO 1
    if (!prev || prev.lfo1Speed !== current.lfo1Speed) setParam('set_lfo1_speed', current.lfo1Speed);
    if (!prev || prev.lfo1Depth !== current.lfo1Depth || prev.lfo1Destination !== current.lfo1Destination) {
      setParam('set_lfo1_depth', scaledDepth(current.lfo1Depth, current.lfo1Destination));
    }
    if (!prev || prev.lfo1Waveform !== current.lfo1Waveform) setParam('set_lfo1_waveform', current.lfo1Waveform);
    if (!prev || prev.lfo1Mode !== current.lfo1Mode) setParam('set_lfo1_mode', current.lfo1Mode);
    if (!prev || prev.lfo1Destination !== current.lfo1Destination) {
      setParam('set_lfo1_destination', current.lfo1Destination);
      // Re-send depth with new scale whenever destination changes
      setParam('set_lfo1_depth', scaledDepth(current.lfo1Depth, current.lfo1Destination));
    }
    if (!prev || prev.lfo1Multiplier !== current.lfo1Multiplier) setParam('set_lfo1_multiplier', current.lfo1Multiplier);
    if (!prev || prev.lfo1Fade !== current.lfo1Fade) setParam('set_lfo1_fade', current.lfo1Fade);

    // LFO 2
    if (!prev || prev.lfo2Speed !== current.lfo2Speed) setParam('set_lfo2_speed', current.lfo2Speed);
    if (!prev || prev.lfo2Depth !== current.lfo2Depth || prev.lfo2Destination !== current.lfo2Destination) {
      setParam('set_lfo2_depth', scaledDepth(current.lfo2Depth, current.lfo2Destination));
    }
    if (!prev || prev.lfo2Waveform !== current.lfo2Waveform) setParam('set_lfo2_waveform', current.lfo2Waveform);
    if (!prev || prev.lfo2Mode !== current.lfo2Mode) setParam('set_lfo2_mode', current.lfo2Mode);
    if (!prev || prev.lfo2Destination !== current.lfo2Destination) {
      setParam('set_lfo2_destination', current.lfo2Destination);
      // Re-send depth with new scale whenever destination changes
      setParam('set_lfo2_depth', scaledDepth(current.lfo2Depth, current.lfo2Destination));
    }
    if (!prev || prev.lfo2Multiplier !== current.lfo2Multiplier) setParam('set_lfo2_multiplier', current.lfo2Multiplier);
    if (!prev || prev.lfo2Fade !== current.lfo2Fade) setParam('set_lfo2_fade', current.lfo2Fade);

    // Per-operator mod envelopes (ADE)
    for (let i = 0; i < 4; i++) {
      const currEnv = current.operatorModEnv[i];
      const prevEnv = prev?.operatorModEnv[i];
      if (!prevEnv || prevEnv.attack !== currEnv.attack || prevEnv.decay !== currEnv.decay || prevEnv.end !== currEnv.end) {
        setParam('set_operator_mod_env', i, currEnv.attack, currEnv.decay, currEnv.end);
      }
    }

    // Per-operator params
    for (let i = 0; i < 4; i++) {
      const op = current.operators[i];
      const prevOp = prev?.operators[i];

      if (!prevOp || prevOp.ratio !== op.ratio) {
        switch (i) {
          case 0:
            setParam('set_ratio_c', op.ratio);
            break;
          case 1:
            setParam('set_ratio_a', op.ratio);
            break;
          case 2:
          case 3:
            setParam('set_ratio_b', current.operators[2].ratio, current.operators[3].ratio);
            break;
        }
      }

      if (!prev || current.operatorWaveforms[i] !== prev.operatorWaveforms[i]) {
        setParam('set_operator_waveform', i, current.operatorWaveforms[i]);
      }
    }

    // Bitcrush
    if (!prev || prev.bitcrushEnabled !== current.bitcrushEnabled || prev.bitcrushBits !== current.bitcrushBits || prev.bitcrushRate !== current.bitcrushRate) {
      setBitcrush(current.bitcrushEnabled, current.bitcrushBits, current.bitcrushRate);
    }

    // Snapshot for next diff
    prevRef.current = {
      ...current,
      operators: current.operators.map((op) => ({
        ...op,
        position: { ...op.position },
      })) as [any, any, any, any],
      connections: [...current.connections],
      selfLoops: [...current.selfLoops],
      operatorModEnv: current.operatorModEnv.map(env => ({ ...env })) as [any, any, any, any],
      operatorWaveforms: [...current.operatorWaveforms] as [any, any, any, any],
      operatorFeedback: [...current.operatorFeedback] as [number, number, number, number],
      operatorLevel: [...current.operatorLevel] as [number, number, number, number],
    };
  }, [patch]);
}
