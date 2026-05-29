import React from 'react'

export default function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)', trend, delay = 0 }) {
  return (
    <div className="stat-card animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1 }}>
          {label}
        </div>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color }} />
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {typeof trend === 'number' ? (
            <span style={{ color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(2)}%
            </span>
          ) : null}
          {' '}{sub}
        </div>
      )}
    </div>
  )
}
