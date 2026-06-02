import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitFork, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'
import { graphAPI } from '../services/api'
import { riskColor, riskLabel } from '../utils/format'
import { useToast } from '../context/ToastContext'

// Radial Layout - FIXED to handle coinId
function buildRadialLayout(nodes, w, h) {
  const cx = w / 2, cy = h / 2
  const pos = { 'bitcoin': { x: cx, y: cy } }
  const tiers = { 1: [], 2: [], 3: [] }
  
  if (!Array.isArray(nodes)) return pos;

  nodes.forEach(n => { 
    // Normalize: Use coinId if id is missing
    const id = n.id || n.coinId;
    if(id && id !== 'bitcoin') {
      const level = Math.min(3, Math.max(1, n.level || 1));
      tiers[level].push({ ...n, id }); // Ensure id exists for the loop below
    }
  });

  Object.keys(tiers).forEach(levelStr => {
    const level = parseInt(levelStr);
    const tierNodes = tiers[level];
    const radius = level * 110; 
    
    tierNodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / (tierNodes.length || 1) + (level * 0.7);
      pos[node.id] = { 
        x: cx + radius * Math.cos(angle), 
        y: cy + radius * Math.sin(angle) 
      }
    });
  });
  return pos;
}

export default function GraphRiskPage() {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [selectedId, setSelectedId] = useState('bitcoin')
  const [result, setResult] = useState(null)
  const [riskScore, setRiskScore] = useState(null)
  const [positions, setPositions] = useState({})
  const [hovered, setHovered] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchData = async (id) => {
    setLoading(true)
    try {
      const [contagion, score] = await Promise.all([
        graphAPI.getContagion(id),
        graphAPI.getRiskScore(id)
      ])
      
      const affected = contagion.data?.affected || []
      setResult(contagion.data)
      setRiskScore(score.data)
      
      // Pass normalized nodes to the layout engine
      const allNodes = [{ id: 'bitcoin', level: 0 }, ...affected]
      setPositions(buildRadialLayout(allNodes, 800, 500))
      setSelectedId(id)
    } catch (e) {
      toast.error("Market edges not found. Please Sync.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData('bitcoin') }, [])

  const handleSync = async () => {
    toast.info("Calculating market correlation tree...")
    try {
      await graphAPI.syncData()
      fetchData('bitcoin')
    } catch (e) {
      toast.error("Sync failed.")
    }
  }

  // Normalize nodes for rendering
  const graphNodes = result?.affected ? [
    { id: 'bitcoin', label: 'BTC', riskScore: 40, level: 0 },
    ...result.affected.map(n => ({ ...n, id: n.id || n.coinId }))
  ] : []

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 className="section-title"><GitFork size={18} color="var(--purple)"/> Risk Contagion Matrix</h2>
          <p className="section-subtitle">Real-time propagation modeling — Click nodes to shift analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={() => fetchData('bitcoin')}><RefreshCw size={14} /> Reset View</button>
            <button className="btn-primary" onClick={handleSync} disabled={loading}>Sync Market Edges</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div className="glass-card" style={{ height: 550, background: '#fff', overflow: 'hidden', position: 'relative' }}>
          <svg viewBox="0 0 800 500" style={{ width: '100%', height: '100%' }}>
            {/* Tier Rings */}
            <circle cx="400" cy="250" r="110" fill="none" stroke="#f1f5f9" strokeDasharray="5,5" />
            <circle cx="400" cy="250" r="220" fill="none" stroke="#f1f5f9" strokeDasharray="5,5" />

            {/* Lines */}
            {graphNodes.map(n => {
              const p = positions[n.id]; 
              if(!p || n.id === selectedId) return null;
              return <line key={`l-${n.id}`} x1={positions[selectedId]?.x || 400} y1={positions[selectedId]?.y || 250} x2={p.x} y2={p.y} stroke={riskColor(n.riskScore)} strokeOpacity="0.2" />
            })}

            {/* Nodes */}
            {graphNodes.map(node => {
              const pos = positions[node.id]; if(!pos) return null;
              const isSel = selectedId === node.id || hovered === node.id
              const color = riskColor(node.riskScore || 40)
              
              return (
                <g key={node.id} transform={`translate(${pos.x},${pos.y})`} 
                   onClick={() => fetchData(node.id)}
                   onMouseEnter={() => setHovered(node.id)} onMouseLeave={() => setHovered(null)}
                   style={{ cursor: 'pointer' }}>
                  <circle r={isSel ? 26 : 20} fill={color} opacity={isSel ? 0.2 : 0.05} />
                  <circle r="12" fill="#fff" stroke={color} strokeWidth="2" />
                  <text textAnchor="middle" y="32" fontSize="9" fontWeight="800" fill="var(--text-primary)">
                    {(node.coinName || node.id).toUpperCase()}
                  </text>
                  {isSel && <circle r="30" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2,2" />}
                </g>
              )
            })}
          </svg>
        </div>

        {/* SIDE PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div className="glass-card" style={{ padding: 24, borderTop: `4px solid ${riskColor(riskScore?.score)}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: 1 }}>SHOCK SOURCE</div>
            <h3 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase' }}>{selectedId}</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 15 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${riskColor(riskScore?.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 900 }}>{riskScore?.score || 0}</span>
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: riskColor(riskScore?.score) }}>{riskLabel(riskScore?.score)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{riskScore?.description}</div>
                </div>
            </div>
            
            <button className="btn-ghost" style={{ width: '100%', marginTop: 20, fontSize: 12 }} 
                    onClick={() => navigate(`/market/${selectedId}`)}>
                Open Market Sheet <ExternalLink size={12} />
            </button>
          </div>

          <div className="glass-card" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-void)' }}>
               <span style={{ fontSize: 11, fontWeight: 800 }}>CONTAGION DEPTH</span>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {result?.affected?.map(n => (
                <div key={n.coinId} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => fetchData(n.coinId)}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{n.coinName}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Tier {n.level} Exposure</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: riskColor(n.riskScore) }}>{n.riskScore}%</div>
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