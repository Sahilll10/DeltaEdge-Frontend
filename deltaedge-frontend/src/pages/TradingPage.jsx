import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, RefreshCw, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={18} style={{ color: 'var(--accent)' }} /> Order Management
          </div>
          <div className="section-subtitle">Official trade execution records from DeltaEdge Engine</div>
        </div>
        <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40 }}><Spinner /></td></tr>
            ) : orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-dim)' }}>
                   #{order.id}
                </td>

                {/* ASSET FIX: Accessing through orderItem */}
                <td style={{ fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {order.orderItem?.coin?.image && <img src={order.orderItem.coin.image} style={{ width: 18, height: 18, borderRadius: '50%' }} alt="" />}
                    <span>
                        {order.orderItem?.coin?.symbol?.toUpperCase() || "BTC"}
                    </span>
                  </div>
                </td>

                <td>
                  <span className={`badge ${order.orderType === 'BUY' ? 'badge-green' : 'badge-red'}`}>
                    {order.orderType}
                  </span>
                </td>

                {/* QUANTITY FIX: Accessing through orderItem */}
                <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>
                  {formatNumber(order.orderItem?.quantity || 0, 6)}
                </td>

                <td style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 600 }}>
                  {formatUSD(order.price || 0)}
                </td>

                <td>
                  <span className="badge badge-green" style={{ background: 'rgba(22, 163, 74, 0.1)', color: 'var(--green)' }}>
                    {order.status || 'SUCCESS'}
                  </span>
                </td>

                {/* DATE FIX: Handling ISO Timestamp */}
                <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} opacity={0.5} />
                        {fmtDateTime(order.timestamp)}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && !loading && <EmptyState title="No orders found" subtitle="Database is currently empty." />}
      </div>
    </div>
  )
}