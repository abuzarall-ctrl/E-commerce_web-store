'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiSettings } from 'react-icons/fi'

// Change this to your admin email address
const ADMIN_EMAIL = 'admin@abuzarstore.com'

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(28, 28, 26, 0.6)',
  border: '1px solid rgba(212, 163, 115, 0.25)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)'
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')

    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })

    if (authErr) {
      setError('Invalid credentials')
      setLoading(false)
      return
    }

    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setError('Access denied. This login is for admins only.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '40px 36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
        }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--bg-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <FiSettings size={24} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>Admin Access</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>AbuzarStore control panel</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@abuzarstore.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'rgba(212, 163, 115, 0.25)'}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'rgba(212, 163, 115, 0.25)'}
                style={{ ...inputStyle, paddingRight: '52px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-faint)',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '600', padding: 0
                }}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(226,75,74,0.15)',
              border: '1px solid rgba(226,75,74,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#E24B4A'
            }}>
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'var(--bg-surface2)' : 'var(--gradient-accent)',
              color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(212, 163, 115, 0.3)'
            }}>
            {loading ? 'Signing in...' : 'Sign In as Admin'}
          </motion.button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)', marginTop: '24px' }}>
          This page is for store admins only.{' '}
          <span
            onClick={() => router.push('/auth/login')}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: '600' }}>
            Customer login →
          </span>
        </p>
      </motion.div>
    </div>
  )
}
