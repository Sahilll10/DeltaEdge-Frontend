import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let _toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    info:    (msg) => addToast(msg, 'info'),
  }

  const icons = {
    success: <CheckCircle size={16} style={{ color: 'var(--green)' }} />,
    error:   <AlertCircle size={16} style={{ color: 'var(--red)' }} />,
    info:    <Info        size={16} style={{ color: '#60A5FA' }} />,
  }
  const borders = {
    success: 'rgba(0,229,160,0.3)',
    error:   'rgba(255,61,94,0.3)',
    info:    'rgba(27,116,255,0.3)',
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast">
        {toasts.map(t => (
          <div
            key={t.id}
            className="toast-item"
            style={{ borderColor: borders[t.type] }}
          >
            {icons[t.type]}
            <span style={{ flex: 1, fontSize: 14 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
