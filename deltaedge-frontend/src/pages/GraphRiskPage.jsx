import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GitFork, RefreshCw, Zap, Target, Info } from 'lucide-react'
import Spinner from '../components/common/Spinner'
import { graphAPI, coinAPI } from '../services/api'
import { riskColor, riskLabel } from '../utils/format'
import { useToast } from '../context/ToastContext'

function buildRadialLayout(nodes, w, h) {
  const cx = w / 2, cy = h / 2
  const pos = {}
  
  // 1. Anchor Bitcoin (Center)
  pos['bitcoin'] = { x: cx, y: cy }

  // 2. Separate nodes into Orbits (L1, L2, L3)
  const tiers = { 1: [], 2: [], 3: [] }
  nodes.forEach(n => { 
    if(!n.isPrimary && n.id !== 'bitcoin') {
      const level = n.level || 1
      if (tiers[level]) tiers[level].push(n)
      else tiers[3].push(n)
    }
  })

  // 3. Arrange Orbits
  Object.keys(tiers).forEach(tier => {
    const tierNodes = tiers[tier]
    const radius = tier * 120 // 120px, 240px, 360px radii
    tierNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / tierNodes.length + (tier * 0.4) // offset angle per tier
      pos[node.id] = {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle)
      }
    })
  })
  return pos
}

export default function GraphRiskPage() {
  const [params] = useSearchParams()
  const toast = useToast()
  const svgRef = useRef(null)
  
  const [coins, setCoins] = useState([])
  const [selectedId, setSelectedId] = useState(params.get('coin') || 'bitcoin')
  const [result, setResult] = useState(null)
  const [riskScore, setRiskScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState({})
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    coinAPI.getTop50().then(r => setCoins(r.data?.slice(0, 40) || [])).catch(() => {})
    handleSimulation('bitcoin') 
  }, [])

  const handleSimulation = async (id = selectedId) => {
    if (!id) return
    setLoading(true)
    setSelectedId(id)
    try {
      const [contagion, score] = await Promise.all([
        graphAPI.getContagion(id),
        graphAPI.getRiskScore(id)
      ])
      
      const allNodes = [
        { id: 'bitcoin', label: 'BTC', level: 0, isPrimary: id === 'bitcoin' },
        ...contagion.data.affected
      ]
      
      setResult(contagion.data)
      setRiskScore(score.data)
      setPositions(buildRadialLayout(allNodes, 800, 500))
    } catch (err) {
      toast.error('Contagion Sync Failed')
    }
    setLoading(false)
  }

  const graphNodes = result ? [
    { id: 'bitcoin', label: 'BTC', risk: 45, level: 0, isPrimary: selectedId === 'bitcoin' },
    ...(result.affected || [])
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="section-title"><GitFork size={18} style={{ color: 'var(--purple)' }} /> Risk Contagion Matrix</h2>
          <p className="section-subtitle">Institutional radial BFS layout — Source: {selectedId.toUpperCase()}</p>
        </div>
        <button className="btn-ghost" onClick={() => handleSimulation('bitcoin')} style={{ fontSize: 12 }}>
          <RefreshCw size={13} style={{ marginRight: 6 }} /> Reset View
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* RADIAL GRAPH VIEW */}
        <div className="glass-card" style={{ height: 550, position: 'relative', overflow: 'hidden', background: '#fff' }}>
          <div style={{ position: 'absolute', top: 15, left: 20, zIndex: 10 }}>
             <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, letterSpacing: 1 }}>HUB-AND-SPOKE MODEL</span>
          </div>
          
          <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
            {/* Tier Orbits */}
            <circle cx="400" cy="250" r="120" fill="none" stroke="var(--border)" strokeDasharray="4,4" opacity="0.5" />
            <circle cx="400" cy="250" r="240" fill="none" stroke="var(--border)" strokeDasharray="4,4" opacity="0.3" />
            
            {/* Correlation Edges */}
            {graphNodes.map(node => {
               const src = positions[selectedId]
               const dst = positions[node.id]
               if(!src || !dst || node.id === selectedId) return null
               return (
                 <line key={`edge-${node.id}`} x1={src.x} y1={src.y} x2={dst.x} y2={dst.y} 
                       stroke={riskColor(node.riskScore)} strokeOpacity={hovered === node.id ? 0.6 : 0.15} strokeWidth={hovered === node.id ? 2 : 1} />
               )
            })}

            {/* Asset Nodes */}
            {graphNodes.map(node => {
              const pos = positions[node.id]; if(!pos) return null;
              const isSelected = selectedId === node.id
              const isHov = hovered === node.id
              const color = node.id === 'bitcoin' ? 'var(--accent)' : riskColor(node.riskScore)
              
              return (
                <g key={node.id} transform={`translate(${pos.x},${pos.y})`} 
                   onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
                   onClick={() => handleSimulation(node.id)} style={{ cursor: 'pointer' }}>
                  
                  <circle r={isSelected ? 28 : 20} fill={color} opacity={isHov || isSelected ? 0.2 : 0.05} />
                  <circle r={isSelected ? 18 : 12} fill="#fff" stroke={color} strokeWidth={isSelected ? 3 : 1.5} />
                  
                  <text textAnchor="middle" y="4" fontSize={isSelected ? "10" : "8"} fontWeight="800" fill="var(--text-primary)" style={{ userSelect: 'none' }}>
                    {node.label || node.id.substring(0, 3).toUpperCase()}
                  </text>
                  
                  {isSelected && <circle r="34" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4,2" className="animate-spin-slow" />}
                </g>
              )
            })}
          </svg>
        </div>

        {/* SIDE RISK PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="glass-card" style={{ padding: 24, borderLeft: `4px solid ${riskColor(riskScore?.score)}` }}>
            <label style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, fontWeight: 800 }}>SHOCK ORIGIN</label>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginTop: 4 }}>{selectedId.toUpperCase()}</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15 }}>
               <div style={{ width: 60, height: 60, borderRadius: '50%', border: `4px solid ${riskColor(riskScore?.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 900 }}>{riskScore?.score}</span>
               </div>
               <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: riskColor(riskScore?.score) }}>{riskLabel(riskScore?.score)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3, marginTop: 2 }}>{riskScore?.description}</div>
               </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-void)' }}>
               <span style={{ fontSize: 11, fontWeight: 700 }}>AFFECTED ASSETS ({(result?.affected || []).length})</span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {result?.affected.map(n => (
                <div key={n.coinId} className="hover:bg-gray-50" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => handleSimulation(n.coinId)}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{n.coinName}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Tier {n.level} Connection</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: riskColor(n.riskScore) }}>{n.riskScore}%</div>
                    <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{riskLabel(n.riskScore)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}