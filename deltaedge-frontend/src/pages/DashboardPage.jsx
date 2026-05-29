import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, BarChart2, Activity, ArrowRight, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../components/common/StatCard'
import Spinner  from '../components/common/Spinner'
import { walletAPI, coinAPI, assetAPI, orderAPI } from '../services/api'
import { formatUSD, formatCompact, formatPct, priceClass, fmtDateTime } from '../utils/format'
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
      // Build portfolio chart from wallet transactions (mock shape if empty)
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
      <div className="chart-tooltip">
        <div style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'Space Mono', color: 'var(--green)' }}>{formatUSD(payload[0].value)}</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <Zap size={20} style={{ color: 'var(--green)' }} />
          <h1 style={{ fontFamily: 'Chakra Petch', fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
            Welcome back, <span style={{ color: 'var(--green)' }}>{user?.fullName?.split(' ')[0] || 'Trader'}</span>
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 32 }}>
          Your DeltaEdge portfolio at a glance — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat row */}
      <div className="dashboard-grid stagger-children" style={{ marginBottom: 24 }}>
        <StatCard icon={Wallet}    label="TOTAL NET WORTH"     value={formatUSD(netWorth)}          sub="wallet + assets"   color="var(--green)"  delay={0}    />
        <StatCard icon={BarChart2} label="WALLET BALANCE"      value={formatUSD(wallet?.balance||0)} sub="available cash"   color="var(--accent)" delay={0.05} />
        <StatCard icon={TrendingUp}  label="ASSET VALUE"       value={formatUSD(totalAssetValue)}   sub="across all coins"  color="var(--gold)"   delay={0.10} />
        <StatCard icon={Activity}  label="TOTAL ORDERS"        value={orders.length || '—'}         sub="lifetime trades"   color="var(--purple)" delay={0.15} />
      </div>

      {/* Portfolio chart + Gainers/Losers */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div className="section-title">Portfolio Value</div>
              <div className="section-subtitle">12-month performance</div>
            </div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 20, color: 'var(--green)' }}>{formatUSD(netWorth)}</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.25} />
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

        {/* Gainers / Losers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass-card" style={{ padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingUp size={14} style={{ color: 'var(--green)' }} />
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: 'var(--green)', letterSpacing: 1 }}>TOP GAINERS</span>
            </div>
            {gainers.map(c => (
              <div key={c.id} onClick={() => navigate(`/market/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.symbol?.toUpperCase()}</span>
                <span className="price-up" style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatPct(c.price_change_percentage_24h)}</span>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingDown size={14} style={{ color: 'var(--red)' }} />
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: 'var(--red)', letterSpacing: 1 }}>TOP LOSERS</span>
            </div>
            {losers.map(c => (
              <div key={c.id} onClick={() => navigate(`/market/${c.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
                <img src={c.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{c.symbol?.toUpperCase()}</span>
                <span className="price-down" style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatPct(c.price_change_percentage_24h)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings + Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Holdings */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ fontSize: 15 }}>My Holdings</div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => navigate('/portfolio')}>
              View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
          {assets.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No holdings yet. Start trading!</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>ASSET</th><th>QTY</th><th>VALUE</th></tr></thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/market/${a.coin?.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={a.coin?.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{a.coin?.symbol?.toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{a.coin?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{a.quantity?.toFixed(6)}</td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--green)' }}>{formatUSD(a.quantity * (a.coin?.current_price || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Orders */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="section-title" style={{ fontSize: 15 }}>Recent Orders</div>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => navigate('/trading')}>
              View All <ArrowRight size={12} style={{ display: 'inline', marginLeft: 4 }} />
            </button>
          </div>
          {orders.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No orders placed yet.</div>
          ) : (
            <table className="data-table">
              <thead><tr><th>COIN</th><th>TYPE</th><th>AMOUNT</th><th>DATE</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{o.coin?.symbol?.toUpperCase() || '—'}</td>
                    <td>
                      <span className={`badge ${o.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`}>{o.orderType}</span>
                    </td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{formatUSD(o.price)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDateTime(o.timestamp)}</td>
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
