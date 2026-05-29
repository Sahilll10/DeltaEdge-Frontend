import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authAPI } from '../services/api'

export default function LoginPage() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep]       = useState('login') // 'login' | 'otp'
  const [otp, setOtp]         = useState('')
  const { login }             = useAuth()
  const toast                 = useToast()
  const navigate              = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back to DeltaEdge!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('two-factor')) {
        setStep('otp')
        toast.info('Enter your 2FA OTP to continue')
      } else {
        toast.error(err.response?.data?.message || 'Invalid credentials')
      }
    }
    setLoading(false)
  }

  const handleOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.verifyOtp(form.email, otp)
      await login(form.email, form.password)
      toast.success('2FA verified — welcome!')
      navigate('/dashboard')
    } catch {
      toast.error('Invalid OTP code')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* BG grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 }} />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,116,255,0.06) 0%, transparent 70%)' }} />
      <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,229,160,0.05) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #1B74FF, #00E5A0)', marginBottom: 16, boxShadow: '0 0 32px rgba(27,116,255,0.3)' }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>
            DELTA<span style={{ color: 'var(--green)' }}>EDGE</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Algorithmic Trading Engine
          </div>
        </div>

        {/* Card */}
        <div className="glass-card animate-fade-in" style={{ padding: 32 }}>
          {step === 'login' ? (
            <>
              <h1 style={{ fontFamily: 'Chakra Petch', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign In</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Access your trading dashboard</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>EMAIL</label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="trader@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      required
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, padding: '13px 20px', fontSize: 14 }}>
                  {loading ? 'Authenticating…' : 'Sign In to DeltaEdge'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
                No account?{' '}
                <Link to="/register" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Shield size={32} style={{ color: 'var(--gold)', marginBottom: 12 }} />
                <h2 style={{ fontFamily: 'Chakra Petch', fontSize: 20 }}>Two-Factor Auth</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Enter the OTP sent to your email</p>
              </div>
              <form onSubmit={handleOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input
                  className="input-field"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: 22, letterSpacing: 8, fontFamily: 'Space Mono' }}
                  required
                />
                <button className="btn-primary" type="submit" disabled={loading} style={{ padding: '13px 20px' }}>
                  {loading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setStep('login')}>← Back</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
