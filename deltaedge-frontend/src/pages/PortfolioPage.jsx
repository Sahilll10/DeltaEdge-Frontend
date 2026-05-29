import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard   from '../components/common/StatCard'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { assetAPI } from '../services/api'
import { formatUSD, formatPct, priceClass } from '../utils/format'
import { useToast } from '../context/ToastContext'

const PIE_COLORS = ['#1B74FF','#00E5A0','#FF3D5E','#FFB020','#7C3AED','#EC4899','#06B6D4','#F97316']

export default function PortfolioPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [assets,  setAssets]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await assetAPI.getAll()
      setAssets(r.data || [])
    } catch { toast.error('Failed to load portfolio') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const totalValue = assets.reduce((s, a) => s + (a.quantity * (a.coin?.current_price || 0)), 0)
  const totalCost  = assets.reduce((s, a) => s + (a.buyPrice ? a.quantity * a.buyPrice : 0), 0)
  const totalPnl   = totalValue - totalCost
  const pnlPct     = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0

  const pieData = assets.map(a => ({
    name:  a.coin?.symbol?.toUpperCase() || 'Unknown',
    value: a.quantity * (a.coin?.current_price || 0),
  })).filter(d => d.value > 0)

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <div style={{ fontWeight: 600 }}>{payload[0].name}</div>
        <div style={{ fontFamily: 'Space Mono', color: 'var(--green)', marginTop: 2 }}>{formatUSD(payload[0].value)}</div>
        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          {totalValue > 0 ? ((payload[0].value / totalValue) * 100).toFixed(1) : 0}% of portfolio
        </div>
      </div>
    )
  }

  if (loading) return <Spinner />

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={18} style={{ color: 'var(--gold)' }} /> Portfolio
          </div>
          <div className="section-subtitle">All holdings with real-time P&L</div>
        </div>
        <button className="btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="dashboard-grid stagger-children" style={{ marginBottom: 24 }}>
        <StatCard icon={Briefcase}   label="PORTFOLIO VALUE"  value={formatUSD(totalValue)}    color="var(--accent)" />
        <StatCard icon={TrendingUp}  label="TOTAL COST BASIS" value={formatUSD(totalCost)}     color="var(--gold)" />
        <StatCard icon={totalPnl >= 0 ? TrendingUp : TrendingDown}
                                     label="UNREALISED P&L"   value={formatUSD(totalPnl)}
                  color={totalPnl >= 0 ? 'var(--green)' : 'var(--red)'} trend={pnlPct} />
        <StatCard icon={Briefcase}   label="POSITIONS"        value={assets.length}            color="var(--purple)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 20 }}>
        {/* Pie */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="section-title" style={{ fontSize: 14, marginBottom: 16 }}>Allocation</div>
          {pieData.length === 0 ? (
            <EmptyState title="No holdings" subtitle="Start trading to see allocation" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(v) => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Holdings table */}
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <span className="section-title" style={{ fontSize: 14 }}>Holdings Breakdown</span>
          </div>
          {assets.length === 0 ? (
            <EmptyState title="No holdings yet" subtitle="Buy coins to build your portfolio" />
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>ASSET</th><th>QTY</th><th>AVG BUY</th><th>CURRENT</th><th>VALUE</th><th>P&L</th></tr>
              </thead>
              <tbody>
                {assets.map((a, i) => {
                  const cur   = a.coin?.current_price || 0
                  const val   = a.quantity * cur
                  const cost  = a.buyPrice ? a.quantity * a.buyPrice : val
                  const pnl   = val - cost
                  const pnlP  = cost > 0 ? (pnl / cost) * 100 : 0
                  return (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/market/${a.coin?.id}`)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                          <img src={a.coin?.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{a.coin?.symbol?.toUpperCase()}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.coin?.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{a.quantity?.toFixed(6)}</td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                        {a.buyPrice ? formatUSD(a.buyPrice) : '—'}
                      </td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatUSD(cur)}</td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 600 }}>{formatUSD(val)}</td>
                      <td>
                        <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {pnl >= 0 ? '+' : ''}{formatUSD(pnl)}
                        </div>
                        <div style={{ fontSize: 10, color: pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {formatPct(pnlP)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
