import { useRef, useState } from 'react';
import { colors, spacing } from '../tokens';
import { motion } from 'framer-motion';

const DIGIT_H = 14
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function ReelDigit({ digit, color }: { digit: number; color: string }) {
  return (
    <div style={{ height: DIGIT_H, overflow: 'hidden', width: '0.62em' }}>
      <motion.div
        animate={{ y: -digit * DIGIT_H }}
        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
      >
        {DIGITS.map(d => (
          <div key={d} style={{ height: DIGIT_H, lineHeight: `${DIGIT_H}px`, color }}>
            {d}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function ReelNumber({ value, color }: { value: number; color: string }) {
  const digits = String(value).padStart(3, '0').split('').map(Number)
  return (
    <div style={{ display: 'flex', fontSize: 11, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
      {digits.map((d, i) => <ReelDigit key={i} digit={d} color={color} />)}
    </div>
  )
}

interface PanelSliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
  worn?: boolean;
}

const TRACK_H = 140
const HANDLE_R = 6

export function PanelSlider({ value, onChange, label, color = '#4E7AAA', worn = false }: PanelSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [active, setActive] = useState(false);
  const filterId = useRef(`worn-${Math.random().toString(36).slice(2, 7)}`).current

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    setActive(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !trackRef.current) return;
    const { top, height } = trackRef.current.getBoundingClientRect();
    const y = e.clientY - top;
    onChange(Math.max(0, Math.min(1, 1 - y / height)))
  }

  const onPointerUp = () => {
    isDragging.current = false;
    setActive(false);
  }

  const fillH = value * TRACK_H
  const handleY = TRACK_H - fillH
  const handleR = active ? HANDLE_R + 4 : HANDLE_R

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none', WebkitUserSelect: 'none', gap: spacing.sm }}>
      <ReelNumber value={Math.round(value * 100)} color={color} />
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ cursor: 'pointer', position: 'relative', height: TRACK_H, width: 2, backgroundColor: colors.control.track, overflow: 'visible' }}
      >
        {worn ? (
          <svg
            width={50} height={TRACK_H}
            style={{ position: 'absolute', left: -24, top: 0, overflow: 'visible', pointerEvents: 'none' }}
          >
            <defs>
              <filter id={filterId} x="-60%" y="-10%" width="220%" height="120%" colorInterpolationFilters="sRGB">
                <feTurbulence type="turbulence" baseFrequency="0.06 0.04" numOctaves="4" seed="5" result="chipNoise" />
                <feColorMatrix in="chipNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -4 0 0 0 3.7" result="chipAlpha" />
                <feTurbulence type="turbulence" baseFrequency="0.55 0.018" numOctaves="2" seed="11" result="scratchNoise" />
                <feColorMatrix in="scratchNoise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 0 0 0 8.4" result="scratchAlpha" />
                <feComposite in="chipAlpha" in2="scratchAlpha" operator="arithmetic" k1="0" k2="1" k3="1" k4="-1" result="mask" />
                <feComposite in="SourceGraphic" in2="mask" operator="in" result="chipped" />
                <feTurbulence type="turbulence" baseFrequency="0.12" numOctaves="2" seed="3" result="disp" />
                <feDisplacementMap in="chipped" in2="disp" scale="1.2" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            {/* Fill */}
            <rect x={24} y={handleY} width={2} height={fillH} fill={color} filter={`url(#${filterId})`} rx={1} />
            {/* Handle ring */}
            <motion.circle
              cx={25} cy={handleY}
              animate={{ r: handleR + 3 }}
              transition={{ type: 'spring', stiffness: 200, damping: 35 }}
              fill="none" stroke={color} strokeWidth={1}
              filter={`url(#${filterId})`}
            />
            {/* Handle fill */}
            <circle
              cx={25} cy={handleY}
              r={HANDLE_R}
              fill={color}
              filter={`url(#${filterId})`}
            />
          </svg>
        ) : (
          <>
            <div style={{ position: 'absolute', backgroundColor: color, height: `${fillH}px`, width: 2, bottom: 0 }} />
            <motion.div
              transition={{ type: 'spring', stiffness: 200, damping: 35 }}
              animate={{ width: active ? 24 : 16, height: active ? 24 : 16 }}
              style={{ display: 'flex', justifyContent: 'center', bottom: fillH - HANDLE_R, left: '50%', transform: 'translateX(-50%)', position: 'absolute', alignItems: 'center', borderRadius: '50%', backgroundColor: 'transparent', border: `1px solid ${color}` }}
            >
              <div style={{ height: 12, width: 12, borderRadius: '50%', backgroundColor: color }} />
            </motion.div>
          </>
        )}
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 9, color: colors.text.muted, letterSpacing: 1, opacity: 0.6 }}>{label}</span>
    </div>
  );
}
