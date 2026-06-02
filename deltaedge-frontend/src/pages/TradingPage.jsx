import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, RefreshCw, Trash2, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { orderAPI } from '../services/api'
import { formatUSD, formatNumber, fmtDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function TradingPage() {
  const toast    = useToast()
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  const load = async () => {
    setLoading(true)
    try {
      const r = await orderAPI.getAll()
      setOrders(r.data || [])
    } catch { 
      toast.error('Failed to load orders') 
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const cancelOrder = async (id) => {
    try {
      await orderAPI.cancel(id)
      toast.success('Order cancelled')
      load()
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Cancel failed') 
    }
  }

  const FILTERS = ['ALL', 'BUY', 'SELL']
  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.orderType === filter)

  // Calc Stats with fallback for field names 'price' vs 'totalPrice'
  const totalBuy   = orders.filter(o => o.orderType === 'BUY').reduce((s, o) => s + (o.price || o.totalPrice || 0), 0)
  const totalSell  = orders.filter(o => o.orderType === 'SELL').reduce((s, o) => s + (o.price || o.totalPrice || 0), 0)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Order Management
          </div>
          <div className="section-subtitle">Real-time trade execution and lifecycle tracking</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-green" onClick={() => navigate('/market')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}>
            New Order
          </button>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL ORDERS', value: orders.length, color: 'var(--text-primary)' },
          { label: 'BUY VOLUME', value: formatUSD(totalBuy), color: 'var(--green)' },
          { label: 'SELL VOLUME', value: formatUSD(totalSell), color: 'var(--red)' },
          { 
            label: 'EST. NET P&L', 
            value: formatUSD(totalSell - totalBuy), 
            color: (totalSell - totalBuy) >= 0 ? 'var(--green)' : 'var(--red)' 
          },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '16px 20px', borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)} 
            className={`tab-btn ${filter === f ? 'active' : ''}`} 
            style={{ flex: 'none', padding: '7px 22px', fontWeight: 600, fontSize: 12 }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ overflow: 'hidden', background: '#fff' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ASSET</th>
              <th>TYPE</th>
              <th>QUANTITY</th>
              <th>PRICE</th>
              <th>STATUS</th>
              <th>EXECUTION DATE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40 }}><Spinner /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No records found" subtitle="Head to Market to initiate your first position" /></td></tr>
            ) : filtered.map(order => (
              <tr key={order.id}>
                {/* ID Fix: Show last 6 chars of UUID or ID */}
                <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-dim)' }}>
                   #{order.id?.toString().slice(-6).toUpperCase()}
                </td>

                {/* ASSET FIX: Fallback to coinId if nested coin object is null */}
                <td>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} 
                    onClick={() => navigate(`/market/${order.coin?.id || order.coinId}`)}
                  >
                    {order.coin?.image ? (
                        <img src={order.coin.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                    ) : (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>
                            {order.coinId?.slice(0,2).toUpperCase()}
                        </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                        {order.coin?.symbol?.toUpperCase() || order.coinId?.toUpperCase() || '—'}
                    </span>
                  </div>
                </td>

                <td>
                  <span className={`badge ${order.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`} style={{ gap: 4 }}>
                    {order.orderType === 'BUY' ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                    {order.orderType}
                  </span>
                </td>

                {/* QUANTITY FIX: Fallback to 'amount' if 'quantity' is missing */}
                <td style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 500 }}>
                  {formatNumber(order.quantity || order.amount || 0, 6)}
                </td>

                {/* PRICE FIX: Fallback to 'totalPrice' */}
                <td style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 600 }}>
                  {formatUSD(order.price || order.totalPrice)}
                </td>

                <td>
                  <span className={`badge ${order.status === 'SUCCESS' || order.status === 'COMPLETED' ? 'badge-green' : order.status === 'PENDING' ? 'badge-gold' : 'badge-red'}`}>
                    {order.status || 'SUCCESS'}
                  </span>
                </td>

                {/* DATE FIX: Fallback for 'timestamp' vs 'createdAt' */}
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} opacity={0.6} />
                    {fmtDateTime(order.timestamp || order.createdAt || new Date())}
                  </div>
                </td>

                <td style={{ textAlign: 'right', paddingRight: 20 }}>
                  {(order.status === 'PENDING' || !order.status) && (
                    <button 
                      onClick={() => cancelOrder(order.id)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'inline-flex', padding: 4 }}
                      title="Cancel Order"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}