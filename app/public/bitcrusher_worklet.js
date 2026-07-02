class BitcrusherProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.enabled = false;
    this.bits = 8;
    this.rate = 0.25; // 0-1: fraction of full sample rate to keep
    this.holdCount = 0;
    this.held = [0, 0];

    this.port.onmessage = (e) => {
      const { type, value } = e.data;
      if (type === 'enabled') this.enabled = value;
      if (type === 'bits')    this.bits    = value;
      if (type === 'rate')    this.rate    = value;
    };
  }

  process(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!output[0]) return true;

    if (!this.enabled || !input[0]) {
      for (let ch = 0; ch < output.length; ch++) {
        if (input[ch]) output[ch].set(input[ch]);
      }
      return true;
    }

    const levels    = Math.pow(2, Math.max(1, this.bits));
    const holdFor   = Math.max(1, Math.round(1 / Math.max(0.01, this.rate)));

    for (let i = 0; i < output[0].length; i++) {
      if (this.holdCount % holdFor === 0) {
        for (let ch = 0; ch < 2; ch++) {
          const s = input[ch] ? input[ch][i] : 0;
          this.held[ch] = Math.round(s * levels) / levels;
        }
      }
      this.holdCount++;
      for (let ch = 0; ch < output.length; ch++) {
        output[ch][i] = this.held[ch] ?? 0;
      }
    }
    return true;
  }
}

registerProcessor('bitcrusher-processor', BitcrusherProcessor);
