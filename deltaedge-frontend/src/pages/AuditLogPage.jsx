import React, { useState, useEffect } from 'react'
import { FileText, Download, RefreshCw, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import Spinner    from '../components/common/Spinner'
import EmptyState from '../components/common/EmptyState'
import { auditAPI } from '../services/api'
import { fmtDateTime } from '../utils/format'
import { useToast } from '../context/ToastContext'

const STATUS_STYLES = {
  SUCCESS:  { bg: 'var(--green-dim)', color: 'var(--green)',  border: 'rgba(0,229,160,0.2)' },
  FAILED:   { bg: 'var(--red-dim)',   color: 'var(--red)',    border: 'rgba(255,61,94,0.2)' },
  PENDING:  { bg: 'rgba(255,176,32,0.12)', color: 'var(--gold)', border: 'rgba(255,176,32,0.2)' },
}

export default function AuditLogPage() {
  const toast = useToast()
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(0)
  const [total,   setTotal]   = useState(0)
  const [exporting, setExporting] = useState(false)
  const PAGE_SIZE = 20

  const load = async (p = 0) => {
    setLoading(true)
    try {
      const r = await auditAPI.getLogs(p, PAGE_SIZE)
      const data = r.data
      if (Array.isArray(data)) { setLogs(data); setTotal(data.length) }
      else { setLogs(data.content || []); setTotal(data.totalElements || 0) }
    } catch { toast.error('Failed to load audit logs') }
    setLoading(false)
  }

  useEffect(() => { load(page) }, [page])

  const handleExport = async () => {
    setExporting(true)
    try {
      const r = await auditAPI.export()
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `deltaedge-audit-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Audit log exported')
    } catch { toast.error('Export failed') }
    setExporting(false)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={18} style={{ color: 'var(--gold)' }} /> Audit Log
          </div>
          <div className="section-subtitle">Non-repudiable compliance ledger — async event-driven architecture</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" onClick={() => load(page)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn-ghost" onClick={handleExport} disabled={exporting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Architecture notice */}
      <div className="glass-card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, borderColor: 'rgba(255,176,32,0.3)' }}>
        <Shield size={16} style={{ color: 'var(--gold)', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Async @Async Architecture: </span>
          The AuditService writes to this ledger on a separate background thread via Spring's @Async annotation,
          ensuring logging never blocks the main trading path. Every action records: Who · What · When · Status.
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'TOTAL EVENTS', value: total,
            color: 'var(--text-primary)' },
          { label: 'SUCCESS',
            value: logs.filter(l => l.status === 'SUCCESS').length,
            color: 'var(--green)' },
          { label: 'FAILED',
            value: logs.filter(l => l.status === 'FAILED').length,
            color: 'var(--red)' },
          { label: 'PENDING',
            value: logs.filter(l => l.status === 'PENDING').length,
            color: 'var(--gold)' },
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
            <tr>
              <th>TIMESTAMP</th>
              <th>USER</th>
              <th>ACTION</th>
              <th>ENTITY</th>
              <th>STATUS</th>
              <th>MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><Spinner /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6}><EmptyState title="No audit events" /></td></tr>
            ) : logs.map(log => {
              const s = STATUS_STYLES[log.status] || STATUS_STYLES.PENDING
              return (
                <tr key={log.id}>
                  <td style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {fmtDateTime(log.timestamp || log.createdAt)}
                  </td>
                  <td style={{ fontSize: 13 }}>{log.user?.email || log.userId || '—'}</td>
                  <td>
                    <span style={{ fontFamily: 'Chakra Petch', fontSize: 12, color: '#60A5FA', letterSpacing: 0.5 }}>
                      {log.action || log.eventType}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{log.entityType || '—'}</td>
                  <td>
                    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.message || '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          Showing {logs.length} of {total} events
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost" style={{ padding: '7px 12px' }} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            <ChevronLeft size={15} />
          </button>
          <span style={{ fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>
            Page {page + 1}
          </span>
          <button className="btn-ghost" style={{ padding: '7px 12px' }} onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
