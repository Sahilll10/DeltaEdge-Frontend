import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import Spinner   from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { coinAPI, watchlistAPI } from '../services/api'
import { formatUSD, formatCompact, formatPct, priceClass, debounce } from '../utils/format'
import { useToast } from '../context/ToastContext'
import { subscribeTopic } from '../services/websocket'

export default function MarketPage() {
  const [coins,      setCoins]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [query,      setQuery]      = useState('')
  const [watchlist,  setWatchlist]  = useState([])
  const [livePrice,  setLivePrice]  = useState({})
  const navigate = useNavigate()
  const toast    = useToast()

  const fetchCoins = async (p = 1) => {
    setLoading(true)
    try {
      const r = await coinAPI.getAll(p)
      setCoins(r.data || [])
    } catch { toast.error('Failed to load market data') }
    setLoading(false)
  }

  const fetchWatchlist = async () => {
    try {
      const r = await watchlistAPI.get()
      setWatchlist((r.data?.coins || []).map(c => c.id))
    } catch {}
  }

  useEffect(() => {
    fetchCoins(page)
    fetchWatchlist()
  }, [page])

  // WS live prices
  useEffect(() => {
    const sub = subscribeTopic('/topic/prices', (data) => {
      setLivePrice(prev => ({ ...prev, ...data }))
    })
    return () => sub?.unsubscribe()
  }, [])

  const debouncedSearch = useCallback(debounce(async (q) => {
    if (!q.trim()) { fetchCoins(page); return }
    setLoading(true)
    try {
      const r = await coinAPI.search(q)
      setCoins(r.data || [])
    } catch {}
    setLoading(false)
  }, 400), [page])

  const handleQuery = (e) => {
    setQuery(e.target.value)
    debouncedSearch(e.target.value)
  }

  const toggleWatch = async (e, coinId) => {
    e.stopPropagation()
    const inList = watchlist.includes(coinId)
    try {
      if (inList) {
        await watchlistAPI.remove(coinId)
        setWatchlist(w => w.filter(id => id !== coinId))
        toast.info('Removed from watchlist')
      } else {
        await watchlistAPI.add(coinId)
        setWatchlist(w => [...w, coinId])
        toast.success('Added to watchlist')
      }
    } catch { toast.error('Action failed') }
  }

  const effectivePrice = (coin) => livePrice[coin.id]?.price ?? coin.current_price

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} style={{ color: 'var(--green)' }} /> Crypto Market
          </div>
          <div className="section-subtitle">Live prices for all listed assets</div>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            className="input-field"
            placeholder="Search coins..."
            value={query}
            onChange={handleQuery}
            style={{ paddingLeft: 34, width: 220 }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>COIN</th>
              <th>PRICE</th>
              <th>24H %</th>
              <th>24H HIGH</th>
              <th>24H LOW</th>
              <th>MKT CAP</th>
              <th>VOLUME</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}><Spinner /></td></tr>
            ) : coins.length === 0 ? (
              <tr><td colSpan={9}><EmptyState title="No coins found" /></td></tr>
            ) : coins.map((coin, i) => {
              const price = effectivePrice(coin)
              const changed = livePrice[coin.id] != null
              const pct   = coin.price_change_percentage_24h
              return (
                <tr key={coin.id} onClick={() => navigate(`/market/${coin.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: 'var(--text-dim)', fontFamily: 'Space Mono', fontSize: 12 }}>{(page - 1) * 50 + i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={coin.image} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{coin.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>{coin.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{
                    fontFamily: 'Space Mono', fontSize: 13,
                    color: changed ? (livePrice[coin.id]?.direction === 'up' ? 'var(--green)' : 'var(--red)') : 'var(--text-primary)',
                    transition: 'color 0.5s'
                  }}>
                    {formatUSD(price)}
                  </td>
                  <td>
                    <span className={`badge ${pct >= 0 ? 'badge-green' : 'badge-red'}`}>
                      {formatPct(pct)}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--green)' }}>{formatUSD(coin.high_24h)}</td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--red)' }}>{formatUSD(coin.low_24h)}</td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatCompact(coin.market_cap)}</td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 12 }}>{formatCompact(coin.total_volume)}</td>
                  <td onClick={e => toggleWatch(e, coin.id)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                    <Star
                      size={16}
                      style={{ color: watchlist.includes(coin.id) ? 'var(--gold)' : 'var(--text-dim)', transition: 'color 0.2s' }}
                      fill={watchlist.includes(coin.id) ? 'var(--gold)' : 'none'}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!query && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
          <button className="btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 12px' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-secondary)' }}>Page {page}</span>
          <button className="btn-ghost" onClick={() => setPage(p => p + 1)} style={{ padding: '7px 12px' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
