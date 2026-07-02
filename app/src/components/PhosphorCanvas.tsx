import { useRef, useEffect } from 'react'

const BG = '#E8E3D9'
const N = 800

interface Props {
  targets: number[]
  size: number
  color: string
  onRatioChange: (fx: number, fy: number) => void
}

export function PhosphorCanvas({ targets, size, color, onRatioChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const targetsRef = useRef(targets)
  const ratioRef = useRef(onRatioChange)
  targetsRef.current = targets
  ratioRef.current = onRatioChange

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

      phaseOffset += 0.003

      const fx    = 1 + springs[0].pos * 5
      const fy    = 1 + springs[1].pos * 5
      const phase = springs[2].pos * Math.PI * 2 + phaseOffset
      const decay = springs[3].pos * 0.4

      ratioRef.current(fx, fy)

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

      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2
        const r = R * Math.exp(-decay * t)
        const x = cx + r * Math.sin(fx * t + phase)
        const y = cy + r * Math.sin(fy * t)
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
