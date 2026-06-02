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
      // DEBUG: Log this to your browser console (F12) to see what the backend is actually sending
      console.log("ORDER_DATA_FROM_BACKEND:", r.data)
      setOrders(r.data || [])
    } catch { 
      toast.error('Failed to load orders') 
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.orderType === filter)

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
          <button className="btn-green" onClick={() => navigate('/market')} style={{ padding: '9px 16px' }}>New Order</button>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
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
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40 }}><Spinner /></td></tr>
            ) : filtered.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-dim)' }}>
                   #{order.id?.toString().slice(-4).toUpperCase()}
                </td>

                {/* ASSET FALLBACK LOGIC */}
                <td style={{ fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {order.coin?.image && <img src={order.coin.image} style={{ width: 18, height: 18, borderRadius: '50%' }} alt="" />}
                    <span>
                        {/* Checks for full object, then flat coinId, then flat symbol */}
                        {order.coin?.symbol?.toUpperCase() || order.coinId?.toUpperCase() || order.symbol?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                </td>

                <td>
                  <span className={`badge ${order.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                    {order.orderType}
                  </span>
                </td>

                {/* QUANTITY FALLBACK LOGIC */}
                <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>
                  {/* Checks every common backend name for quantity */}
                  {formatNumber(order.quantity || order.amount || order.qty || order.size || 0, 6)}
                </td>

                <td style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 600 }}>
                  {formatUSD(order.price || order.totalPrice || 0)}
                </td>

                <td>
                  <span className="badge badge-green" style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--green)' }}>
                    {order.status || 'SUCCESS'}
                  </span>
                </td>

                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {fmtDateTime(order.timestamp || order.createdAt || new Date())}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !loading && <EmptyState title="No orders found" subtitle="Place a trade in the Market tab" />}
      </div>
    </div>
  )
}