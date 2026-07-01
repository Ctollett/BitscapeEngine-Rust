# TX-84

A 4-operator FM synthesizer with a visual patching canvas, built on a Rust/WebAssembly audio engine.

## Overview

TX-84 is a browser-based FM synth inspired by classic 4-operator hardware (think Yamaha's TX/DX series). The synthesis engine is written in Rust and compiled to WebAssembly for real-time audio, paired with a React canvas where you drag connections between operators to build your own algorithms instead of picking from a fixed list.

## Features

- 4-operator FM synthesis with freely patchable carrier/modulator routing, including feedback (self-loop) connections
- Visual patching canvas for building and rearranging algorithms by hand
- 8-voice polyphony
- Per-operator ADSR envelopes plus dedicated modulation envelopes
- Multi-destination LFO
- Resonant filter section
- Built-in chorus, reverb, and delay effects
- Real-time mod-depth debug panel for visualizing modulation as you patch

## Tech stack

- **Audio engine**: Rust, compiled to WebAssembly (`wasm-bindgen`)
- **Frontend**: React, TypeScript, Vite
- Custom design system tokens for the UI

## Development

```bash
# build the WASM audio engine
npm run build:wasm

# run the frontend
npm run dev

# production build
npm run build
```
