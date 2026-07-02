import { usePatch } from './patch-context';
import { DEPTH_DECAY_CONSTANT, CANVAS_WIDTH } from './constants';
const CANVAS_SIZE = CANVAS_WIDTH;
import './mod-depth-debug.css';

/** Euclidean distance between two points. */
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Maps pixel distance to mod depth (0-127).
 * This mirrors the calculation in depth-mapper.ts
 */
function distanceToDepth(distancePx: number): number {
  const normalized = Math.exp(-distancePx / DEPTH_DECAY_CONSTANT);
  return Math.round(normalized * 127);
}

export function ModDepthDebugPanel() {
  const { patch } = usePatch();
  
  // Calculate distances for all connections
  const activeNonSelf = patch.connections.filter(c => c.src !== c.dst);
  
  const groupA: Array<{ src: number; dst: number; distance: number; depth: number }> = [];
  const groupB: Array<{ src: number; dst: number; distance: number; depth: number }> = [];
  
  for (const { src, dst } of activeNonSelf) {
    const dist = distance(
      patch.operators[src].position,
      patch.operators[dst].position,
    );
    const depth = distanceToDepth(dist);
    
    const connectionInfo = { src, dst, distance: dist, depth };
    
    if (src === 0 || src === 1) {
      groupA.push(connectionInfo);
    } else {
      groupB.push(connectionInfo);
    }
  }
  
  // Calculate averages
  const avgDistA = groupA.length > 0 
    ? groupA.reduce((sum, c) => sum + c.distance, 0) / groupA.length 
    : 0;
  const avgDistB = groupB.length > 0 
    ? groupB.reduce((sum, c) => sum + c.distance, 0) / groupB.length 
    : 0;
  
  return (
    <div className="mod-depth-debug-panel">
      <div className="debug-header">Mod Depth Debug</div>
      
      <div className="debug-section">
        <div className="debug-group-title">
          Group A (Ops 0-1) 
          <span className="depth-value">{patch.modDepthA}/127</span>
        </div>
        {groupA.length > 0 ? (
          <>
            <div className="connections-list">
              {groupA.map(({ src, dst, distance, depth }, idx) => (
                <div key={idx} className="connection-item">
                  <span className="connection-label">Op {src} → Op {dst}:</span>
                  <span className="distance-value">{distance.toFixed(1)}px</span>
                  <span className="depth-indicator" style={{ width: `${(depth / 127) * 100}%` }}></span>
                  <span className="depth-value-small">{depth}</span>
                </div>
              ))}
            </div>
            <div className="average-line">
              Avg Distance: <strong>{avgDistA.toFixed(1)}px</strong> → Depth: <strong>{patch.modDepthA}</strong>
            </div>
          </>
        ) : (
          <div className="no-connections">No active connections</div>
        )}
      </div>
      
      <div className="debug-section">
        <div className="debug-group-title">
          Group B (Ops 2-3) 
          <span className="depth-value">{patch.modDepthB}/127</span>
        </div>
        {groupB.length > 0 ? (
          <>
            <div className="connections-list">
              {groupB.map(({ src, dst, distance, depth }, idx) => (
                <div key={idx} className="connection-item">
                  <span className="connection-label">Op {src} → Op {dst}:</span>
                  <span className="distance-value">{distance.toFixed(1)}px</span>
                  <span className="depth-indicator" style={{ width: `${(depth / 127) * 100}%` }}></span>
                  <span className="depth-value-small">{depth}</span>
                </div>
              ))}
            </div>
            <div className="average-line">
              Avg Distance: <strong>{avgDistB.toFixed(1)}px</strong> → Depth: <strong>{patch.modDepthB}</strong>
            </div>
          </>
        ) : (
          <div className="no-connections">No active connections</div>
        )}
      </div>
      
      <div className="debug-section debug-constants">
        <div className="constant-item">
          <span>Decay Constant:</span>
          <strong>{DEPTH_DECAY_CONSTANT}</strong>
        </div>
        <div className="constant-item">
          <span>Canvas Size:</span>
          <strong>{CANVAS_SIZE}px</strong>
        </div>
        <div className="constant-item">
          <span>Total Connections:</span>
          <strong>{activeNonSelf.length}</strong>
        </div>
      </div>
    </div>
  );
}
