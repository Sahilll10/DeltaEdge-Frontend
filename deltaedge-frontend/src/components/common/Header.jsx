import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, Wifi, WifiOff, Bell, X } from 'lucide-react'
import { coinAPI } from '../../services/api'
import { formatUSD, formatPct, priceClass } from '../../utils/format'
import { isConnected } from '../../services/websocket'

export default function Header({ onMenuToggle }) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [wsStatus, setWsStatus]   = useState(false)
  const [trending, setTrending]   = useState([])
  const searchRef = useRef(null)
  const navigate  = useNavigate()

  useEffect(() => {
    coinAPI.getTrending().then(r => setTrending(r.data?.slice(0, 10) || [])).catch(() => {})
    const interval = setInterval(() => setWsStatus(isConnected()), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await coinAPI.search(query)
        setResults(r.data?.slice(0, 6) || [])
      } catch {}
      setSearching(false)
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setShowSearch(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const goToCoin = (id) => {
    navigate(`/market/${id}`)
    setQuery('')
    setResults([])
    setShowSearch(false)
  }

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 20px', background: 'var(--bg-void)',
      borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40
    }}>
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuToggle}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
        className="md:hidden"
      >
        <Menu size={22} />
      </button>

      {/* Ticker tape */}
      <div className="ticker-container" style={{ flex: 1, height: 36, display: 'flex', alignItems: 'center' }}>
        <div className="ticker-track">
          {[...trending, ...trending].map((coin, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', cursor: 'pointer' }}
              onClick={() => goToCoin(coin.id)}>
              <img src={coin.image} alt="" style={{ width: 16, height: 16, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
              <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {coin.symbol?.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-secondary)' }}>
                {formatUSD(coin.current_price)}
              </span>
              <span className={priceClass(coin.price_change_percentage_24h)} style={{ fontFamily: 'Space Mono', fontSize: 10 }}>
                {formatPct(coin.price_change_percentage_24h)}
              </span>
              <span style={{ color: 'var(--border-bright)', margin: '0 4px' }}>|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div ref={searchRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowSearch(s => !s)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
        >
          <Search size={18} />
        </button>

        {showSearch && (
          <div style={{
            position: 'absolute', top: 40, right: 0,
            width: 320, background: 'var(--bg-elevated)',
            border: '1px solid var(--border-bright)', borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)', zIndex: 200
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Search size={14} style={{ color: 'var(--text-dim)' }} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search coins..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'DM Sans' }}
              />
              {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}><X size={14} /></button>}
            </div>
            {searching && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>Searching...</div>
            )}
            {!searching && results.map(coin => (
              <div
                key={coin.id}
                onClick={() => goToCoin(coin.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img src={coin.image} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{coin.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>{coin.symbol?.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontFamily: 'Space Mono' }}>{formatUSD(coin.current_price)}</div>
                  <div className={priceClass(coin.price_change_percentage_24h)} style={{ fontSize: 11 }}>
                    {formatPct(coin.price_change_percentage_24h)}
                  </div>
                </div>
              </div>
            ))}
            {!searching && query && results.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No results found</div>
            )}
          </div>
        )}
      </div>

      {/* WS Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {wsStatus
          ? <Wifi size={14} style={{ color: 'var(--green)' }} />
          : <WifiOff size={14} style={{ color: 'var(--red)' }} />
        }
        <span style={{ fontSize: 10, fontFamily: 'Space Mono', color: wsStatus ? 'var(--green)' : 'var(--red)', display: 'none' }} className="sm:inline">
          {wsStatus ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </header>
  )
}
