import React, { useState, useEffect } from 'react'
import { Wallet, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, RefreshCw, Shield } from 'lucide-react'
import StatCard  from '../components/common/StatCard'
import Spinner   from '../components/common/Spinner'
import Modal     from '../components/common/Modal'
import EmptyState from '../components/common/EmptyState'
import { walletAPI } from '../services/api'
import { formatUSD, fmtDateTime, txTypeColor, newIdempotencyKey } from '../utils/format'
import { useToast } from '../context/ToastContext'

export default function WalletPage() {
  const toast = useToast()
  const [wallet,  setWallet]  = useState(null)
  const [txns,    setTxns]    = useState([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [modal,  setModal]  = useState(null) // 'deposit' | 'withdraw' | 'transfer'
  const [amount, setAmount] = useState('')
  const [toUser, setToUser] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [w, t] = await Promise.all([walletAPI.getWallet(), walletAPI.getTransactions()])
      setWallet(w.data)
      setTxns(t.data || [])
    } catch { toast.error('Failed to load wallet') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDeposit = async () => {
    if (!amount || +amount <= 0) { toast.error('Enter valid amount'); return }
    setSubmitting(true)
    try {
      await walletAPI.deposit(+amount, newIdempotencyKey())
      toast.success('Deposit initiated — check Razorpay flow')
      setModal(null); setAmount('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Deposit failed') }
    setSubmitting(false)
  }

  const handleWithdraw = async () => {
    if (!amount || +amount <= 0) { toast.error('Enter valid amount'); return }
    setSubmitting(true)
    try {
      await walletAPI.withdraw({ amount: +amount }, newIdempotencyKey())
      toast.success('Withdrawal request submitted!')
      setModal(null); setAmount('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Withdrawal failed') }
    setSubmitting(false)
  }

  const handleTransfer = async () => {
    if (!amount || +amount <= 0 || !toUser) { toast.error('Fill all fields'); return }
    setSubmitting(true)
    try {
      await walletAPI.transfer(toUser, +amount, newIdempotencyKey())
      toast.success('Transfer successful!')
      setModal(null); setAmount(''); setToUser('')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed') }
    setSubmitting(false)
  }

  const closeModal = () => { setModal(null); setAmount(''); setToUser('') }

  if (loading) return <Spinner />

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wallet size={18} style={{ color: 'var(--green)' }} /> Wallet
          </div>
          <div className="section-subtitle">ACID-compliant dual-entry ledger</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-green"  onClick={() => setModal('deposit')}  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowDownCircle size={15} /> Deposit
          </button>
          <button className="btn-red"    onClick={() => setModal('withdraw')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpCircle size={15} /> Withdraw
          </button>
          <button className="btn-ghost"  onClick={() => setModal('transfer')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeftRight size={15} /> Transfer
          </button>
          <button className="btn-ghost"  onClick={load} style={{ padding: '9px 12px' }}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-grid stagger-children" style={{ marginBottom: 24 }}>
        <StatCard icon={Wallet}     label="AVAILABLE BALANCE" value={formatUSD(wallet?.balance || 0)} color="var(--green)" />
        <StatCard icon={ArrowDownCircle} label="TOTAL DEPOSITS"  value={formatUSD(txns.filter(t => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0))} color="var(--accent)" />
        <StatCard icon={ArrowUpCircle}  label="TOTAL WITHDRAWALS" value={formatUSD(txns.filter(t => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0))} color="var(--red)" />
        <StatCard icon={Shield}     label="TRANSACTIONS"      value={txns.length} color="var(--gold)" sub="idempotency-protected" />
      </div>

      {/* ACID Architecture badge */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Shield size={18} style={{ color: 'var(--gold)' }} />
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', fontFamily: 'Chakra Petch' }}>ACID COMPLIANCE ACTIVE</span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 12 }}>
            Pessimistic row-level locking · Redis idempotency layer · Dual-entry ledger verification
          </span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-title" style={{ fontSize: 15 }}>Transaction History</div>
          <div className="section-subtitle">Immutable audit ledger — every mutation recorded</div>
        </div>
        {txns.length === 0 ? (
          <EmptyState title="No transactions yet" subtitle="Deposit funds to get started" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>TYPE</th>
                <th>AMOUNT</th>
                <th>BALANCE AFTER</th>
                <th>PURPOSE</th>
              </tr>
            </thead>
            <tbody>
              {txns.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{fmtDateTime(tx.date || tx.createdAt)}</td>
                  <td>
                    <span className="badge" style={{ background: `${txTypeColor(tx.type)}18`, color: txTypeColor(tx.type), border: `1px solid ${txTypeColor(tx.type)}33` }}>
                      {tx.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 13, color: txTypeColor(tx.type) }}>
                    {['DEPOSIT','SELL_ASSET','TRANSFER_IN'].includes(tx.type) ? '+' : '-'}
                    {formatUSD(Math.abs(tx.amount))}
                  </td>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{formatUSD(tx.walletBalance)}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{tx.purpose || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DEPOSIT MODAL */}
      <Modal isOpen={modal === 'deposit'} onClose={closeModal} title="Deposit Funds">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '12px 16px', background: 'var(--green-dim)', borderRadius: 8, fontSize: 13, color: 'var(--green)', border: '1px solid rgba(0,229,160,0.2)' }}>
            Funds are deposited via Razorpay. Each request is protected by an idempotency key to prevent duplicate charges.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>AMOUNT (USD)</label>
            <input className="input-field" type="number" min="1" placeholder="500.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn-green" onClick={handleDeposit} disabled={submitting}>{submitting ? 'Processing…' : 'Deposit'}</button>
          </div>
        </div>
      </Modal>

      {/* WITHDRAW MODAL */}
      <Modal isOpen={modal === 'withdraw'} onClose={closeModal} title="Withdraw Funds">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '12px 16px', background: 'var(--red-dim)', borderRadius: 8, fontSize: 13, color: 'var(--red)', border: '1px solid rgba(255,61,94,0.2)' }}>
            Balance: <strong>{formatUSD(wallet?.balance || 0)}</strong>. Withdrawal requests are processed asynchronously.
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>AMOUNT (USD)</label>
            <input className="input-field" type="number" min="1" placeholder="100.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn-red" onClick={handleWithdraw} disabled={submitting}>{submitting ? 'Processing…' : 'Withdraw'}</button>
          </div>
        </div>
      </Modal>

      {/* TRANSFER MODAL */}
      <Modal isOpen={modal === 'transfer'} onClose={closeModal} title="Wallet Transfer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '12px 16px', background: 'rgba(27,116,255,0.1)', borderRadius: 8, fontSize: 13, color: '#60A5FA', border: '1px solid rgba(27,116,255,0.2)' }}>
            Peer-to-peer transfer uses deterministic deadlock prevention (lower-ID-first locking).
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>RECIPIENT USER ID</label>
            <input className="input-field" placeholder="User ID" value={toUser} onChange={e => setToUser(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>AMOUNT (USD)</label>
            <input className="input-field" type="number" min="1" placeholder="50.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={handleTransfer} disabled={submitting}>{submitting ? 'Sending…' : 'Transfer'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
