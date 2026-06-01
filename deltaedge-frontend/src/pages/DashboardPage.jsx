import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, BarChart2, Activity, ArrowRight, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/common/StatCard'
import Spinner  from '../components/common/Spinner'
import { walletAPI, coinAPI, assetAPI, orderAPI } from '../services/api'
import { formatINR, formatCompact, formatPct, priceClass, fmtDateTime } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { user }   = useAuth()
  const navigate   = useNavigate()
  const [wallet,   setWallet]   = useState(null)
  const [assets,   setAssets]   = useState([])
  const [orders,   setOrders]   = useState([])
  const [coins,    setCoins]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    Promise.all([
      walletAPI.getWallet().catch(() => null),
      assetAPI.getAll().catch(() => ({ data: [] })),
      orderAPI.getAll().catch(() => ({ data: [] })),
      coinAPI.getTop50().catch(() => ({ data: [] })),
    ]).then(([w, a, o, c]) => {
      setWallet(w?.data)
      setAssets(a?.data?.slice(0, 6) || [])
      setOrders(o?.data?.slice(0, 5) || [])
      const coinList = c?.data || []
      setCoins(coinList.slice(0, 7))
      
      const pts = Array.from({ length: 12 }, (_, i) => ({
        name: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
        value: 10000 + Math.random() * 5000 * (i + 1) * 0.3,
      }))
      setChartData(pts)
    }).finally(() => setLoading(false))
  }, [])

  const totalAssetValue = assets.reduce((s, a) => s + (a.quantity * (a.coin?.current_price || 0)), 0)
  const netWorth = (wallet?.balance || 0) + totalAssetValue
  const gainers  = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 3)
  const losers   = [...coins].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 3)

  if (loading) return <Spinner />

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip" style={{ background: '#fff', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'Space Mono', color: 'var(--green)', fontWeight: 'bold' }}>{formatINR(payload[0].value)}</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Zap size={20} style={{ color: 'var(--green)' }} />
          <h1 style={{ fontFamily: 'Chakra Petch', fontSize: 22, fontWeight: 700, letterSpacing: 1, color: 'var(--text-primary)' }}>
            Welcome back, <span style={{ color: 'var(--green)' }}>{user?.fullName?.split(' ')[0] || 'Trader'}</span>
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 32 }}>
          Your DeltaEdge portfolio at a glance — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="dashboard-grid stagger-children" style={{ marginBottom: 24 }}>
        <StatCard icon={Wallet}    label="TOTAL NET WORTH"     value={formatINR(netWorth)}          sub="wallet + assets"   color="var(--green)"  delay={0}    />
        <StatCard icon={BarChart2} label="WALLET BALANCE"      value={formatINR(wallet?.balance||0)} sub="available cash"   color="var(--accent)" delay={0.05} />
        <StatCard icon={TrendingUp}  label="ASSET VALUE"       value={formatINR(totalAssetValue)}   sub="across all coins"  color="var(--gold)"   delay={0.10} />
        <StatCard icon={Activity}  label="TOTAL ORDERS"        value={orders.length || '—'}         sub="lifetime trades"   color="var(--purple)" delay={0.15} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        
        <div className="glass-card" style={{ padding: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-title" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Portfolio Value</div>
              <div className="section-subtitle" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>12-month performance</div>
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 20, color: 'var(--green)', fontWeight: 'bold' }}>{formatINR(netWorth)}</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="var(--green)" strokeWidth={2} fill="url(#greenGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass-card" style={{ padding: 18, flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={14} style={{ color: 'var(--green)' }} />
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: 'var(--green)', letterSpacing: 1, fontWeight: 'bold' }}>TOP GAINERS</span>
            </div>
            {gainers.map(c => (
              <div key={c.id} onClick={() => navigate(`/market/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.symbol?.toUpperCase()}</span>
                <span className="price-up" style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--green)', fontWeight: 'bold' }}>+{formatPct(c.price_change_percentage_24h)}</span>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: 18, flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingDown size={14} style={{ color: 'var(--red)' }} />
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: 'var(--red)', letterSpacing: 1, fontWeight: 'bold' }}>TOP LOSERS</span>
            </div>
            {losers.map(c => (
              <div key={c.id} onClick={() => navigate(`/market/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.symbol?.toUpperCase()}</span>
                <span className="price-down" style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--red)', fontWeight: 'bold' }}>{formatPct(c.price_change_percentage_24h)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: '600' }}>My Holdings</div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent)', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => navigate('/portfolio')}>
              View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
          {assets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No holdings yet. Start trading!</div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px' }}><th style={{ padding: '12px 20px' }}>ASSET</th><th style={{ padding: '12px 20px' }}>QTY</th><th style={{ padding: '12px 20px' }}>VALUE</th></tr></thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }} onClick={() => navigate(`/market/${a.coin?.id}`)}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={a.coin?.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{a.coin?.symbol?.toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.coin?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-primary)' }}>{a.quantity?.toFixed(6)}</td>
                    <td style={{ padding: '12px 20px', fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatINR(a.quantity * (a.coin?.current_price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: '600' }}>Recent Orders</div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent)', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none' }} onClick={() => navigate('/trading')}>
              View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No orders placed yet.</div>
          ) : (
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px' }}><th style={{ padding: '12px 20px' }}>COIN</th><th style={{ padding: '12px 20px' }}>TYPE</th><th style={{ padding: '12px 20px' }}>AMOUNT</th><th style={{ padding: '12px 20px' }}>DATE</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{o.coin?.symbol?.toUpperCase() || '—'}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span className={`badge ${o.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: o.orderType === 'BUY' ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)', color: o.orderType === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold' }}>{o.orderType}</span>
                    </td>
                    <td style={{ padding: '12px 20px', fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatINR(o.price)}</td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDateTime(o.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}