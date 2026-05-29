import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, GitFork, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Spinner from '../components/common/Spinner'
import { coinAPI, watchlistAPI, orderAPI, walletAPI } from '../services/api'
import { formatUSD, formatCompact, formatPct, priceClass, fmtDate, newIdempotencyKey } from '../utils/format'
import { useToast } from '../context/ToastContext'
import { subscribeTopic } from '../services/websocket'

const PERIODS = [
  { label: '1D', days: 1 }, { label: '7D', days: 7 },
  { label: '1M', days: 30 }, { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
]

export default function CoinDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const [coin,      setCoin]      = useState(null)
  const [details,   setDetails]   = useState(null)
  const [chartData, setChartData] = useState([])
  const [period,    setPeriod]    = useState(7)
  const [loading,   setLoading]   = useState(true)
  const [inWatch,   setInWatch]   = useState(false)
  const [livePrice, setLivePrice] = useState(null)
  const [wallet,    setWallet]    = useState(null)

  // Trade panel
  const [tradeType,  setTradeType]  = useState('BUY')
  const [quantity,   setQuantity]   = useState('')
  const [tradeLoading, setTradeLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [coinRes, watchRes, walletRes] = await Promise.all([
          coinAPI.getById(id),
          watchlistAPI.get().catch(() => null),
          walletAPI.getWallet().catch(() => null),
        ])
        setCoin(coinRes.data)
        setWallet(walletRes?.data)
        const wCoins = watchRes?.data?.coins?.map(c => c.id) || []
        setInWatch(wCoins.includes(id))
      } catch { toast.error('Failed to load coin data') }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!id) return
    coinAPI.getChart(id, period).then(r => {
      const raw = r.data?.prices || []
      setChartData(raw.map(([ts, price]) => ({ ts, price, date: fmtDate(ts) })))
    }).catch(() => {})
  }, [id, period])

  useEffect(() => {
    const sub = subscribeTopic(`/topic/coin/${id}`, (d) => setLivePrice(d?.price))
    return () => sub?.unsubscribe()
  }, [id])

  const toggleWatch = async () => {
    try {
      if (inWatch) { await watchlistAPI.remove(id); toast.info('Removed from watchlist') }
      else         { await watchlistAPI.add(id);    toast.success('Added to watchlist') }
      setInWatch(w => !w)
    } catch { toast.error('Action failed') }
  }

  const handleTrade = async () => {
    if (!quantity || isNaN(quantity) || +quantity <= 0) { toast.error('Enter a valid quantity'); return }
    setTradeLoading(true)
    try {
      const key = newIdempotencyKey()
      await orderAPI.create({ coinId: id, quantity: +quantity, orderType: tradeType }, key)
      toast.success(`${tradeType} order placed successfully!`)
      setQuantity('')
      // refresh wallet
      walletAPI.getWallet().then(r => setWallet(r.data)).catch(() => {})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed')
    }
    setTradeLoading(false)
  }

  if (loading) return <Spinner />
  if (!coin) return <div style={{ color: 'var(--text-dim)', padding: 32 }}>Coin not found.</div>

  const price  = livePrice ?? coin.current_price
  const pct24  = coin.price_change_percentage_24h
  const cost   = quantity ? (+quantity * price).toFixed(2) : '—'

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="chart-tooltip">
        <div style={{ color: 'var(--text-dim)', fontSize: 11 }}>{payload[0].payload.date}</div>
        <div style={{ fontFamily: 'Space Mono', color: 'var(--green)', marginTop: 2 }}>{formatUSD(payload[0].value)}</div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Back + Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} />
        </button>
        <img src={coin.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        <div>
          <h1 style={{ fontFamily: 'Chakra Petch', fontSize: 22, fontWeight: 700 }}>{coin.name}</h1>
          <span style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text-dim)' }}>{coin.symbol?.toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => navigate(`/graph-risk?coin=${id}`)}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <GitFork size={14} /> Risk Graph
        </button>
        <button onClick={toggleWatch} className="btn-ghost" style={{ padding: '8px 12px' }}>
          <Star size={16} fill={inWatch ? 'var(--gold)' : 'none'} style={{ color: inWatch ? 'var(--gold)' : 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Price header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
        <div style={{ fontFamily: 'Space Mono', fontSize: 36, fontWeight: 700, color: livePrice ? 'var(--green)' : 'var(--text-primary)' }}>
          {formatUSD(price)}
        </div>
        <span className={`badge ${pct24 >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 14, padding: '5px 14px' }}>
          {formatPct(pct24)}
        </span>
        {livePrice && <span className="badge badge-blue" style={{ fontSize: 10 }}>● LIVE</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            {PERIODS.map(p => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className="tab-btn"
                style={{ flex: 'none', padding: '6px 14px', ...(period === p.days ? { background: 'var(--bg-elevated)', color: 'var(--text-primary)' } : {}) }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={pct24 >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={pct24 >= 0 ? 'var(--green)' : 'var(--red)'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} tickFormatter={v => formatCompact(v)} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="price" stroke={pct24 >= 0 ? 'var(--green)' : 'var(--red)'} strokeWidth={2} fill="url(#priceGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right panel: Stats + Trade */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Stats */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 14 }}>Market Stats</div>
            {[
              ['Market Cap',    formatCompact(coin.market_cap)],
              ['24H Volume',    formatCompact(coin.total_volume)],
              ['ATH',           formatUSD(coin.ath)],
              ['ATL',           formatUSD(coin.atl)],
              ['Circulating',   formatCompact(coin.circulating_supply)],
              ['Max Supply',    coin.max_supply ? formatCompact(coin.max_supply) : '∞'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{label}</span>
                <span style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Trade */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="section-title" style={{ fontSize: 14, marginBottom: 14 }}>Place Order</div>
            <div className="tab-group" style={{ marginBottom: 16 }}>
              <button className={`tab-btn ${tradeType === 'BUY' ? 'active' : ''}`} onClick={() => setTradeType('BUY')} style={{ color: tradeType === 'BUY' ? 'var(--green)' : '' }}>BUY</button>
              <button className={`tab-btn ${tradeType === 'SELL' ? 'active' : ''}`} onClick={() => setTradeType('SELL')} style={{ color: tradeType === 'SELL' ? 'var(--red)' : '' }}>SELL</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, display: 'block', marginBottom: 6 }}>QUANTITY ({coin.symbol?.toUpperCase()})</label>
              <input
                className="input-field"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
              <span>Estimated Cost</span>
              <span style={{ fontFamily: 'Space Mono', color: 'var(--text-primary)' }}>{cost !== '—' ? formatUSD(cost) : '—'}</span>
            </div>
            {wallet && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 12, color: 'var(--text-dim)' }}>
                <span>Available Balance</span>
                <span style={{ fontFamily: 'Space Mono', color: 'var(--green)' }}>{formatUSD(wallet.balance)}</span>
              </div>
            )}
            <button
              onClick={handleTrade}
              disabled={tradeLoading}
              className={tradeType === 'BUY' ? 'btn-green' : 'btn-red'}
              style={{ width: '100%', padding: '12px 20px' }}
            >
              {tradeLoading ? 'Processing…' : `${tradeType} ${coin.symbol?.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
