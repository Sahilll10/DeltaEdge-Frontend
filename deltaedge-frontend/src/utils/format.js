// ── Currency formatting
export const formatUSD = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n || 0)

export const formatCompact = (n) => {
  if (!n) return '$0'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3)  return `$${(n / 1e3).toFixed(2)}K`
  return `$${n.toFixed(2)}`
}

export const formatNumber = (n, decimals = 2) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n || 0)

// ── Percentage
export const formatPct = (n) => {
  const val = (n || 0).toFixed(2)
  return n >= 0 ? `+${val}%` : `${val}%`
}

// ── Price colour helper
export const priceClass = (n) => (n >= 0 ? 'price-up' : 'price-down')

// ── Date / time
export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

// ── Idempotency key
export const newIdempotencyKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

// ── Truncate address / hash
export const truncate = (str, n = 8) =>
  str ? `${str.slice(0, n)}…${str.slice(-4)}` : '—'

// ── Risk colour mapping
export const riskColor = (score) => {
  if (score >= 80) return '#FF3D5E'
  if (score >= 60) return '#FFB020'
  if (score >= 40) return '#60A5FA'
  return '#00E5A0'
}

export const riskLabel = (score) => {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

// ── Order type badge
export const orderTypeStyle = (type) => {
  switch (type?.toUpperCase()) {
    case 'BUY':    return 'badge-green'
    case 'SELL':   return 'badge-red'
    case 'TRANSFER': return 'badge-blue'
    default:       return 'badge-dim'
  }
}

// ── Wallet tx type colour
export const txTypeColor = (type) => {
  switch (type?.toUpperCase()) {
    case 'DEPOSIT':  return 'var(--green)'
    case 'WITHDRAWAL': return 'var(--red)'
    case 'BUY_ASSET':  return '#60A5FA'
    case 'SELL_ASSET': return 'var(--gold)'
    case 'TRANSFER_IN':  return 'var(--green)'
    case 'TRANSFER_OUT': return 'var(--red)'
    default: return 'var(--text-secondary)'
  }
}

// ── Debounce
export const debounce = (fn, ms) => {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

// ── Clamp
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
