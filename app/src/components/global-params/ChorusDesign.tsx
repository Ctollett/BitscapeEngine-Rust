import { useEffect, useRef } from 'react';
import { usePatch } from '../../fm-canvas/patch-context';
import { onNoteOn, onNoteOff } from '../../audio/note-events';

const STEP_X = 17.2;
const STEP_Y = 19.4;
const COPIES = [-4,-3,-2,-1,0,1,2,3,4];

const MAIN_D = "M88 9H70.8V28.4H53.6V47.8H36.4V67.2H19.2V86.6H2";
const TL_D   = "M35 1.75V21.15H17.8V40.55H0.6";
const BR_D   = "M80.8 48.5V67.9H63.6V87.3H46.4";

const STROKE = { stroke: "#3B9E8E", strokeWidth: 2, strokeMiterlimit: 10, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

export function ChorusDesign() {
  const { patch } = usePatch();
  const patchRef = useRef(patch);
  patchRef.current = patch;

  const mainRef = useRef<SVGGElement>(null);
  const tlRef   = useRef<SVGGElement>(null);
  const brRef   = useRef<SVGGElement>(null);

  const offsetRef   = useRef(0);
  const velocityRef = useRef(0);
  const activeNotes = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const offNoteOn  = onNoteOn(()  => { activeNotes.current += 1; });
    const offNoteOff = onNoteOff(() => { activeNotes.current = Math.max(0, activeNotes.current - 1); });
    return () => { offNoteOn(); offNoteOff(); };
  }, []);

  useEffect(() => {
    const tick = () => {
      const speed = patchRef.current.chorusSpeed;
      const targetVelocity = activeNotes.current > 0 ? (speed / 10) * 0.4 : 0;

      const stiffness = activeNotes.current > 0 ? 0.15 : 0.04;
      const damping   = activeNotes.current > 0 ? 0.85 : 0.97;
      velocityRef.current += (targetVelocity - velocityRef.current) * stiffness;
      velocityRef.current *= damping;

      offsetRef.current = (offsetRef.current + velocityRef.current) % STEP_X;
      const o  = offsetRef.current;
      const oy = o * (STEP_Y / STEP_X);

      if (mainRef.current) mainRef.current.setAttribute('transform', `translate(${-o},${oy})`);
      if (tlRef.current)   tlRef.current.setAttribute('transform',   `translate(${o},${-oy})`);
      if (brRef.current)   brRef.current.setAttribute('transform',   `translate(${o},${-oy})`);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <svg width="108" height="107" viewBox="0 0 90 89" fill="none" xmlns="http://www.w3.org/2000/svg" overflow="hidden">
      <g ref={mainRef}>
        {COPIES.map(n => <path key={n} d={MAIN_D} {...STROKE} transform={`translate(${n*STEP_X},${-n*STEP_Y})`} />)}
      </g>
      <g ref={tlRef}>
        {COPIES.map(n => <path key={n} d={TL_D} {...STROKE} transform={`translate(${-n*STEP_X},${n*STEP_Y})`} />)}
      </g>
      <g ref={brRef}>
        {COPIES.map(n => <path key={n} d={BR_D} {...STROKE} transform={`translate(${-n*STEP_X},${n*STEP_Y})`} />)}
      </g>
    </svg>
  );
}
