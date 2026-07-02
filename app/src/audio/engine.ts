import { emitNoteOn, emitNoteOff } from './note-events';

let audioCtx: AudioContext | null = null;
let workletNode: AudioWorkletNode | null = null;
let bitcrusherNode: AudioWorkletNode | null = null;
let analyserL: AnalyserNode | null = null;
let ready = false;

export async function initAudio(): Promise<void> {
  if (audioCtx) {
    await audioCtx.resume();
    return;
  }

  audioCtx = new AudioContext();

  // Compile the WASM module on the main thread, pass it to the worklet
  const wasmBytes = await fetch('/wasm/synth_engine_bg.wasm').then((r) =>
    r.arrayBuffer()
  );
  const wasmModule = await WebAssembly.compile(wasmBytes);

  await audioCtx.audioWorklet.addModule('/synth_worklet.js');
  await audioCtx.audioWorklet.addModule('/bitcrusher_worklet.js');

  workletNode = new AudioWorkletNode(audioCtx, 'synth-processor', {
    outputChannelCount: [2],
    processorOptions: { wasmModule, sampleRate: audioCtx.sampleRate },
  });

  bitcrusherNode = new AudioWorkletNode(audioCtx, 'bitcrusher-processor', {
    outputChannelCount: [2],
  });

  analyserL = audioCtx.createAnalyser();
  analyserL.fftSize = 2048;
  analyserL.smoothingTimeConstant = 0.8;
  analyserL.minDecibels = -120;
  analyserL.maxDecibels = 0;

  // synth → bitcrusher → analyser → destination
  workletNode.connect(bitcrusherNode);
  bitcrusherNode.connect(analyserL);
  analyserL.connect(audioCtx.destination);

  return new Promise<void>((resolve) => {
    workletNode!.port.onmessage = (e) => {
      if (e.data.type === 'ready') {
        ready = true;
        // Init patch: clean sine, no effects
        setParam('set_delay_enabled', false);
        setParam('set_reverb_enabled', false);
        setParam('set_chorus_enabled', false);

        // Instant attack, full sustain, short release
        setParam('set_amp_env', 0, 0, 127, 10);

        // Init filter: LP type, fully open at 20kHz
        setParam('set_filter_type', 0);
        setParam('set_filter_cutoff', 20000);
        setParam('set_filter_resonance', 0.5);

        // No FM modulation — pure carrier sine
        setParam('set_mod_depth_a', 0.0);
        setParam('set_mod_depth_b', 0.0);

        // Different ratios per operator so routing changes are audible
        setParam('set_ratio_c', 1.0);
        setParam('set_ratio_a', 2.0);
        setParam('set_ratio_b', 3.0, 4.0);
        resolve();
      } else if (e.data.type === 'debug_routing') {
        const d = e.data;
        console.log(`[engine] routing applied:`, {
          algo: d.algo_name,
          routing: d.algo_diagram,
          depths: { a: d.mod_depth_a, b: d.mod_depth_b },
          ratios: { c: d.ratio_c, a: d.ratio_a, b1: d.ratio_b1, b2: d.ratio_b2 },
          feedback: d.feedback,
          carrierMix: d.carrier_mix,
          waveforms: d.op_wave,
        });
      } else if (e.data.type === 'debug_feedback') {
        const d = e.data;
        console.log(`[RUST-FB] Op${d.opIndex} feedback=${d.feedbackValue} last_output=${d.op_sample[d.opIndex]?.toFixed(3)}`);
      }
    };
  });
}

export function noteOn(noteId: number, freq: number): void {
  if (!ready || !workletNode) return;
  workletNode.port.postMessage({ type: 'note_on', args: [noteId, freq] });
  emitNoteOn(noteId, freq);
}

export function noteOff(noteId: number): void {
  if (!ready || !workletNode) return;
  workletNode.port.postMessage({ type: 'note_off', args: [noteId] });
  emitNoteOff(noteId);
}

export function setParam(fn: string, ...args: (number | boolean | Uint32Array | Float32Array)[]): void {
  if (!ready || !workletNode) return;
  workletNode.port.postMessage({ type: 'param', fn, args });
}

export function setBitcrush(enabled: boolean, bits: number, rate: number): void {
  if (!bitcrusherNode) return;
  bitcrusherNode.port.postMessage({ type: 'enabled', value: enabled });
  bitcrusherNode.port.postMessage({ type: 'bits',    value: bits });
  bitcrusherNode.port.postMessage({ type: 'rate',    value: rate });
}

export function isReady(): boolean {
  return ready;
}

/** Returns RMS level in range [0, 1] (mono mix). */
export function getLevels(): { l: number; r: number } {
  if (!analyserL) return { l: 0, r: 0 };
  const buf = new Float32Array(analyserL.fftSize);
  analyserL.getFloatTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / buf.length);
  return { l: rms, r: rms };
}

/** Returns time-domain samples for the oscilloscope. */
export function getWaveform(): Float32Array {
  if (!analyserL) return new Float32Array(0);
  const buf = new Float32Array(analyserL.fftSize);
  analyserL.getFloatTimeDomainData(buf);
  return buf;
}

/**
 * Returns frequency-domain data as Uint8Array (0–255).
 * Maps analyser.minDecibels–maxDecibels (−120–0 dBFS) to 0–255.
 */
export function getSpectrum(): { data: Uint8Array; binCount: number; nyquist: number } {
  if (!analyserL || !audioCtx) return { data: new Uint8Array(0), binCount: 0, nyquist: 0 };
  const data = new Uint8Array(analyserL.frequencyBinCount);
  analyserL.getByteFrequencyData(data);
  return { data, binCount: analyserL.frequencyBinCount, nyquist: audioCtx.sampleRate / 2 };
}
