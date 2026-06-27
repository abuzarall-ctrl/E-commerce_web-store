'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)  // session exchanged and ready

  useEffect(() => {
    const init = async () => {
      // Exchange the reset code for a session
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { setReady(true); return }
      }

      // Fallback: check if already in a recovery session (implicit flow)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setReady(true); return }

      // Listen for PASSWORD_RECOVERY event (Supabase sends this after redirect)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          subscription.unsubscribe()
          setReady(true)
        }
      })
    }
    init()
  }, [])

  const handleReset = async () => {
    if (!password) { setError('Please enter a new password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleReset() }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['transparent', '#E24B4A', 'var(--accent)', 'var(--badge-green)'][strength]
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]

  return (
    <>
      <style>{`
        html, body { background: #111110 !important; margin: 0; padding: 0; height: 100%; overflow: hidden; }
      `}</style>

      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 30%, rgba(212,163,115,0.18) 0%, transparent 55%), #111110',
        padding: '24px'
      }}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                width: '100%', maxWidth: '420px', textAlign: 'center',
                background: 'rgba(20, 18, 14, 0.28)',
                backdropFilter: 'blur(36px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
                border: '1px solid rgba(212,163,115,0.18)',
                borderRadius: '24px', padding: '48px 40px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,163,115,0.10)'
              }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
                style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: 'rgba(212,163,115,0.1)', border: '1px solid rgba(212,163,115,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                }}>
                <FiCheckCircle size={34} color="var(--accent)" />
              </motion.div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Password updated!
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: 1.7 }}>
                Your password has been changed. Redirecting you to sign in...
              </p>
            </motion.div>
          ) : !ready ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                border: '3px solid rgba(212,163,115,0.15)',
                borderTop: '3px solid #D4A373',
                animation: 'spin 0.75s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p style={{ color: '#FEFAE0', fontSize: '15px' }}>Verifying reset link...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{
                width: '100%', maxWidth: '420px',
                background: 'rgba(20, 18, 14, 0.28)',
                backdropFilter: 'blur(36px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(36px) saturate(1.6)',
                border: '1px solid rgba(212,163,115,0.18)',
                borderRadius: '24px', padding: '44px 40px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,163,115,0.10)'
              }}>

              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Set new password
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '32px' }}>
                Choose a strong password for your account.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* New password */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative', border: '1px solid rgba(212,163,115,0.2)', borderRadius: '10px', background: 'rgba(28,28,26,0.6)', backdropFilter: 'blur(6px)' }}>
                    <FiLock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={onKeyDown}
                      style={{ width: '100%', padding: '12px 48px 12px 42px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        {[1, 2, 3].map(n => (
                          <div key={n} style={{ flex: 1, height: '3px', borderRadius: '2px', background: strength >= n ? strengthColor : 'rgba(28,28,26,0.8)', transition: 'background 0.3s' }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</span>
                    </motion.div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', border: `1px solid ${confirm && confirm !== password ? 'rgba(226,75,74,0.5)' : 'rgba(212,163,115,0.2)'}`, borderRadius: '10px', background: 'rgba(28,28,26,0.6)', backdropFilter: 'blur(6px)' }}>
                    <FiLock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      onKeyDown={onKeyDown}
                      style={{ width: '100%', padding: '12px 48px 12px 42px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                  {confirm && confirm === password && (
                    <p style={{ fontSize: '11px', color: 'var(--badge-green)', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiCheckCircle size={11} /> Passwords match
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      style={{ background: 'rgba(226,75,74,0.12)', border: '1px solid rgba(226,75,74,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#E24B4A' }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={handleReset} disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: loading ? 'rgba(42,42,40,0.7)' : 'var(--gradient-accent)',
                    color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
                    border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(212,163,115,0.35)',
                    transition: 'all 0.3s'
                  }}>
                  {loading ? 'Updating...' : 'Update Password'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
