import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, RefreshCw, Trash2 } from 'lucide-react'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { orderAPI, coinAPI } from '../services/api'
import { formatUSD, fmtDateTime } from '../utils/format'
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
    } catch { toast.error('Failed to load orders') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const cancelOrder = async (id) => {
    try {
      await orderAPI.cancel(id)
      toast.success('Order cancelled')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed') }
  }

  const FILTERS = ['ALL', 'BUY', 'SELL']
  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.orderType === filter)

  const totalBuy   = orders.filter(o => o.orderType === 'BUY').reduce((s, o) => s + (o.price || 0), 0)
  const totalSell  = orders.filter(o => o.orderType === 'SELL').reduce((s, o) => s + (o.price || 0), 0)

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Order Management
          </div>
          <div className="section-subtitle">All trades with idempotency-protected execution</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-green"  onClick={() => navigate('/market')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>New Order</button>
          <button className="btn-ghost"  onClick={load} style={{ padding: '9px 12px' }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL ORDERS', value: orders.length,  color: 'var(--text-primary)' },
          { label: 'BUY ORDERS',   value: orders.filter(o => o.orderType === 'BUY').length,  color: 'var(--green)' },
          { label: 'SELL ORDERS',  value: orders.filter(o => o.orderType === 'SELL').length, color: 'var(--red)' },
          { label: 'NET P&L',      value: formatUSD(totalSell - totalBuy),    color: totalSell >= totalBuy ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`tab-btn ${filter === f ? 'active' : ''}`} style={{ flex: 'none', padding: '7px 18px' }}>{f}</button>
        ))}
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>COIN</th><th>TYPE</th><th>QUANTITY</th><th>PRICE</th><th>STATUS</th><th>DATE</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><Spinner /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No orders" subtitle="Head to Market to place your first trade" /></td></tr>
            ) : filtered.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-dim)' }}>#{order.id}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate(`/market/${order.coin?.id}`)}>
                    <img src={order.coin?.image} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} onError={e => e.target.style.display='none'} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{order.coin?.symbol?.toUpperCase() || '—'}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${order.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`}>{order.orderType}</span>
                </td>
                <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{order.quantity?.toFixed(6) || '—'}</td>
                <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{formatUSD(order.price)}</td>
                <td>
                  <span className={`badge ${order.status === 'SUCCESS' ? 'badge-green' : order.status === 'PENDING' ? 'badge-gold' : 'badge-red'}`}>
                    {order.status || 'COMPLETED'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDateTime(order.timestamp || order.createdAt)}</td>
                <td>
                  {order.status === 'PENDING' && (
                    <button onClick={() => cancelOrder(order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex' }}>
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
