import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Zap size={48} style={{ color: 'var(--green)' }} />
      <div style={{ fontFamily: 'Chakra Petch', fontSize: 80, fontWeight: 700, color: 'var(--border-bright)', lineHeight: 1 }}>404</div>
      <div style={{ fontFamily: 'Chakra Petch', fontSize: 18, color: 'var(--text-secondary)' }}>Page not found in the matrix</div>
      <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  )
}
