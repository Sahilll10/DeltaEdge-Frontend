import React, { useState, useEffect } from 'react'
import { ArrowDownToLine, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import Modal      from '../components/common/Modal'
import { withdrawalAPI, walletAPI } from '../services/api'
import { formatUSD, fmtDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'

const STATUS_ICON = {
  PENDING:  <Clock       size={14} style={{ color: 'var(--gold)' }} />,
  SUCCESS:  <CheckCircle size={14} style={{ color: 'var(--green)' }} />,
  FAILED:   <XCircle     size={14} style={{ color: 'var(--red)' }} />,
  APPROVED: <CheckCircle size={14} style={{ color: 'var(--green)' }} />,
  REJECTED: <XCircle     size={14} style={{ color: 'var(--red)' }} />,
}

export default function WithdrawalPage() {
  const toast = useToast()
  const [requests,  setRequests]  = useState([])
  const [wallet,    setWallet]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [amount,    setAmount]    = useState('')
  const [bankAcc,   setBankAcc]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [r, w] = await Promise.all([withdrawalAPI.getAll(), walletAPI.getWallet().catch(() => null)])
      setRequests(r.data || [])
      setWallet(w?.data)
    } catch { toast.error('Failed to load withdrawals') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!amount || +amount <= 0) { toast.error('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      await withdrawalAPI.request({ amount: +amount, bankAccount: bankAcc })
      toast.success('Withdrawal request submitted!')
      setModal(false); setAmount(''); setBankAcc('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Request failed') }
    setSubmitting(false)
  }

  const cancel = async (id) => {
    try {
      await withdrawalAPI.cancel(id)
      toast.info('Withdrawal cancelled')
      load()
    } catch { toast.error('Cancel failed') }
  }

  const totalPending  = requests.filter(r => r.status === 'PENDING').length
  const totalApproved = requests.filter(r => r.status === 'SUCCESS' || r.status === 'APPROVED').length

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowDownToLine size={18} style={{ color: 'var(--red)' }} /> Withdrawals
          </div>
          <div className="section-subtitle">Manage fund withdrawal requests</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-red" onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowDownToLine size={14} /> New Request
          </button>
          <button className="btn-ghost" onClick={load} style={{ padding: '9px 12px' }}><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'WALLET BALANCE',   value: formatUSD(wallet?.balance || 0), color: 'var(--green)' },
          { label: 'TOTAL REQUESTS',   value: requests.length,                  color: 'var(--text-primary)' },
          { label: 'PENDING',          value: totalPending,                     color: 'var(--gold)' },
          { label: 'APPROVED',         value: totalApproved,                    color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>DATE</th><th>AMOUNT</th><th>BANK ACCOUNT</th><th>STATUS</th><th></th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><Spinner /></td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={5}><EmptyState title="No withdrawal requests" /></td></tr>
            ) : requests.map(req => (
              <tr key={req.id}>
                <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDateTime(req.date || req.createdAt)}</td>
                <td style={{ fontFamily: 'Space Mono', fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>
                  -{formatUSD(req.amount)}
                </td>
                <td style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {req.bankAccount ? `****${req.bankAccount.slice(-4)}` : '—'}
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {STATUS_ICON[req.status] || STATUS_ICON.PENDING}
                    <span className={`badge ${req.status === 'SUCCESS' || req.status === 'APPROVED' ? 'badge-green' : req.status === 'FAILED' || req.status === 'REJECTED' ? 'badge-red' : 'badge-gold'}`}>
                      {req.status || 'PENDING'}
                    </span>
                  </span>
                </td>
                <td>
                  {req.status === 'PENDING' && (
                    <button onClick={() => cancel(req.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 12, fontFamily: 'Chakra Petch' }}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Request Withdrawal">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '12px 16px', background: 'var(--red-dim)', borderRadius: 8, fontSize: 13, color: 'var(--red)', border: '1px solid rgba(255,61,94,0.2)' }}>
            Available: <strong>{formatUSD(wallet?.balance || 0)}</strong>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>AMOUNT (USD)</label>
            <input className="input-field" type="number" min="1" placeholder="100.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>BANK ACCOUNT NUMBER</label>
            <input className="input-field" placeholder="Account number" value={bankAcc} onChange={e => setBankAcc(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn-red" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Request Withdrawal'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
