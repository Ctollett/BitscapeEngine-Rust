import { useState, useRef } from 'react';
import { usePatch } from './patch-context';
import { CANVAS_WIDTH, CANVAS_HEIGHT, OPERATOR_COLORS, RING_RADIUS, NATURAL_LENGTH } from './constants';
import { OperatorNode } from './OperatorNode';
import { ConnectionLine } from './ConnectionLine';
import { DraftConnection } from './DraftConnection';
import { OperatorDetailPanel } from './OperatorDetailPanel';
import type { Point } from './types';
import { edgePoint } from './utils';
import './fm-canvas.css';

interface InteractionState {
  mode: 'idle' | 'drawing-connection';
  fromOp: number | null;
  mousePos: Point | null;

}
export function FMCanvas() {
const { patch, dispatch } = usePatch()
const [selectedOp, setSelectedOp] = useState<number | null>(null)
const [interaction, setInteraction] = useState<InteractionState>({ mode: 'idle', fromOp: null, mousePos: null})
const nodeDragRef = useRef<{ opIndex: number, pos: Point } | null>(null)

const canvasRef = useRef<HTMLDivElement>(null)
const velocitiesRef = useRef<Record<number, Point>>({})
const rafRef = useRef<number>(0)
const dragOpRef = useRef<number | null>(null)
const dragPosRef = useRef<Point>({ x: 0, y: 0 })
const patchRef = useRef(patch)
const localPositionsRef = useRef<Record<number, Point>>({})
const activeConnectedOpsRef = useRef<Set<number>>(new Set())
const pullStrengthsRef = useRef<Record<number, number>>({})

patchRef.current = patch


const onPointerMove = (e: React.PointerEvent) => {

  if(interaction.mode === 'drawing-connection') {
  const canvas = canvasRef.current?.getBoundingClientRect();
  if(!canvas) return
  const pointerX  = e.clientX - canvas.left;
  const pointerY = e.clientY - canvas.top;
  setInteraction(prev => ({ ...prev, mousePos: { x: pointerX, y: pointerY } }))
}
}

const onPointerUp = () => {
  if(interaction.mode === 'drawing-connection') {
    setInteraction({ mode: 'idle', fromOp: null, mousePos: null })
  }
  dragOpRef.current = null
  nodeDragRef.current = null
}


const runPhysics = () => {
  const opIndex = dragOpRef.current
  const pos = dragPosRef.current

  for (const connectedOpIndex of activeConnectedOpsRef.current) {
    const connectedPos = localPositionsRef.current[connectedOpIndex] ?? patchRef.current.operators[connectedOpIndex].position
    const dx = pos?.x - connectedPos.x
    const dy = pos?.y - connectedPos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    const vel = velocitiesRef.current[connectedOpIndex] ?? { x: 0, y: 0 }


    if( opIndex !== null && dist >= NATURAL_LENGTH ) {
    const force = (dist - NATURAL_LENGTH) * 0.004
    vel.x += (dx / dist) * force 
    vel.y += (dy / dist) * force

    }

    vel.x *= 0.88
    vel.y *= 0.88
    velocitiesRef.current[connectedOpIndex] = vel

      const newPosition = {
      x: connectedPos.x + vel.x,
      y: connectedPos.y + vel.y
  }

localPositionsRef.current[connectedOpIndex] = newPosition
    dispatch({ type: 'MOVE_OPERATOR', opIndex: connectedOpIndex, position: newPosition })

}

for (const idx of activeConnectedOpsRef.current) {
  const vel = velocitiesRef.current[idx]

if (Math.abs(vel.x) < 0.005 && Math.abs(vel.y) < 0.005) {
  cancelAnimationFrame(rafRef.current)
  rafRef.current = 0
  activeConnectedOpsRef.current.clear()
  return
}
}

rafRef.current = requestAnimationFrame(runPhysics)

}



const handleStringTension = (opIndex: number, pos: Point) => {
  nodeDragRef.current = { opIndex, pos }
  activeConnectedOpsRef.current.clear()
  localPositionsRef.current = {}
    
  for(let i = 0; i < patchRef.current.connections.length; i++) {
    const connectedOp = patchRef.current.connections[i]
    if(connectedOp.src !== opIndex && connectedOp.dst !== opIndex) continue
    const connectedOpIndex = connectedOp.src === opIndex ? connectedOp.dst : connectedOp.src
    activeConnectedOpsRef.current.add(connectedOpIndex)
    } 
    dragOpRef.current = opIndex
    dragPosRef.current = pos

      if (!rafRef.current) { rafRef.current = requestAnimationFrame(runPhysics) }
  }





  return (
  <>
  <div ref={canvasRef} onPointerUp={onPointerUp} onPointerMove={onPointerMove} className='fm-canvas' style={{position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT}} onPointerDown={() => setSelectedOp(null)}>
    {/* @ts-ignore */}
    <media-shader
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.08 }}
      width={`${CANVAS_WIDTH}px`}
      height={`${CANVAS_HEIGHT}px`}
      fragment-shader='#version 300 es
precision highp float;
out vec4 glFragColor;
uniform vec2 u_resolution;
uniform vec3 u_color;
uniform bool u_tone[3];
uniform float u_size;
uniform bool u_fade[3];
uniform vec2 u_fade_position[2];
uniform float u_fade_amount;
uniform float u_amount;
uniform bool u_opacity_random;
uniform bool u_shape[7];
uniform sampler2D u_shape_image;
uniform float u_random_seed;
#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif
#ifndef TAU
#define TAU 6.2831853071795864769252867665590
#endif
#if !defined(FNC_SATURATE) && !defined(saturate)
#define FNC_SATURATE
#define saturate(V) clamp(V, 0.0, 1.0)
#endif
#ifndef FNC_AASTEP
#define FNC_AASTEP
float aastep(float threshold, float value) {
    float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
    return smoothstep(threshold-afwidth, threshold+afwidth, value);
}
#endif
#ifndef FNC_FILL
#define FNC_FILL
float fill(float x, float size) { return 1.0 - aastep(size, x); }
#endif
#ifndef FNC_RECTSDF
#define FNC_RECTSDF
float rectSDF(in vec2 st, in vec2 s) {
    st = st * 2.0 - 1.0;
    return max(abs(st.x/s.x), abs(st.y/s.y));
}
#endif
#ifndef FNC_ROTATE2D
#define FNC_ROTATE2D
mat2 rotate2d(in float r){ return mat2(cos(r),-sin(r),sin(r),cos(r)); }
#endif
vec2 rotate(in vec2 v, in float r) { return rotate2d(r) * (v - 0.5) + 0.5; }
highp float rand(vec2 co) {
    highp float a = 12.9898; highp float b = 78.233; highp float c = 43758.5453;
    highp float dt = dot(co.xy, vec2(a,b)); highp float sn = mod(dt,3.14);
    return fract(sin(sn)*c);
}
vec3 hash3D(vec2 x) {
    uvec3 v = uvec3(x.xyx * 65536.0) * 1664525u + 1013904223u;
    v += v.yzx * v.zxy; v ^= v >> 16u;
    v.x += v.y*v.z; v.y += v.z*v.x; v.z += v.x*v.y;
    return vec3(v) * (1.0/float(0xffffffffu));
}
void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st *= u_resolution / u_size;
    vec2 ipos = floor(st); vec2 fpos = fract(st); st = fpos;
    float opacity = u_opacity_random ? rand(ipos * u_random_seed) : 1.0;
    float amt = hash3D(hash3D(ipos).xy).x;
    vec3 color = u_tone[2] ? hash3D(ipos) : u_color;
    if(u_tone[1] && hash3D(ipos).r > 0.5) color = 1.0 - color;
    float shape = fill(rectSDF(rotate(st, 45.*PI/180.), vec2(0.71)), 1.0);
    glFragColor = vec4(color, step(1.0 - u_amount, amt) * opacity * shape);
}'
      uniforms='{"u_tone":[false,false,true],"u_color":[0.5019607843137255,0.5019607843137255,0.5019607843137255],"u_size":1,"u_amount":0.77,"u_fade":[true,false,false],"u_fade_position":[[0.5,0],[0.5,0.5]],"u_fade_amount":0,"u_opacity_random":true,"u_random_seed":0.7201025298774603,"u_shape":[false,false,false,true,false,false,false],"u_shape_image":null}'
    />
    <svg style={{position: 'absolute', top: 0, left: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, pointerEvents: 'none'}}>

      {patch.connections.map((conn) => {
        const hasBidirectional = patch.connections.some(c => c.src === conn.dst && c.dst === conn.src)
        const lateralOffset = hasBidirectional ? 10 : 0
        return (
          <ConnectionLine srcOffset={conn.srcOffset} dstOffset={conn.dstOffset} src={patch.operators[conn.src].position} key={`conn-${conn.src}-${conn.dst}`}
          dst={patch.operators[conn.dst].position} srcOp={conn.src} dstOp={conn.dst}
          srcColor={OPERATOR_COLORS[conn.src]}
          dstColor={OPERATOR_COLORS[conn.dst]}
          lateralOffset={lateralOffset}
          getSrcPullStrength={() => pullStrengthsRef.current[conn.src] ?? 0}
          getDstPullStrength={() => pullStrengthsRef.current[conn.dst] ?? 0}
          onRemove={() => dispatch({ type: 'REMOVE_CONNECTION', src: conn.src, dst: conn.dst } )} />
        )
      })}
      {interaction.mode === 'drawing-connection' && interaction.fromOp !== null && interaction.mousePos && (() => {
        const opPos = patch.operators[interaction.fromOp].position
        const dx = interaction.mousePos.x - opPos.x
        const dy = interaction.mousePos.y - opPos.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const pullAngle = Math.atan2(dy, dx)
        const pullAmount = Math.min(dist * 0.03, RING_RADIUS * 0.08)
        const tipRadius = RING_RADIUS + pullAmount
        const fromEdge = { x: opPos.x + tipRadius * Math.cos(pullAngle), y: opPos.y + tipRadius * Math.sin(pullAngle) }
        return <DraftConnection from={opPos} to={interaction.mousePos} fromEdge={fromEdge} color={OPERATOR_COLORS[interaction.fromOp]} />
      })()}


    </svg>
    {patch.operators.map((_, i) => (
      <OperatorNode
      key={`op-${i}`}
      opIndex={i}
      isCarrier={false}
      dragPos={interaction.mode === 'drawing-connection' && interaction.fromOp === i ? interaction.mousePos : null}
      isConnectionSource={interaction.mode === 'drawing-connection' && interaction.fromOp === i}
      isTargetable={interaction.mode === 'drawing-connection' && interaction.fromOp !== i}
      onDragMove={handleStringTension}
      onStartConnection={(opIndex) => setInteraction({ mode: 'drawing-connection', fromOp: opIndex, mousePos: null })}
      onEndConnection={(targetOp) => {
  if (interaction.mode === 'drawing-connection' && interaction.fromOp !== null && interaction.fromOp !== targetOp) {

    const srcPos = patch.operators[interaction.fromOp].position
    const dstPos = patch.operators[targetOp].position
    const srcPoint = edgePoint(srcPos, dstPos)
    const dstPoint = edgePoint(dstPos, srcPos)

    const srcOffset = { x: srcPoint.x - srcPos.x, y: srcPoint.y - srcPos.y }
    const dstOffset = { x: dstPoint.x - dstPos.x, y: dstPoint.y - dstPos.y }


    dispatch({ type: 'ADD_CONNECTION', src: interaction.fromOp, dst: targetOp, srcOffset, dstOffset })
    setInteraction({ mode: 'idle', fromOp: null, mousePos: null })
  }
}}
      getPullToward={() => {
        const drag = nodeDragRef.current
        if (!drag || drag.opIndex === i) return null
        const connected = patchRef.current.connections.some(c =>
          (c.src === i && c.dst === drag.opIndex) ||
          (c.src === drag.opIndex && c.dst === i)
        )
        return connected ? drag.pos : null
      }}
      onPullStrength={(strength) => { pullStrengthsRef.current[i] = strength }}
      onOpenDetail={() => {}}
      onSelect={setSelectedOp}
isSelected={selectedOp === i}
      />
    ))}
    {selectedOp !== null && (
      <OperatorDetailPanel opIndex={selectedOp} onClose={() => setSelectedOp(null)} />
    )}
  </div>
  </>
  );

}
