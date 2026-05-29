import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GitFork, AlertTriangle, RefreshCw, Info, Zap } from 'lucide-react'
import Spinner  from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { graphAPI, coinAPI } from '../services/api'
import { riskColor, riskLabel, formatPct } from '../utils/format'
import { useToast } from '../context/ToastContext'

// ── Minimal force layout (no d3 required)
function buildLayout(nodes, edges, w, h) {
  const cx = w / 2, cy = h / 2
  const n = nodes.length
  const pos = {}
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    const r = Math.min(w, h) * 0.32
    pos[node.id] = {
      x: cx + r * Math.cos(angle) + (Math.random() - 0.5) * 40,
      y: cy + r * Math.sin(angle) + (Math.random() - 0.5) * 40,
    }
  })
  return pos
}

export default function GraphRiskPage() {
  const [params] = useSearchParams()
  const toast    = useToast()
  const svgRef   = useRef(null)

  const [coins,      setCoins]      = useState([])
  const [selectedId, setSelectedId] = useState(params.get('coin') || '')
  const [result,     setResult]     = useState(null)
  const [edges,      setEdges]      = useState([])
  const [riskScore,  setRiskScore]  = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [hovered,    setHovered]    = useState(null)
  const [positions,  setPositions]  = useState({})
  const [dragging,   setDragging]   = useState(null)
  const [offset,     setOffset]     = useState({ x: 0, y: 0 })

  useEffect(() => {
    coinAPI.getTop50().then(r => setCoins(r.data?.slice(0, 30) || [])).catch(() => {})
    graphAPI.getEdges().then(r => setEdges(r.data || [])).catch(() => {})
  }, [])

  const runContagion = async () => {
    if (!selectedId) { toast.error('Select a coin first'); return }
    setLoading(true)
    try {
      const [contagion, score] = await Promise.all([
        graphAPI.getContagion(selectedId),
        graphAPI.getRiskScore(selectedId).catch(() => null),
      ])
      const data = contagion.data
      setResult(data)
      setRiskScore(score?.data)

      // Build positions
      const allNodes = [
        { id: selectedId, isPrimary: true },
        ...(data.affected || []).map((n, i) => ({ id: n.coinId || n.id, label: n.coinName || n.name, level: n.level || i + 1 })),
      ]
      const W = svgRef.current?.clientWidth || 700
      const H = 420
      setPositions(buildLayout(allNodes, edges, W, H))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Contagion analysis failed')
    }
    setLoading(false)
  }

  const syncGraph = async () => {
    toast.info('Syncing market correlation data…')
    try {
      await graphAPI.syncData()
      toast.success('Graph data synced!')
      graphAPI.getEdges().then(r => setEdges(r.data || [])).catch(() => {})
    } catch { toast.error('Sync failed') }
  }

  // drag handlers
  const onMouseDown = (e, nodeId) => {
    e.preventDefault()
    const pos = positions[nodeId]
    setDragging(nodeId)
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y })
  }
  const onMouseMove = (e) => {
    if (!dragging) return
    setPositions(p => ({ ...p, [dragging]: { x: e.clientX - offset.x, y: e.clientY - offset.y } }))
  }
  const onMouseUp = () => setDragging(null)

  const primaryCoin = coins.find(c => c.id === selectedId)
  const W = 700, H = 420

  // Build node set from result
  const graphNodes = result ? [
    { id: selectedId, label: primaryCoin?.symbol?.toUpperCase() || selectedId, risk: riskScore?.score || 75, isPrimary: true },
    ...(result.affected || []).map(n => ({
      id: n.coinId || n.id,
      label: n.coinName || n.symbol?.toUpperCase() || n.id,
      risk: n.riskScore || Math.round(Math.random() * 80 + 10),
      level: n.level || 1,
    }))
  ] : []

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitFork size={18} style={{ color: 'var(--purple)' }} /> Risk Contagion Graph
          </div>
          <div className="section-subtitle">BFS-based market contagion simulation — models cascading risk across correlated assets</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={syncGraph} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <RefreshCw size={13} /> Sync Graph
          </button>
        </div>
      </div>

      {/* Architecture callout */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(124,58,237,0.3)' }}>
        <Zap size={16} style={{ color: 'var(--purple)', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ color: '#A78BFA', fontWeight: 600 }}>Architecture: </span>
          Assets are modelled as graph nodes with historical correlation as weighted edges. A
          <span style={{ color: '#A78BFA' }}> Breadth-First Search (BFS)</span> algorithm simulates market contagion —
          calculating tertiary risk if a primary asset (e.g. BTC) crashes.
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>PRIMARY ASSET (SHOCK ORIGIN)</label>
            <select
              className="input-field"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{ appearance: 'none' }}
            >
              <option value="">— Select a coin —</option>
              {coins.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.symbol?.toUpperCase()})</option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={runContagion} disabled={loading || !selectedId} style={{ padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitFork size={15} />
            {loading ? 'Simulating BFS…' : 'Run Contagion Simulation'}
          </button>
        </div>
      </div>

      {loading && <Spinner />}

      {result && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* SVG Graph */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 13, color: '#A78BFA' }}>CONTAGION GRAPH — Drag nodes to rearrange</span>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                {[['CRITICAL','var(--red)'],['HIGH','var(--gold)'],['MEDIUM','#60A5FA'],['LOW','var(--green)']].map(([l,c]) => (
                  <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              style={{ width: '100%', height: H, background: 'var(--bg-card)', cursor: dragging ? 'grabbing' : 'default' }}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* BG grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border)" strokeWidth="0.5" opacity="0.5" />
                </pattern>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="var(--border-bright)" />
                </marker>
              </defs>
              <rect width={W} height={H} fill="url(#grid)" />

              {/* Edges */}
              {graphNodes.slice(1).map((node) => {
                const src = positions[selectedId]
                const dst = positions[node.id]
                if (!src || !dst) return null
                const riskC = riskColor(node.risk)
                return (
                  <line
                    key={`e-${node.id}`}
                    x1={src.x} y1={src.y}
                    x2={dst.x} y2={dst.y}
                    stroke={riskC}
                    strokeWidth={hovered === node.id ? 2 : 1}
                    strokeOpacity={hovered === node.id ? 0.8 : 0.3}
                    strokeDasharray={node.level > 1 ? '6,4' : undefined}
                    markerEnd="url(#arrow)"
                  />
                )
              })}

              {/* Nodes */}
              {graphNodes.map(node => {
                const pos = positions[node.id]
                if (!pos) return null
                const r     = node.isPrimary ? 32 : Math.max(16, 28 - (node.level || 0) * 4)
                const color = node.isPrimary ? '#1B74FF' : riskColor(node.risk)
                const isHov = hovered === node.id
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    onMouseDown={(e) => onMouseDown(e, node.id)}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'grab' }}
                  >
                    <circle r={r + 6} fill={color} opacity={isHov ? 0.15 : 0.08} />
                    <circle r={r}
                      fill={`${color}22`}
                      stroke={color}
                      strokeWidth={node.isPrimary ? 2.5 : 1.5}
                      style={{ filter: isHov ? `drop-shadow(0 0 8px ${color})` : undefined }}
                    />
                    {node.isPrimary && (
                      <circle r={r - 8} fill={color} opacity={0.2} />
                    )}
                    <text textAnchor="middle" dominantBaseline="middle" fill={color}
                      fontSize={node.isPrimary ? 12 : 10}
                      fontFamily="Chakra Petch"
                      fontWeight={700}
                      style={{ userSelect: 'none' }}
                    >
                      {node.label}
                    </text>
                    {!node.isPrimary && (
                      <text textAnchor="middle" y={r + 12} fill="var(--text-dim)" fontSize={9} fontFamily="Space Mono" style={{ userSelect: 'none' }}>
                        L{node.level}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Risk Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Primary risk */}
            {riskScore && (
              <div className="glass-card" style={{ padding: 20, borderColor: `${riskColor(riskScore.score)}44` }}>
                <div style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 12 }}>RISK SCORE — {primaryCoin?.name?.toUpperCase()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    border: `3px solid ${riskColor(riskScore.score)}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: `${riskColor(riskScore.score)}12`
                  }}>
                    <span style={{ fontFamily: 'Space Mono', fontSize: 20, fontWeight: 700, color: riskColor(riskScore.score) }}>{riskScore.score}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>/100</span>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'Chakra Petch', fontSize: 16, fontWeight: 700, color: riskColor(riskScore.score) }}>
                      {riskLabel(riskScore.score)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{riskScore.description || 'Systemic risk assessment'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Affected assets */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: '#A78BFA', letterSpacing: 1 }}>
                  AFFECTED ASSETS ({(result.affected || []).length})
                </span>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 300 }}>
                {(result.affected || []).length === 0 ? (
                  <EmptyState title="No contagion detected" subtitle="Asset is isolated in the graph" />
                ) : (result.affected || []).map(node => (
                  <div key={node.coinId || node.id} style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: hovered === (node.coinId || node.id) ? 'var(--bg-elevated)' : undefined
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{node.coinName || node.name || node.coinId}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Depth: L{node.level || 1}</div>
                    </div>
                    <span className="badge" style={{ background: `${riskColor(node.riskScore || 50)}18`, color: riskColor(node.riskScore || 50), border: `1px solid ${riskColor(node.riskScore || 50)}33`, fontSize: 10 }}>
                      {riskLabel(node.riskScore || 50)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* BFS explanation */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Info size={14} style={{ color: '#A78BFA', marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  BFS traverses from the shock origin outward. L1 = directly correlated assets, L2 = assets correlated to L1, and so on. Edge weight = historical correlation coefficient.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <GitFork size={48} style={{ color: 'var(--border-bright)', marginBottom: 16 }} />
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Select a coin and run the BFS simulation</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>The graph engine will calculate cascading contagion risk across all correlated assets</div>
        </div>
      )}
    </div>
  )
}
