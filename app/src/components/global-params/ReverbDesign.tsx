import { useEffect, useRef } from 'react';
import { usePatch } from '../../fm-canvas/patch-context';
import { onNoteOn, onNoteOff } from '../../audio/note-events';

const BASE_RX = 13.37;
const BASE_RY = 41;
const CX_CENTER = 34.60;
const CY = 42;
const SPAWN_INTERVAL = 18;
const MAX_RIPPLES = 20;

interface Ripple {
  offset: number;
  speed: number;
  fade: number;
  echoIndex: number;
}

interface Impulse {
  amplitude: number;
  phase: number;
}

export function ReverbDesign() {
  const { patch } = usePatch();
  const patchRef = useRef(patch);
  patchRef.current = patch;

  const svgRef = useRef<SVGSVGElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const impulses = useRef<Impulse[]>([]);
  const frameRef = useRef(0);
  const activeNotes = useRef(0);
  const nextAutoSpawn = useRef(0);
  const echoCounter = useRef(0);
  const rafRef = useRef<number>(0);

  const rippleEls = useRef<Array<{ l: SVGEllipseElement; r: SVGEllipseElement }>>([]);
  const staticEls = useRef<[SVGGElement | null, SVGGElement | null]>([null, null]);

  const spawnRipple = (echoIndex: number) => {
    if (ripples.current.length >= MAX_RIPPLES) return;
    ripples.current.push({ offset: 0, speed: 1.2, fade: 1.0, echoIndex });
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    for (let i = 0; i < MAX_RIPPLES; i++) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      const r = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      for (const el of [l, r]) {
        el.setAttribute('rx', String(BASE_RX));
        el.setAttribute('ry', String(BASE_RY));
        el.setAttribute('cy', String(CY));
        el.setAttribute('stroke', '#D94F2B');
        el.setAttribute('stroke-width', '1.5');
        el.setAttribute('fill', 'none');
        el.setAttribute('opacity', '0');
        svg.insertBefore(el, svg.firstChild);
      }
      rippleEls.current.push({ l, r });
    }

    const offNoteOn = onNoteOn(() => {
      activeNotes.current += 1;
      echoCounter.current = 0;
      spawnRipple(0);
      // kick an impulse for the breath
      impulses.current.push({ amplitude: 1.0, phase: Math.PI / 2 });
    });
    const offNoteOff = onNoteOff(() => {
      activeNotes.current = Math.max(0, activeNotes.current - 1);
    });

    const tick = () => {
      if (activeNotes.current > 0 && frameRef.current >= nextAutoSpawn.current) {
        echoCounter.current += 1;
        spawnRipple(echoCounter.current);
        nextAutoSpawn.current = frameRef.current + SPAWN_INTERVAL;
      }

      const fadeRate = 0.003 + (1 - patchRef.current.reverbDecay) * 0.04;
      const damping = patchRef.current.reverbDamping;
      const mix = Math.max(0.15, patchRef.current.reverbMix);
      const maxSpread = 20.23 * 1.5;
      const deceleration = 0.97 - damping * 0.055;

      ripples.current = ripples.current
        .map(rp => {
          const speed = rp.speed * deceleration;
          return { ...rp, speed, offset: rp.offset + speed, fade: rp.fade * (1 - fadeRate) };
        })
        .filter(rp => rp.fade > 0.01 && rp.speed > 0.02 && rp.offset < maxSpread + 10);

      // Decay impulses
      const breathDecay = 0.015 + (1 - patchRef.current.reverbDecay) * 0.03;
      impulses.current = impulses.current
        .map(imp => ({ amplitude: imp.amplitude * (1 - breathDecay), phase: imp.phase + 0.08 }))
        .filter(imp => imp.amplitude > 0.005);

      // Compute breath scales for each static ellipse (slight phase offset for organic feel)
      const breathScales = [0, Math.PI * 0.4].map(phaseOffset => {
        const displacement = impulses.current.reduce((sum, imp) =>
          sum + imp.amplitude * Math.sin(imp.phase + phaseOffset), 0);
        return 1 + 0.15 * displacement;
      });

      // Update ripple elements
      for (let i = 0; i < MAX_RIPPLES; i++) {
        const rp = ripples.current[i];
        const els = rippleEls.current[i];
        if (!rp) {
          els.l.setAttribute('opacity', '0');
          els.r.setAttribute('opacity', '0');
        } else {
          const fadeIn = Math.min(1, rp.offset / 8);
          const opacity = String(fadeIn * rp.fade * 0.85 * mix);
          els.l.setAttribute('cx', String((CX_CENTER - 7) - rp.offset));
          els.r.setAttribute('cx', String((CX_CENTER + 7) + rp.offset));
          els.l.setAttribute('opacity', opacity);
          els.r.setAttribute('opacity', opacity);
        }
      }

      // Update static ellipse breath via transform
      const cxs = [CX_CENTER - 7, CX_CENTER + 7];
      staticEls.current.forEach((g, i) => {
        if (g) {
          const s = breathScales[i];
          const cx = cxs[i];
          g.setAttribute('transform', `translate(${cx}, ${CY}) scale(${s}) translate(${-cx}, ${-CY})`);
        }
      });

      frameRef.current += 1;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      offNoteOn();
      offNoteOff();
    };
  }, []);

  return (
    <svg ref={svgRef} width="84" height="100" viewBox="0 0 70 84" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <g ref={el => { staticEls.current[0] = el; }}>
        <ellipse cx={CX_CENTER - 7} cy={CY} rx={BASE_RX} ry={BASE_RY} stroke="#D94F2B" strokeWidth={2} fill="none" />
      </g>
      <g ref={el => { staticEls.current[1] = el; }}>
        <ellipse cx={CX_CENTER + 7} cy={CY} rx={BASE_RX} ry={BASE_RY} stroke="#D94F2B" strokeWidth={2} fill="none" />
      </g>
    </svg>
  );
}
