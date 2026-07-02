import { useEffect, useRef } from 'react';
import { usePatch } from '../../fm-canvas/patch-context';

const CX = 42;
const CY = 42;
const BALL_R = 7;
const OUTER_R = 41;
const BOUNDARY = OUTER_R - BALL_R;
const RING_RADII = [16, 19, 22, 25, 28, 31, 34, 37, 39, 41];
const INFLUENCE = [0.65, 0.58, 0.50, 0.42, 0.34, 0.26, 0.18, 0.10, 0.04, 0];
const MAX_RIPPLES = 15;

function getInfluenceAtRadius(r: number) {
  const t = Math.max(0, Math.min(1, (r - BALL_R) / (OUTER_R - BALL_R)));
  return INFLUENCE[0] * (1 - t);
}

interface Ripple { r: number; }
interface PendingRipple { spawnAt: number; }

export function DelayDesign() {
  const { patch } = usePatch();
  const patchRef = useRef(patch);
  patchRef.current = patch;

  const svgRef = useRef<SVGSVGElement>(null);
  const ballEl = useRef<SVGCircleElement>(null);
  const ringEls = useRef<SVGCircleElement[]>([]);
  const rippleEls = useRef<SVGCircleElement[]>([]);

  const ballPos = useRef({ x: CX, y: CY });
  const vel = useRef(() => {
    const a = Math.random() * 2 * Math.PI;
    return { dx: Math.cos(a), dy: Math.sin(a) };
  });
  const ripples = useRef<Ripple[]>([]);
  const pending = useRef<PendingRipple[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Init velocity
    const a = Math.random() * 2 * Math.PI;
    vel.current = () => ({ dx: Math.cos(a), dy: Math.sin(a) });
    const v = vel.current();
    (vel as any).current = v;

    // Pre-allocate ripple circles
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('stroke', '#4E7AAA');
      el.setAttribute('stroke-width', '1');
      el.setAttribute('fill', 'none');
      el.setAttribute('opacity', '0');
      el.setAttribute('r', '0');
      svg.insertBefore(el, svg.firstChild);
      rippleEls.current.push(el);
    }

    const tick = () => {
      const v = (vel as any).current as { dx: number; dy: number };
      const speed = 0.8 + (1 - patchRef.current.delayMs / 1000) * 1.8;
      const magnitude = Math.sqrt(v.dx ** 2 + v.dy ** 2);
      v.dx = (v.dx / magnitude) * speed;
      v.dy = (v.dy / magnitude) * speed;

      let nx = ballPos.current.x + v.dx;
      let ny = ballPos.current.y + v.dy;
      const dx = nx - CX;
      const dy = ny - CY;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);

      if (dist >= BOUNDARY) {
        const nx_ = dx / dist;
        const ny_ = dy / dist;
        const dot = v.dx * nx_ + v.dy * ny_;
        v.dx -= 2 * dot * nx_;
        v.dy -= 2 * dot * ny_;
        const nudge = (Math.random() - 0.5) * 1.0;
        const angle = Math.atan2(v.dy, v.dx) + nudge;
        v.dx = Math.cos(angle) * speed;
        v.dy = Math.sin(angle) * speed;
        nx = CX + nx_ * (BOUNDARY - 0.1);
        ny = CY + ny_ * (BOUNDARY - 0.1);

        const count = Math.max(1, Math.round(patchRef.current.delayFeedback * 5));
        const impactStrength = Math.min(1, speed / 2.6);
        const stagger = 8 + (1 - impactStrength) * 20;
        for (let i = 0; i < count; i++) {
          pending.current.push({ spawnAt: frameRef.current + i * stagger });
        }
      }

      ballPos.current = { x: nx, y: ny };
      frameRef.current += 1;

      pending.current = pending.current.filter(p => {
        if (frameRef.current >= p.spawnAt) {
          if (ripples.current.length < MAX_RIPPLES) {
            ripples.current.push({ r: BALL_R });
          }
          return false;
        }
        return true;
      });

      ripples.current = ripples.current
        .map(rp => ({ r: rp.r + 0.4 }))
        .filter(rp => rp.r < OUTER_R + 2);

      // Imperative DOM updates — no React re-render
      const mix = Math.max(0.2, patchRef.current.delayMix);
      const ringCount = Math.max(1, Math.round(patchRef.current.delayFeedback * RING_RADII.length));

      // Update ball
      if (ballEl.current) {
        ballEl.current.setAttribute('cx', String(ballPos.current.x));
        ballEl.current.setAttribute('cy', String(ballPos.current.y));
      }

      // Update membrane rings
      ringEls.current.forEach((el, i) => {
        if (i < ringCount) {
          const cx = CX + (ballPos.current.x - CX) * INFLUENCE[i];
          const cy = CY + (ballPos.current.y - CY) * INFLUENCE[i];
          el.setAttribute('cx', String(cx));
          el.setAttribute('cy', String(cy));
          el.setAttribute('opacity', '0');
        } else {
          el.setAttribute('opacity', '0');
        }
      });

      // Update ripple circles
      rippleEls.current.forEach((el, i) => {
        const rp = ripples.current[i];
        if (!rp) {
          el.setAttribute('opacity', '0');
        } else {
          const progress = (rp.r - BALL_R) / (OUTER_R - BALL_R);
          const opacity = Math.sin(progress * Math.PI) * 0.75 * mix;
          const inf = getInfluenceAtRadius(rp.r);
          const cx = CX + (ballPos.current.x - CX) * inf;
          const cy = CY + (ballPos.current.y - CY) * inf;
          el.setAttribute('r', String(rp.r));
          el.setAttribute('cx', String(cx));
          el.setAttribute('cy', String(cy));
          el.setAttribute('opacity', String(opacity));
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <svg ref={svgRef} width="100" height="100" viewBox="0 0 84 84" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx={CX} cy={CY} r={OUTER_R} stroke="#4E7AAA" strokeWidth={2} fill="none" />
      {RING_RADII.map((r, i) => (
        <circle key={i} ref={el => { if (el) ringEls.current[i] = el; }} cx={CX} cy={CY} r={r} stroke="#4E7AAA" strokeWidth={1} fill="none" opacity={0} />
      ))}
      <circle ref={ballEl} cx={CX} cy={CY} r={BALL_R} fill="#4E7AAA" />
    </svg>
  );
}
