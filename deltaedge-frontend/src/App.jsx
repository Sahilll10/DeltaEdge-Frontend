import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

// Layout
import Layout from './components/common/Layout'

// Pages
import LoginPage       from './pages/LoginPage'
import RegisterPage    from './pages/RegisterPage'
import DashboardPage   from './pages/DashboardPage'
import MarketPage      from './pages/MarketPage'
import CoinDetailPage  from './pages/CoinDetailPage'
import TradingPage     from './pages/TradingPage'
import PortfolioPage   from './pages/PortfolioPage'
import WalletPage      from './pages/WalletPage'
import WatchlistPage   from './pages/WatchlistPage'
import GraphRiskPage   from './pages/GraphRiskPage'
import AuditLogPage    from './pages/AuditLogPage'
import WithdrawalPage  from './pages/WithdrawalPage'
import ProfilePage     from './pages/ProfilePage'
import NotFoundPage    from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Chakra Petch', fontSize: 24, color: 'var(--green)', letterSpacing: 3, marginBottom: 16 }}>
          DELTA<span style={{ color: 'var(--text-primary)' }}>EDGE</span>
        </div>
        <div style={{ width: 40, height: 40, border: '2px solid var(--border)', borderTop: '2px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="market"      element={<MarketPage />} />
              <Route path="market/:id"  element={<CoinDetailPage />} />
              <Route path="trading"     element={<TradingPage />} />
              <Route path="portfolio"   element={<PortfolioPage />} />
              <Route path="wallet"      element={<WalletPage />} />
              <Route path="watchlist"   element={<WatchlistPage />} />
              <Route path="graph-risk"  element={<GraphRiskPage />} />
              <Route path="audit"       element={<AuditLogPage />} />
              <Route path="withdrawal"  element={<WithdrawalPage />} />
              <Route path="profile"     element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
