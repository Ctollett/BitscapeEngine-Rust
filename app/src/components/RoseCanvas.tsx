import { useRef, useEffect } from 'react'

const BG = '#E8E3D9'
const N = 1000

const ROSE_NAMES: Record<number, string> = {
  1: 'RHODON',
  2: 'QUADRIFOLIUM',
  3: 'TRIFOLIUM',
  4: 'OCTAFOIL',
  5: 'PENTAFOIL',
  6: 'DODECAFOIL',
  7: 'HEPTAFOIL',
}

export function getRoseLabel(k: number): { label: string; name: string | null } {
  const label = `k = ${k.toFixed(2)}`
  const rounded = Math.round(k)
  const name = Math.abs(k - rounded) < 0.08 ? (ROSE_NAMES[rounded] ?? null) : null
  return { label, name }
}

interface Props {
  targets: number[]
  size: number
  color: string
  onKChange: (k: number) => void
}

export function RoseCanvas({ targets, size, color, onKChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetsRef = useRef(targets)
  const callbackRef = useRef(onKChange)
  targetsRef.current = targets
  callbackRef.current = onKChange

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    const R = size / 2 - 20
    const cx = size / 2
    const cy = size / 2

    const springs = targetsRef.current.map(v => ({ pos: v, vel: 0 }))
    let phaseOffset = 0
    let rafId = 0

    function tick() {
      const targets = targetsRef.current

      for (let i = 0; i < 4; i++) {
        const s = springs[i]
        s.vel += (targets[i] - s.pos) * 0.055
        s.vel *= 0.76
        s.pos += s.vel
      }

      phaseOffset += 0.002

      const k     = 1 + springs[0].pos * 6
      const phase = springs[1].pos * Math.PI * 2 + phaseOffset
      const scale = 0.6 + springs[2].pos * 0.4
      const decay = springs[3].pos * 0.4

      callbackRef.current(k)

      ctx.fillStyle = BG
      ctx.fillRect(0, 0, size, size)

      // Grid
      ctx.save()
      ctx.setLineDash([2, 8])
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'rgba(42, 41, 38, 0.18)'
      for (let i = 1; i <= 31; i++) {
        const f = (i / 32) * size
        ctx.beginPath(); ctx.moveTo(0, f); ctx.lineTo(size, f); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(f, 0); ctx.lineTo(f, size); ctx.stroke()
      }
      ctx.strokeStyle = 'rgba(42, 41, 38, 0.28)'
      ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke()
      ctx.restore()

      // Rose curve: r = cos(k·θ), with optional decay
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const theta = (i / N) * Math.PI * 2
        const r = R * scale * Math.cos(k * theta) * Math.exp(-decay * theta)
        const x = cx + r * Math.cos(theta + phase)
        const y = cy + r * Math.sin(theta + phase)
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.stroke()

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [size, color])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ display: 'block', backgroundColor: BG, borderRadius: 4 }}
    />
  )
}
