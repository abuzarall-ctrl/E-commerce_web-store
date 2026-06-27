'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleSend() }

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
          {sent ? (
            <motion.div
              key="sent"
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
                Check your inbox
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: 1.7, marginBottom: '8px' }}>
                We sent a password reset link to
              </p>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', marginBottom: '28px' }}>
                {email}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '28px', lineHeight: 1.6 }}>
                Click the link in the email to set a new password. Check your spam folder if it doesn't arrive within a minute.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/auth/login')}
                style={{
                  width: '100%', padding: '13px',
                  background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer'
                }}>
                Back to Sign In
              </motion.button>
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

              {/* Back link */}
              <motion.button
                whileHover={{ x: -3 }}
                onClick={() => router.push('/auth/login')}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-faint)',
                  fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '6px', padding: 0, marginBottom: '28px', fontFamily: 'inherit'
                }}>
                <FiArrowLeft size={14} /> Back to sign in
              </motion.button>

              <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Forgot password?
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '32px', lineHeight: 1.6 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Email Address
                  </label>
                  <div style={{
                    position: 'relative',
                    border: `1px solid rgba(212,163,115,0.2)`,
                    borderRadius: '10px',
                    background: 'rgba(28,28,26,0.6)',
                    backdropFilter: 'blur(6px)'
                  }}>
                    <FiMail size={15} style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-faint)', pointerEvents: 'none'
                    }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={onKeyDown}
                      style={{
                        width: '100%', padding: '12px 16px 12px 42px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-primary)', fontSize: '14px',
                        outline: 'none', fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      style={{
                        background: 'rgba(226,75,74,0.12)',
                        border: '1px solid rgba(226,75,74,0.3)',
                        borderRadius: '8px', padding: '10px 14px',
                        fontSize: '13px', color: '#E24B4A'
                      }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: loading ? 'rgba(42,42,40,0.7)' : 'var(--gradient-accent)',
                    color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
                    border: 'none', borderRadius: '10px',
                    fontSize: '15px', fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 4px 24px rgba(212,163,115,0.35)',
                    transition: 'all 0.3s'
                  }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
