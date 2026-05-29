import React, { useState, useEffect } from 'react'
import { User, Shield, CreditCard, Key, Eye, EyeOff, CheckCircle, Save } from 'lucide-react'
import Spinner from '../components/common/Spinner'
import { userAPI, paymentAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const [tab,     setTab]     = useState('profile')
  const [profile, setProfile] = useState({ fullName: '', email: '' })
  const [pw,      setPw]      = useState({ current: '', newPw: '', confirm: '' })
  const [payment, setPayment] = useState({ accountNumber: '', ifscCode: '', bankName: '' })
  const [showPw,  setShowPw]  = useState(false)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => {
    if (user) setProfile({ fullName: user.fullName || '', email: user.email || '' })
    paymentAPI.getDetails().then(r => {
      if (r.data) setPayment({ accountNumber: r.data.accountNumber || '', ifscCode: r.data.ifscCode || '', bankName: r.data.bankName || '' })
    }).catch(() => {})
  }, [user])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await userAPI.updateProfile(profile)
      await refreshUser()
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    setSaving(false)
  }

  const changePassword = async () => {
    if (pw.newPw !== pw.confirm) { toast.error('Passwords do not match'); return }
    if (pw.newPw.length < 8) { toast.error('Password must be 8+ characters'); return }
    setSaving(true)
    try {
      await userAPI.changePassword({ currentPassword: pw.current, newPassword: pw.newPw })
      toast.success('Password changed successfully!')
      setPw({ current: '', newPw: '', confirm: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed') }
    setSaving(false)
  }

  const enable2FA = async () => {
    setSaving(true)
    try {
      await userAPI.enable2FA()
      await refreshUser()
      toast.success('Two-Factor Authentication enabled!')
    } catch { toast.error('2FA setup failed') }
    setSaving(false)
  }

  const savePayment = async () => {
    setSaving(true)
    try {
      await paymentAPI.saveDetails(payment)
      toast.success('Payment details saved!')
    } catch { toast.error('Save failed') }
    setSaving(false)
  }

  const TABS = [
    { id: 'profile',  label: 'Profile',  icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payment',  label: 'Payment',  icon: CreditCard },
  ]

  return (
    <div className="animate-fade-in" style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 24 }}>
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={18} style={{ color: 'var(--accent)' }} /> Profile & Settings
        </div>
        <div className="section-subtitle">Manage your account preferences and security</div>
      </div>

      {/* Avatar card */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1B74FF30, #00E5A030)',
          border: '2px solid var(--border-bright)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Chakra Petch', fontSize: 26, fontWeight: 700, color: '#60A5FA',
        }}>
          {(user?.fullName || user?.email || 'U')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'Chakra Petch', fontSize: 20, fontWeight: 700 }}>{user?.fullName || 'Trader'}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <span className="badge badge-blue">{user?.role || 'USER'}</span>
            {user?.twoFactorEnabled && <span className="badge badge-green">2FA ON</span>}
            <span className="badge badge-dim">DeltaEdge Member</span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="tab-group" style={{ marginBottom: 20 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="glass-card" style={{ padding: 28 }}>
          <div className="section-title" style={{ fontSize: 15, marginBottom: 20 }}>Personal Information</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'fullName', label: 'FULL NAME', type: 'text', placeholder: 'John Doe' },
              { key: 'email',    label: 'EMAIL',     type: 'email', placeholder: 'trader@example.com' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                <input
                  className="input-field"
                  type={type}
                  placeholder={placeholder}
                  value={profile[key]}
                  onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-primary" onClick={saveProfile} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={14} />{saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 2FA */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'Chakra Petch', fontSize: 15, fontWeight: 600 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Add an extra layer of security to your account
                </div>
              </div>
              {user?.twoFactorEnabled
                ? <span className="badge badge-green"><CheckCircle size={11} /> ENABLED</span>
                : <span className="badge badge-dim">DISABLED</span>
              }
            </div>
            {!user?.twoFactorEnabled && (
              <button className="btn-primary" onClick={enable2FA} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} />{saving ? 'Setting up…' : 'Enable 2FA'}
              </button>
            )}
          </div>

          {/* Change Password */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="section-title" style={{ fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={15} /> Change Password
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'current', label: 'CURRENT PASSWORD', placeholder: '••••••••' },
                { key: 'newPw',   label: 'NEW PASSWORD',     placeholder: 'Min 8 characters' },
                { key: 'confirm', label: 'CONFIRM NEW PASSWORD', placeholder: '••••••••' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type={showPw ? 'text' : 'password'}
                      placeholder={placeholder}
                      value={pw[key]}
                      onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      style={{ paddingRight: 40 }}
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button className="btn-primary" onClick={changePassword} disabled={saving || !pw.current || !pw.newPw}>
                  {saving ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {tab === 'payment' && (
        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <CreditCard size={16} style={{ color: 'var(--accent)' }} />
            <div className="section-title" style={{ fontSize: 15 }}>Bank Account Details</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'bankName',      label: 'BANK NAME',       placeholder: 'e.g. HDFC Bank' },
              { key: 'accountNumber', label: 'ACCOUNT NUMBER',  placeholder: 'Account number' },
              { key: 'ifscCode',      label: 'IFSC CODE',       placeholder: 'e.g. HDFC0001234' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'Chakra Petch', letterSpacing: 1, marginBottom: 6 }}>{label}</label>
                <input className="input-field" placeholder={placeholder} value={payment[key]} onChange={e => setPayment(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ padding: '12px 14px', background: 'rgba(27,116,255,0.08)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid rgba(27,116,255,0.15)' }}>
              Payment details are used for withdrawal processing via Razorpay. Your data is stored encrypted.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-primary" onClick={savePayment} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={14} />{saving ? 'Saving…' : 'Save Payment Details'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
