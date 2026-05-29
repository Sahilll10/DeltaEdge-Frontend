import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function RegisterPage() {
  const [form, setForm]       = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const { register }          = useAuth()
  const toast                 = useToast()
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    }
    setLoading(false)
  }

  const change = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.25 }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #1B74FF, #00E5A0)', marginBottom: 16, boxShadow: '0 0 32px rgba(27,116,255,0.3)' }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>
            DELTA<span style={{ color: 'var(--green)' }}>EDGE</span>
          </div>
        </div>

        <div className="glass-card animate-fade-in" style={{ padding: 32 }}>
          <h1 style={{ fontFamily: 'Chakra Petch', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Join the DeltaEdge trading platform</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'fullName', label: 'FULL NAME', type: 'text', placeholder: 'John Doe' },
              { key: 'email',    label: 'EMAIL',     type: 'email', placeholder: 'trader@example.com' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                <input className="input-field" type={type} placeholder={placeholder} value={form[key]} onChange={change(key)} required />
              </div>
            ))}
            {['password', 'confirmPassword'].map((key) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>
                  {key === 'password' ? 'PASSWORD' : 'CONFIRM PASSWORD'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form[key]}
                    onChange={change(key)}
                    required
                    minLength={8}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 8, padding: '13px 20px' }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
