import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header  from './Header'
import { connectWebSocket } from '../../services/websocket'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    connectWebSocket()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
