import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { GitFork, RefreshCw, Info, ExternalLink } from 'lucide-react'
import { graphAPI, coinAPI } from '../services/api'
import { riskColor, riskLabel } from '../utils/format'
import { useToast } from '../context/ToastContext'

// Radial Layout with "Tree Depth" logic
function buildRadialLayout(nodes, w, h) {
  const cx = w / 2, cy = h / 2
  const pos = { 'bitcoin': { x: cx, y: cy } }
  
  const tiers = { 1: [], 2: [], 3: [] }
  nodes.forEach(n => { if(n.id !== 'bitcoin') tiers[n.level || 1].push(n) })

  Object.keys(tiers).forEach(level => {
    const tierNodes = tiers[level]
    const radius = level * 125 
    tierNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / tierNodes.length + (level * 0.6)
      pos[node.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }
    })
  })
  return pos
}

export default function GraphRiskPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [selectedId, setSelectedId] = useState('bitcoin')
  const [result, setResult] = useState(null)
  const [riskScore, setRiskScore] = useState(null)
  const [positions, setPositions] = useState({})
  const [hovered, setHovered] = useState(null)

  const fetchData = async (id) => {
    try {
      const [contagion, score] = await Promise.all([
        graphAPI.getContagion(id),
        graphAPI.getRiskScore(id)
      ])
      setResult(contagion.data)
      setRiskScore(score.data)
      
      const allNodes = [{ id: 'bitcoin', level: 0 }, ...contagion.data.affected]
      setPositions(buildRadialLayout(allNodes, 800, 500))
    } catch (e) { toast.error("Syncing market edges...") }
  }

  useEffect(() => { fetchData('bitcoin') }, [])

  const handleSync = async () => {
    toast.info("Calculating market correlations...")
    await graphAPI.syncData()
    fetchData('bitcoin')
  }

  const graphNodes = result ? [
    { id: 'bitcoin', label: 'BTC', risk: 45, level: 0 },
    ...(result.affected || [])
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="section-title"><GitFork size={18} color="var(--purple)"/> Risk Contagion Matrix</h2>
          <p className="section-subtitle">Click nodes to analyze specific asset shock propagation</p>
        </div>
        <button className="btn-primary" onClick={handleSync}><RefreshCw size={14} /> Sync Market Edges</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div className="glass-card" style={{ height: 500, background: '#fff', overflow: 'hidden' }}>
          <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
            {/* Connection Lines */}
            {graphNodes.map(n => {
              const p = positions[n.id]; if(!p || n.id === 'bitcoin') return null;
              return <line key={n.id} x1="400" y1="250" x2={p.x} y2={p.y} stroke={riskColor(n.riskScore)} strokeOpacity="0.15" />
            })}

            {/* Nodes */}
            {graphNodes.map(node => {
              const pos = positions[node.id]; if(!pos) return null;
              const active = selectedId === node.id || hovered === node.id
              const color = riskColor(node.riskScore || 40)
              
              return (
                <g key={node.id} transform={`translate(${pos.x},${pos.y})`} 
                   onClick={() => { setSelectedId(node.id); fetchData(node.id); }}
                   onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'pointer' }}>
                  <circle r={active ? 25 : 18} fill={color} opacity="0.1" />
                  <circle r="12" fill="#fff" stroke={color} strokeWidth="2" />
                  <text textAnchor="middle" y="30" fontSize="10" fontWeight="700" fill="var(--text-primary)">
                    {node.id.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* SIDE PANEL: COIN DETAILS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)' }}>SELECTED ASSET</div>
            <h3 style={{ fontSize: 22, fontWeight: 900 }}>{selectedId.toUpperCase()}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: riskColor(riskScore?.score) }}>{riskScore?.score}%</div>
                <div style={{ fontSize: 12, fontWeight: 800 }}>{riskLabel(riskScore?.score)}</div>
            </div>
            <button className="btn-ghost" style={{ width: '100%', marginTop: 15, fontSize: 12 }} 
                    onClick={() => navigate(`/market/${selectedId}`)}>
                View Market Details <ExternalLink size={12} />
            </button>
          </div>

          <div className="glass-card" style={{ padding: 15, flex: 1, overflowY: 'auto' }}>
            <span style={{ fontSize: 11, fontWeight: 800 }}>PROPAGATION IMPACT</span>
            {result?.affected.map(n => (
                <div key={n.coinId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{n.coinName}</span>
                    <span style={{ fontSize: 11, color: riskColor(n.riskScore) }}>{n.riskScore}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}