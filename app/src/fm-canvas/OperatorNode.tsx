import { usePatch } from './patch-context';
import { useRef, useCallback, useEffect } from 'react';
import { onNoteOn, onNoteOff } from '../audio/note-events';


import {
  NODE_RADIUS,
  RING_RADIUS,
  OPERATOR_COLORS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './constants';

import type { Point, FMCanvasPatch } from './types'


const WAVE_W = 64;
const WAVE_H = 38;

function evalWave(type: number, t: number): number {
  const p = ((t % 1) + 1) % 1
  switch (type) {
    case 0: return Math.sin(p * Math.PI * 2)
    case 1: return p < 0.5 ? 1 : -1
    case 2: return 1 - 2 * p
    case 3: return p < 0.5 ? 4 * p - 1 : 3 - 4 * p
    case 4: {
      const h = Math.sin(t * 127.1 + 311.7) * 43758.5453
      return (h - Math.floor(h)) * 2 - 1
    }
    default: return Math.sin(p * Math.PI * 2)
  }
}

function computeFMWavePath(opIndex: number, patch: FMCanvasPatch, phase: number): string {
  const N = 80
  const periods = 2
  const carrierRatio = patch.operators[opIndex].ratio
  const carrierWave = patch.operatorWaveforms[opIndex]
  const modulators = patch.connections.filter(c => c.dst === opIndex && c.src !== opIndex)

  const mid = WAVE_H / 2
  const amp = WAVE_H / 2 - 3

  const parts: string[] = []
  for (let i = 0; i <= N; i++) {
    const u = i / N
    const x = u * WAVE_W
    const t = u * periods

    let modSig = 0
    for (const conn of modulators) {
      const modRatio = patch.operators[conn.src].ratio
      const modWave = patch.operatorWaveforms[conn.src]
      const depth = (patch.modDepthMatrix[conn.src * 4 + opIndex] ?? 0) / 127
      const β = depth * depth * 7
      modSig += β * evalWave(modWave, t * modRatio + phase * (modRatio / Math.max(0.001, carrierRatio)))
    }

    const sample = evalWave(carrierWave, t + phase + modSig)
    const y = mid - amp * sample
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

interface OperatorNodeProps {
  opIndex: number;
  isCarrier: boolean;
  onStartConnection: (opIndex: number) => void;
  onEndConnection: (opIndex: number) => void;
  onOpenDetail: (opIndex: number) => void;
  onSelect: (opIndex: number) => void;
  isSelected: boolean;
  onDragMove?: (opIndex: number, pos: Point) => void;
  dragPos?: Point | null;
  isTargetable?: boolean;
  isConnectionSource?: boolean;
  getPullToward?: () => Point | null;
  onPullStrength?: (strength: number) => void;
}

function deformedRingPath(cx: number, cy: number, radius: number, pullX: number, pullY: number, pullStrength?: number): string {
  const pullAngle = Math.atan2(pullY - cy, pullX - cx)
  const dist = Math.sqrt((pullX - cx) ** 2 + (pullY - cy) ** 2)
  const pullAmount = pullStrength !== undefined ? pullStrength : Math.min(dist * 0.03, radius * 0.08)
  const N = 80
  const points: string[] = []
  for (let i = 0; i < N; i++) {
    const θ = (i / N) * 2 * Math.PI
    const angleDiff = θ - pullAngle
    const factor = Math.max(0, Math.cos(angleDiff)) ** 8
    const r = radius + pullAmount * factor
    points.push(`${cx + r * Math.cos(θ)},${cy + r * Math.sin(θ)}`)
  }
  return `M ${points.join(' L ')} Z`
}

export function OperatorNode({
  opIndex,
  isCarrier: _isCarrier,
  onStartConnection,
  onEndConnection,
  onOpenDetail: _onOpenDetail,
  onSelect,
  isSelected,
  onDragMove,
  dragPos,
  isTargetable,
  isConnectionSource,
  getPullToward,
  onPullStrength,
}: OperatorNodeProps) {
  const { patch, dispatch } = usePatch();
  const op = patch.operators[opIndex];

  const nodeRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(0)
  const pendingPos = useRef({x: 0, y: 0})
  const ringPathRef = useRef<SVGPathElement | null>(null)
  const ringCircleRef = useRef<SVGCircleElement | null>(null)
  const wavePathRef = useRef<SVGPathElement | null>(null)
  const waveSvgRef = useRef<SVGSVGElement | null>(null)
  const labelRef = useRef<HTMLSpanElement | null>(null)
  const bumpAmountRef = useRef(0)
  const pullDirRef = useRef<{ x: number; y: number } | null>(null)
  const wasTensionRef = useRef(false)
  const springPosRef = useRef(0)
  const springVelRef = useRef(0)
  const springingRef = useRef(false)
  const getPullRef = useRef(getPullToward)
  const onPullStrengthRef = useRef(onPullStrength)
  const opPosRef = useRef(op.position)
  const phaseRef = useRef(0)
  const patchRef = useRef(patch)
  const isPlayingRef = useRef(false)
  const windingDownRef = useRef(false)
  const windFrameRef = useRef(0)
  const dragPosRef = useRef<Point | null>(null)
  getPullRef.current = getPullToward
  onPullStrengthRef.current = onPullStrength
  opPosRef.current = op.position
  patchRef.current = patch
  dragPosRef.current = dragPos ?? null

  // Ring deformation RAF — owns display and d attributes directly (React never sets them)
  useEffect(() => {
    if (ringPathRef.current) ringPathRef.current.style.display = 'none'

    let raf: number
    const tick = () => {
      const target = getPullRef.current?.()
      const { x: cx, y: cy } = opPosRef.current
      const pathEl = ringPathRef.current
      const circleEl = ringCircleRef.current

      const showBump = (amount: number) => {
        const d = pullDirRef.current
        if (!pathEl || !circleEl || !d) return
        pathEl.setAttribute('d', deformedRingPath(cx, cy, RING_RADIUS, cx + d.x * 9999, cy + d.y * 9999, amount))
        pathEl.style.display = ''
        circleEl.style.display = 'none'
      }
      const showCircle = () => {
        if (!pathEl || !circleEl) return
        pathEl.style.display = 'none'
        circleEl.style.display = ''
      }

      // Connection-drag source: deform ring toward mouse cursor
      const connDrag = dragPosRef.current
      if (connDrag) {
        const dx = connDrag.x - cx
        const dy = connDrag.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 0) pullDirRef.current = { x: dx / dist, y: dy / dist }
        const pullStrength = Math.min(dist * 0.025, RING_RADIUS * 0.45)
        bumpAmountRef.current += (pullStrength - bumpAmountRef.current) * 0.12
        wasTensionRef.current = true
        showBump(bumpAmountRef.current)
        raf = requestAnimationFrame(tick); return
      }

      if (target) {
        const dx = target.x - cx
        const dy = target.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const pullStrength = Math.min(dist * 0.025, RING_RADIUS * 0.28)

        if (pullStrength > 0.5) {
          if (dist > 0) pullDirRef.current = { x: dx / dist, y: dy / dist }
          bumpAmountRef.current += (pullStrength - bumpAmountRef.current) * 0.15
          wasTensionRef.current = true
          showBump(bumpAmountRef.current)
          onPullStrengthRef.current?.(bumpAmountRef.current)
          raf = requestAnimationFrame(tick); return
        }
      }

      if (wasTensionRef.current) {
        wasTensionRef.current = false
        springingRef.current = true
        springPosRef.current = bumpAmountRef.current
        springVelRef.current = 0
        bumpAmountRef.current = 0
      }

      if (springingRef.current) {
        springVelRef.current += -0.18 * springPosRef.current
        springVelRef.current *= 0.72
        springPosRef.current += springVelRef.current

        if (Math.abs(springPosRef.current) < 0.08 && Math.abs(springVelRef.current) < 0.02) {
          springingRef.current = false
          springPosRef.current = 0
          springVelRef.current = 0
          showCircle()
          onPullStrengthRef.current?.(0)
        } else {
          if (Math.abs(springPosRef.current) > 0.1) {
            showBump(springPosRef.current)
            onPullStrengthRef.current?.(Math.max(0, springPosRef.current))
          } else {
            showCircle()
            onPullStrengthRef.current?.(0)
          }
        }
      } else {
        showCircle()
        onPullStrengthRef.current?.(0)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    let activeNotes = 0
    let releaseTimer: ReturnType<typeof setTimeout> | null = null
    const off1 = onNoteOn(() => {
      activeNotes++
      if (releaseTimer !== null) { clearTimeout(releaseTimer); releaseTimer = null }
      isPlayingRef.current = true
      windingDownRef.current = false
      windFrameRef.current = 0
    })
    const off2 = onNoteOff(() => {
      activeNotes = Math.max(0, activeNotes - 1)
      if (activeNotes === 0) {
        const rel = patchRef.current.ampRelease
        const releaseMs = rel === 0 ? 0 : rel === 127 ? 12000 : (rel / 126) * 10000
        releaseTimer = setTimeout(() => {
          isPlayingRef.current = false
          windingDownRef.current = true
          windFrameRef.current = 0
        }, releaseMs)
      }
    })
    return () => { off1(); off2(); if (releaseTimer !== null) clearTimeout(releaseTimer) }
  }, [])

  // Waveform animation RAF — React never sets `d` on wavePathRef (no d prop in JSX)
  useEffect(() => {
    if (wavePathRef.current) {
      wavePathRef.current.setAttribute('d', computeFMWavePath(opIndex, patchRef.current, phaseRef.current))
    }
    let waveRaf: number
    const tick = () => {
      if (isPlayingRef.current) {
        phaseRef.current += 0.006 * patchRef.current.operators[opIndex].ratio
        if (wavePathRef.current) {
          wavePathRef.current.setAttribute('d', computeFMWavePath(opIndex, patchRef.current, phaseRef.current))
        }
      } else if (windingDownRef.current) {
        const DURATION = 55
        windFrameRef.current++
        const t = Math.min(windFrameRef.current / DURATION, 1)
        // easeOutBack: decelerates to 0 with a slight overshoot (reverses briefly)
        const c = 1.2
        const speed = -(c + 1) * Math.pow(t - 1, 3) - c * Math.pow(t - 1, 2)
        if (t >= 1) {
          windingDownRef.current = false
        } else {
          phaseRef.current += 0.006 * patchRef.current.operators[opIndex].ratio * speed
          if (wavePathRef.current) {
            wavePathRef.current.setAttribute('d', computeFMWavePath(opIndex, patchRef.current, phaseRef.current))
          }
        }
      } else {
        // Idle: redraw static waveform so patch changes (waveform type, mod depth) are reflected immediately
        if (wavePathRef.current) {
          wavePathRef.current.setAttribute('d', computeFMWavePath(opIndex, patchRef.current, phaseRef.current))
        }
      }
      waveRaf = requestAnimationFrame(tick)
    }
    waveRaf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(waveRaf)
  }, [opIndex])

  const flushPosition = useCallback(() => {
    const { x, y } = pendingPos.current
    dispatch({ type: 'MOVE_OPERATOR', opIndex, position: { x, y } })
    if (nodeRef.current) {
      nodeRef.current.style.left = x - NODE_RADIUS + 'px'
      nodeRef.current.style.top = y - NODE_RADIUS + 'px'
    }
    if (waveSvgRef.current) {
      waveSvgRef.current.style.left = x - WAVE_W / 2 + 'px'
      waveSvgRef.current.style.top = y - WAVE_H / 2 - 6 + 'px'
    }
    if (labelRef.current) {
      labelRef.current.style.left = x + 'px'
      labelRef.current.style.top = y + WAVE_H / 2 + 4 + 'px'
    }
    rafRef.current = 0;
  }, [dispatch, opIndex]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    onSelect(opIndex)
    e.stopPropagation()
    const canvas = nodeRef.current?.parentElement?.getBoundingClientRect()
    if (!canvas) return
    const pointerX = e.clientX - canvas.left;
    const pointerY = e.clientY - canvas.top;
    dragStartRef.current = { x: pointerX - op.position.x, y: pointerY - op.position.y }
    isDraggingRef.current = true;
    nodeRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerDownRing = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    document.body.style.cursor = 'grabbing'
    onStartConnection(opIndex)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const canvas = nodeRef.current?.parentElement?.getBoundingClientRect()
    if (!isDraggingRef.current) return;
    if (!canvas) return
    const pointerX = e.clientX - canvas.left;
    const pointerY = e.clientY - canvas.top;
    const newPos = { x: Math.max(NODE_RADIUS, Math.min(CANVAS_WIDTH - NODE_RADIUS, pointerX - dragStartRef.current.x)), y: Math.max(NODE_RADIUS, Math.min(CANVAS_HEIGHT - NODE_RADIUS, pointerY - dragStartRef.current.y)) }
    pendingPos.current = newPos;
    onDragMove?.(opIndex, newPos)
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushPosition)
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    document.body.style.cursor = ''
    nodeRef.current?.releasePointerCapture(e.pointerId)
    onEndConnection(opIndex)
  }

  return (
    <>
      {(() => {
        const isConnected = patch.connections.some(c => c.src === opIndex || c.dst === opIndex)
        const ringColor = isTargetable ? 'white' : OPERATOR_COLORS[opIndex]
        return (isSelected || isConnected || isTargetable || isConnectionSource) ? (
          <svg onPointerDown={onPointerDownRing} onPointerUp={onPointerUp} style={{ cursor: 'grab', position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'all' }} width={0} height={0}>
            {/* d and display owned entirely by the RAF */}
            <path ref={ringPathRef} fill="none" stroke={ringColor} strokeWidth={2} strokeDasharray="6 4" />
            <circle ref={ringCircleRef} className={isTargetable ? 'ring-targetable' : ''} cx={op.position.x} cy={op.position.y} r={RING_RADIUS} fill="none" stroke={ringColor} strokeWidth={2} strokeDasharray="6 4" />
          </svg>
        ) : null
      })()}
      <svg ref={waveSvgRef} width={WAVE_W} height={WAVE_H} viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
        style={{ position: 'absolute', left: op.position.x - WAVE_W / 2, top: op.position.y - WAVE_H / 2 - 6, pointerEvents: 'none' }}>
        {/* d is owned entirely by the waveform RAF — no d prop here */}
        <path ref={wavePathRef} fill="none" stroke={OPERATOR_COLORS[opIndex]} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {(() => {
        const nonSelf = patch.connections.filter(c => c.src !== c.dst)
        const isModulator = nonSelf.some(c => c.src === opIndex)
        const isCarrierRole = nonSelf.some(c => c.dst === opIndex)
        const hasConnections = nonSelf.length > 0
        const role = !hasConnections ? null : isModulator ? 'MOD' : isCarrierRole ? 'CAR' : null
        const ratioStr = op.ratio % 1 === 0 ? op.ratio.toFixed(0) : op.ratio.toFixed(2)
        return (
          <span ref={labelRef} style={{ position: 'absolute', left: op.position.x, top: op.position.y + WAVE_H / 2 + 4, transform: 'translateX(-50%)', fontFamily: 'monospace', fontSize: 7, color: OPERATOR_COLORS[opIndex], opacity: 0.6, pointerEvents: 'none', lineHeight: 1, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
            {role ? `${role} · ${ratioStr}×` : `${ratioStr}×`}
          </span>
        )
      })()}
      <div ref={nodeRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} className='operator-node' style={{ cursor: 'pointer', position: 'absolute', left: op.position.x - NODE_RADIUS, top: op.position.y - NODE_RADIUS, width: NODE_RADIUS * 2, height: NODE_RADIUS * 2, borderRadius: '50%', border: `1px solid ${OPERATOR_COLORS[opIndex]}` }} />
    </>
  );
}
