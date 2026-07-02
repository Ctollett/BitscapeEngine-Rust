import { useState, useRef, useCallback } from 'react';
import { PanelSlider } from './PanelSlider';
import { PhosphorCanvas } from './PhosphorCanvas';
import { RoseCanvas, getRoseLabel } from './RoseCanvas';
import { colors, spacing } from '../tokens';

const SIZE = 340
const MATTE = '#2A2926'
const VINTAGE_BLUE = '#1A5DB5'
const VINTAGE_RED  = '#B83F22'
const TEXT_BLUE = '#7A9DBF'
const TEXT_RED  = '#C07060'

const INTERVALS: Record<string, string> = {
  '1:1': 'UNISON',
  '2:1': 'OCTAVE',   '1:2': 'OCTAVE',
  '3:1': 'TWELFTH',  '1:3': 'TWELFTH',
  '3:2': 'PERFECT FIFTH',  '2:3': 'PERFECT FIFTH',
  '4:3': 'PERFECT FOURTH', '3:4': 'PERFECT FOURTH',
  '5:4': 'MAJOR THIRD',    '4:5': 'MAJOR THIRD',
  '6:5': 'MINOR THIRD',    '5:6': 'MINOR THIRD',
  '5:3': 'MAJOR SIXTH',    '3:5': 'MAJOR SIXTH',
  '5:2': 'MAJOR TENTH',    '2:5': 'MAJOR TENTH',
  '4:1': 'DOUBLE OCTAVE',  '1:4': 'DOUBLE OCTAVE',
  '5:1': 'THIRD + OCTAVE', '1:5': 'THIRD + OCTAVE',
  '6:1': 'FIFTH + OCTAVE', '1:6': 'FIFTH + OCTAVE',
}

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b) }

function getRatioLabel(fx: number, fy: number): { ratio: string; name: string | null } {
  const a = Math.round(fx)
  const b = Math.round(fy)
  const ratio = `${fx.toFixed(1)} : ${fy.toFixed(1)}`
  if (Math.abs(fx - a) > 0.12 || Math.abs(fy - b) > 0.12) return { ratio, name: null }
  const g = gcd(a, b)
  const name = INTERVALS[`${a / g}:${b / g}`] ?? null
  return { ratio, name }
}

const CARD_STYLE = {
  position: 'relative' as const,
  background: colors.bg.panel,
  borderRadius: 20,
  border: '1px solid rgba(0,0,0,0.10)',
  padding: spacing.xl,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'flex-start' as const,
  gap: spacing['2xl'],
  boxShadow: [
    // Elevation
    '0 28px 72px rgba(0,0,0,0.28)',
    '0 10px 28px rgba(0,0,0,0.18)',
    '0 3px 8px rgba(0,0,0,0.12)',
    // Inner bevel — light from top-left
    'inset 0 1px 0 rgba(255,255,255,0.80)',
    'inset 1px 0 0 rgba(255,255,255,0.50)',
    'inset 0 -1px 0 rgba(0,0,0,0.12)',
    'inset -1px 0 0 rgba(0,0,0,0.08)',
  ].join(', '),
}

export function ShowcasePanel() {
  const [lissValues, setLissValues] = useState([0.2, 0.4, 0.2, 0.0])
  const [roseValues, setRoseValues] = useState([0.3, 0.0, 0.8, 0.0])

  const ratioTextRef = useRef<HTMLSpanElement>(null)
  const nameTextRef  = useRef<HTMLSpanElement>(null)
  const kTextRef     = useRef<HTMLSpanElement>(null)
  const kNameTextRef = useRef<HTMLSpanElement>(null)

  const { ratio: initialRatio, name: initialName } = getRatioLabel(1 + lissValues[0] * 5, 1 + lissValues[1] * 5)
  const { label: initialK, name: initialKName } = getRoseLabel(1 + roseValues[0] * 6)

  const handleRatioChange = useCallback((fx: number, fy: number) => {
    const { ratio, name } = getRatioLabel(fx, fy)
    if (ratioTextRef.current) ratioTextRef.current.textContent = ratio
    if (nameTextRef.current)  nameTextRef.current.textContent  = name ?? ''
  }, [])

  const handleKChange = useCallback((k: number) => {
    const { label, name } = getRoseLabel(k)
    if (kTextRef.current)     kTextRef.current.textContent     = label
    if (kNameTextRef.current) kNameTextRef.current.textContent = name ?? ''
  }, [])

  const lissSliders = [
    { label: 'X FREQ', i: 0 },
    { label: 'Y FREQ', i: 1 },
    { label: 'PHASE',  i: 2 },
    { label: 'DECAY',  i: 3 },
  ]

  const roseSliders = [
    { label: 'K',     i: 0 },
    { label: 'PHASE', i: 1 },
    { label: 'SIZE',  i: 2 },
    { label: 'DECAY', i: 3 },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg.app,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.55, mixBlendMode: 'multiply' }} aria-hidden>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paper-grain)" />
      </svg>

      <div style={{ display: 'flex', gap: spacing.xl, alignItems: 'flex-start' }}>

        {/* Lissajous card */}
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ margin: 0, fontFamily: '"Söhne", "Sohne", system-ui, sans-serif', fontWeight: 600, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', color: MATTE }}>
              Lissajous
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span ref={ratioTextRef} style={{ fontFamily: 'monospace', fontSize: 10, color: TEXT_BLUE, letterSpacing: 1 }}>{initialRatio}</span>
              <span ref={nameTextRef}  style={{ fontFamily: 'monospace', fontSize: 7,  color: TEXT_BLUE, opacity: 0.6, letterSpacing: 1.5 }}>{initialName ?? ''}</span>
            </div>
          </div>

          <PhosphorCanvas targets={lissValues} size={SIZE} color={VINTAGE_BLUE} onRatioChange={handleRatioChange} />

          <div style={{ display: 'flex', gap: spacing['2xl'], alignSelf: 'center' }}>
            {lissSliders.map(({ label, i }) => (
              <PanelSlider
                key={label}
                value={lissValues[i]}
                onChange={(v) => setLissValues(prev => prev.map((val, j) => j === i ? v : val))}
                label={label}
                color={VINTAGE_BLUE}
                worn
              />
            ))}
          </div>
        </div>

        {/* Rose curve card */}
        <div style={CARD_STYLE}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h1 style={{ margin: 0, fontFamily: '"Söhne", "Sohne", system-ui, sans-serif', fontWeight: 600, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', color: MATTE }}>
              Rhodonea
            </h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span ref={kTextRef}     style={{ fontFamily: 'monospace', fontSize: 10, color: TEXT_RED, letterSpacing: 1 }}>{initialK}</span>
              <span ref={kNameTextRef} style={{ fontFamily: 'monospace', fontSize: 7,  color: TEXT_RED, opacity: 0.6, letterSpacing: 1.5 }}>{initialKName ?? ''}</span>
            </div>
          </div>

          <RoseCanvas targets={roseValues} size={SIZE} color={VINTAGE_RED} onKChange={handleKChange} />

          <div style={{ display: 'flex', gap: spacing['2xl'], alignSelf: 'center' }}>
            {roseSliders.map(({ label, i }) => (
              <PanelSlider
                key={label}
                value={roseValues[i]}
                onChange={(v) => setRoseValues(prev => prev.map((val, j) => j === i ? v : val))}
                label={label}
                color={VINTAGE_RED}
                worn
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
