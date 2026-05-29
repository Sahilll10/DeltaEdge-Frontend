import React from 'react'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title = 'Nothing here', subtitle = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <Icon size={40} style={{ color: 'var(--text-dim)', marginBottom: 12 }} />
      <div style={{ fontFamily: 'Chakra Petch', fontSize: 15, color: 'var(--text-secondary)', marginBottom: 4 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{subtitle}</div>}
    </div>
  )
}
