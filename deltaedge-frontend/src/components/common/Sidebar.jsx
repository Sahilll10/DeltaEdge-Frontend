import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, TrendingUp, BarChart2, Briefcase,
  Wallet, Star, GitFork, FileText, ArrowDownToLine,
  User, LogOut, Zap, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/market',     icon: TrendingUp,      label: 'Market' },
  { to: '/trading',    icon: BarChart2,        label: 'Trading' },
  { to: '/portfolio',  icon: Briefcase,        label: 'Portfolio' },
  { to: '/watchlist',  icon: Star,             label: 'Watchlist' },
  { to: '/wallet',     icon: Wallet,           label: 'Wallet' },
  { to: '/withdrawal', icon: ArrowDownToLine,  label: 'Withdrawal' },
  { to: '/graph-risk', icon: GitFork,          label: 'Risk Contagion' },
  { to: '/audit',      icon: FileText,         label: 'Audit Log' },
  { to: '/profile',    icon: User,             label: 'Profile' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.info('Logged out successfully')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ zIndex: 60 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #1B74FF, #00E5A0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="white" fill="white" />
            </div>
            <div>
              <div style={{ fontFamily: 'Chakra Petch', fontSize: 17, fontWeight: 700, letterSpacing: 2 }}>
                DELTA<span style={{ color: 'var(--green)' }}>EDGE</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1.5, fontFamily: 'Space Mono' }}>
                TRADING ENGINE v1.0
              </div>
            </div>
          </div>
        </div>

        {/* User badge */}
        {user && (
          <div style={{ margin: '14px 12px', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1B74FF40, #00E5A040)',
                border: '1px solid var(--border-bright)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Chakra Petch', fontSize: 13, fontWeight: 700, color: '#60A5FA'
              }}>
                {(user.fullName || user.email || 'U')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || 'Trader'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>
                  {user.role || 'USER'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 2, fontFamily: 'Chakra Petch', padding: '6px 4px', marginBottom: 4 }}>
            NAVIGATION
          </div>
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              style={{ marginBottom: 2 }}
            >
              <Icon size={16} />
              <span>{label}</span>
              {to === '/graph-risk' && (
                <span className="badge badge-purple" style={{ marginLeft: 'auto', fontSize: 9 }}>NEW</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ width: '100%', color: 'var(--red)' }}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>
            DELTAEDGE © 2026
          </div>
        </div>
      </aside>
    </>
  )
}
