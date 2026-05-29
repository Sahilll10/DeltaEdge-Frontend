import React from 'react'

export default function Spinner({ size = 36, color = 'var(--green)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{
        width: size, height: size,
        border: `2px solid var(--border)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
