import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Trash2, TrendingUp, RefreshCw } from 'lucide-react'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { watchlistAPI } from '../services/api'
import { formatUSD, formatCompact, formatPct } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function WatchlistPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [coins,   setCoins]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await watchlistAPI.get()
      setCoins(r.data?.coins || [])
    } catch { toast.error('Failed to load watchlist') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const remove = async (coinId) => {
    try {
      await watchlistAPI.remove(coinId)
      setCoins(c => c.filter(x => x.id !== coinId))
      toast.info('Removed from watchlist')
    } catch { toast.error('Remove failed') }
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={18} style={{ color: 'var(--gold)' }} /> Watchlist
          </div>
          <div className="section-subtitle">{coins.length} coin{coins.length !== 1 ? 's' : ''} tracked</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={() => navigate('/market')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} /> Browse Market
          </button>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {loading ? <Spinner /> : coins.length === 0 ? (
        <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
          <Star size={48} style={{ color: 'var(--border-bright)', marginBottom: 16 }} />
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>Your watchlist is empty</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 20 }}>Star any coin from the Market page to track it here</div>
          <button className="btn-primary" onClick={() => navigate('/market')}>Go to Market</button>
        </div>
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr><th>COIN</th><th>PRICE</th><th>24H %</th><th>7D %</th><th>MKT CAP</th><th>VOLUME</th><th></th></tr>
            </thead>
            <tbody>
              {coins.map(coin => {
                const pct24 = coin.price_change_percentage_24h
                const pct7  = coin.price_change_percentage_7d
                return (
                  <tr key={coin.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/market/${coin.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={coin.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{coin.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>{coin.symbol?.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{formatUSD(coin.current_price)}</td>
                    <td><span className={`badge ${pct24 >= 0 ? 'badge-green' : 'badge-red'}`}>{formatPct(pct24)}</span></td>
                    <td><span className={`badge ${(pct7 || 0) >= 0 ? 'badge-green' : 'badge-red'}`}>{formatPct(pct7)}</span></td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatCompact(coin.market_cap)}</td>
                    <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatCompact(coin.total_volume)}</td>
                    <td onClick={e => { e.stopPropagation(); remove(coin.id) }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
