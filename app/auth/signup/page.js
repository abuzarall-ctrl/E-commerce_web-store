'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiCheckCircle } from 'react-icons/fi'

// ── Fashion Panel ─────────────────────────────────────────────────────────────
const ORBS = [
  { id: 1, w: 260, h: 260, style: { top: '-6%', right: '-4%' }, dur: 8, delay: 0.3 },
  { id: 2, w: 180, h: 180, style: { bottom: '8%', left: '-3%' }, dur: 7, delay: 1 },
  { id: 3, w: 120, h: 120, style: { top: '42%', right: '55%' }, dur: 6, delay: 0.5 },
  { id: 4, w: 80,  h: 80,  style: { top: '18%', left: '20%' }, dur: 9, delay: 2 },
  { id: 5, w: 55,  h: 55,  style: { bottom: '28%', right: '14%' }, dur: 5, delay: 0.8 },
]

const GARMENTS = [
  {
    id: 1,
    path: 'M28 14 L8 32 L22 38 L22 82 L78 82 L78 38 L92 32 L72 14 Q60 22 50 22 Q40 22 28 14 Z',
    style: { top: '8%', right: '10%', width: 85, height: 85, rotate: 9, delay: 0.2 }
  },
  {
    id: 2,
    path: 'M26 10 L4 32 L20 40 L20 96 L80 96 L80 40 L96 32 L74 10 Q62 20 50 20 Q38 20 26 10 Z',
    style: { bottom: '16%', left: '5%', width: 70, height: 88, rotate: -7, delay: 1.2 }
  },
  {
    id: 3,
    path: 'M14 2 L86 2 L86 12 L68 12 L68 58 Q70 80 86 98 L56 98 L50 64 L44 98 L14 98 Q30 80 32 58 L32 12 Z',
    style: { top: '55%', left: '62%', width: 60, height: 75, rotate: 4, delay: 0.7 }
  },
]

const PERKS = [
  'Shop 100+ Premium Products',
  'Exclusive Member Discounts',
  'Order History & Tracking',
  'Fast Checkout Every Time',
]

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } }
}
const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
}

function FashionPanel() {
  return (
    <div className="auth-fashion-panel" style={{
      position: 'relative', overflow: 'hidden', background: '#111110',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      padding: '60px 48px', minHeight: '100vh', flex: '0 0 48%', maxWidth: '48%'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'brightness(0.12) saturate(0.5)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(17,17,16,0.96) 0%, rgba(38,34,26,0.84) 50%, rgba(17,17,16,0.96) 100%)',
        zIndex: 1
      }} />

      {ORBS.map(orb => (
        <motion.div
          key={orb.id}
          animate={{ y: [0, -20, 0], x: [0, 7, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
          style={{
            position: 'absolute', width: orb.w, height: orb.h, ...orb.style,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,163,115,0.13) 0%, rgba(212,163,115,0.03) 60%, transparent 80%)',
            zIndex: 2, pointerEvents: 'none'
          }}
        />
      ))}

      {GARMENTS.map(g => (
        <motion.div
          key={g.id}
          animate={{ y: [0, -13, 0], rotate: [g.style.rotate, g.style.rotate + 3, g.style.rotate] }}
          transition={{ duration: 9 + g.style.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: g.style.delay }}
          style={{
            position: 'absolute', width: g.style.width, height: g.style.height,
            top: g.style.top, bottom: g.style.bottom, left: g.style.left, right: g.style.right,
            zIndex: 3, opacity: 0.09, pointerEvents: 'none'
          }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <path d={g.path} fill="#D4A373" />
          </svg>
        </motion.div>
      ))}


      <motion.div
        variants={staggerContainer} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 5, textAlign: 'center', maxWidth: '360px', width: '100%' }}>

        <motion.div variants={fadeSlideUp} style={{ marginBottom: '28px' }}>
          <span style={{ fontSize: '34px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '-1.5px' }}>Abuzar</span>
          <span style={{ fontSize: '34px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>Store</span>
        </motion.div>

        <motion.div variants={fadeSlideUp}
          style={{ width: '48px', height: '2px', background: 'var(--gradient-accent)', margin: '0 auto 28px', borderRadius: '2px' }} />

        <motion.h2 variants={fadeSlideUp} style={{
          fontSize: 'clamp(36px, 3.2vw, 50px)', fontWeight: '900',
          color: 'var(--text-primary)', lineHeight: 1.08,
          letterSpacing: '-2px', marginBottom: '36px'
        }}>
          Join the<br />
          <span style={{
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
          }}>Fashion.</span>
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {PERKS.map((perk, i) => (
            <motion.div
              key={perk}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.55 + i * 0.12, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: 'var(--accent)', fontSize: '11px', fontWeight: '700'
              }}>✓</div>
              <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: '500' }}>{perk}</span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.7 }}
          style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '44px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
          Serving Pakistan with Pride
        </motion.p>
      </motion.div>
    </div>
  )
}

// ── Shared AuthInput ──────────────────────────────────────────────────────────
function AuthInput({ icon: Icon, type, placeholder, value, onChange, onKeyDown, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'relative',
      border: `1px solid ${focused ? 'var(--accent)' : 'rgba(212,163,115,0.2)'}`,
      borderRadius: '10px',
      background: focused ? 'rgba(212,163,115,0.04)' : 'rgba(28,28,26,0.6)',
      transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
      boxShadow: focused ? '0 0 0 3px rgba(212,163,115,0.1)' : 'none',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)'
    }}>
      {Icon && (
        <Icon size={15} style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: focused ? 'var(--accent)' : 'var(--text-faint)',
          pointerEvents: 'none', transition: 'color 0.2s', zIndex: 1
        }} />
      )}
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={onChange} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: `12px 16px 12px ${Icon ? '42px' : '16px'}`,
          paddingRight: suffix ? '56px' : '16px',
          background: 'transparent', border: 'none',
          color: 'var(--text-primary)', fontSize: '14px',
          outline: 'none', fontFamily: 'inherit'
        }}
      />
      {suffix}
    </div>
  )
}

// ── Signup Page ───────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    })
    setGoogleLoading(false)
  }

  const handleSignup = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      await supabase.from('users').insert([{ id: data.user.id, email: data.user.email, role: 'customer' }])
      setDone(true)
    }
    setLoading(false)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleSignup() }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['transparent', '#E24B4A', 'var(--accent)', 'var(--badge-green)'][strength]
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]

  return (
    <>
      <style>{`
        html, body { background: #111110 !important; margin: 0; padding: 0; height: 100%; overflow: hidden; }
        .auth-fashion-panel { display: flex !important; }
        @media (max-width: 800px) {
          .auth-fashion-panel { display: none !important; }
          .auth-form-panel { min-height: 100vh; overflow-y: auto !important; }
          .auth-mobile-brand { display: block !important; }
          html, body { overflow: auto !important; }
        }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', background: '#111110', overflow: 'hidden' }}>
        <FashionPanel />

        <div className="auth-form-panel" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 32px',
          background: 'radial-gradient(ellipse at 65% 18%, rgba(212,163,115,0.22) 0%, transparent 45%), radial-gradient(ellipse at 30% 82%, rgba(196,147,106,0.16) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(212,163,115,0.07) 0%, transparent 70%), #111110',
          overflowY: 'auto', overflowX: 'hidden', position: 'relative'
        }}>

          {/* Ambient glow blobs */}
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', top: '-15%', right: '-8%', background: 'radial-gradient(circle, rgba(212,163,115,0.18) 0%, rgba(212,163,115,0.06) 45%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', bottom: '5%', left: '2%', background: 'radial-gradient(circle, rgba(196,147,106,0.14) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', top: '45%', right: '5%', background: 'radial-gradient(circle, rgba(212,163,115,0.10) 0%, transparent 70%)', filter: 'blur(35px)', pointerEvents: 'none', zIndex: 0 }} />
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: 'center', maxWidth: '420px', width: '100%',
                  position: 'relative', zIndex: 1,
                  background: 'rgba(20, 18, 14, 0.28)',
                  backdropFilter: 'blur(36px) saturate(1.6) brightness(0.95)',
                  WebkitBackdropFilter: 'blur(36px) saturate(1.6) brightness(0.95)',
                  border: '1px solid rgba(212,163,115,0.18)',
                  borderRadius: '24px',
                  padding: '44px 40px',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,163,115,0.10), inset 0 -1px 0 rgba(0,0,0,0.2)'
                }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(212,163,115,0.1)', border: '1px solid rgba(212,163,115,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                  }}>
                  <FiCheckCircle size={38} color="var(--accent)" />
                </motion.div>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Account Created!
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: '1.7', marginBottom: '28px' }}>
                  Check your email to confirm your account, then sign in to start shopping.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/auth/login')}
                  style={{
                    width: '100%', padding: '14px',
                    background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                    border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 20px rgba(212,163,115,0.3)'
                  }}>
                  <FiArrowRight size={15} /> Go to Sign In
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  width: '100%', maxWidth: '420px',
                  position: 'relative', zIndex: 1,
                  background: 'rgba(20, 18, 14, 0.28)',
                  backdropFilter: 'blur(36px) saturate(1.6) brightness(0.95)',
                  WebkitBackdropFilter: 'blur(36px) saturate(1.6) brightness(0.95)',
                  border: '1px solid rgba(212,163,115,0.18)',
                  borderRadius: '24px',
                  padding: '44px 40px',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,163,115,0.10), inset 0 -1px 0 rgba(0,0,0,0.2)'
                }}>

                <motion.div
                  className="auth-mobile-brand"
                  initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'none', textAlign: 'center', marginBottom: '36px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '-1px' }}>
                    Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
                  </span>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                    Create account
                  </h1>
                  <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '32px' }}>
                    Join AbuzarStore and start shopping today
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Email Address
                    </label>
                    <AuthInput
                      icon={FiMail} type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} onKeyDown={onKeyDown}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      Password
                    </label>
                    <AuthInput
                      icon={FiLock}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={onKeyDown}
                      suffix={
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          style={{
                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'var(--text-faint)',
                            cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                          }}>
                          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      }
                    />
                    {password.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                          {[1, 2, 3].map(n => (
                            <div key={n} style={{
                              flex: 1, height: '3px', borderRadius: '2px',
                              background: strength >= n ? strengthColor : 'rgba(28,28,26,0.8)',
                              transition: 'background 0.3s'
                            }} />
                          ))}
                        </div>
                        <span style={{ fontSize: '11px', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</span>
                      </motion.div>
                    )}
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        style={{
                          background: 'rgba(226,75,74,0.12)', border: '1px solid rgba(226,75,74,0.3)',
                          borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#E24B4A'
                        }}>
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSignup} disabled={loading}
                    style={{
                      width: '100%', padding: '14px',
                      background: loading ? 'rgba(42,42,40,0.7)' : 'var(--gradient-accent)',
                      color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
                      border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700',
                      cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px',
                      boxShadow: loading ? 'none' : '0 4px 24px rgba(212,163,115,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'background 0.3s, box-shadow 0.3s, color 0.3s'
                    }}>
                    {loading ? 'Creating account...' : <><FiArrowRight size={15} /> Create Account</>}
                  </motion.button>
                </motion.div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(212,163,115,0.18)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', letterSpacing: '1px', textTransform: 'uppercase' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(212,163,115,0.18)' }} />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin} disabled={googleLoading}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(212,163,115,0.2)',
                    borderRadius: '10px', color: 'var(--text-primary)',
                    fontSize: '14px', fontWeight: '600',
                    cursor: googleLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    marginBottom: '24px', transition: 'background 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(212,163,115,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(212,163,115,0.2)' }}>
                  <svg width="17" height="17" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)' }}>
                  Already have an account?{' '}
                  <motion.span
                    whileHover={{ color: 'var(--accent)' }}
                    onClick={() => router.push('/auth/login')}
                    style={{ color: 'rgba(212,163,115,0.85)', fontWeight: '700', cursor: 'pointer' }}>
                    Sign in
                  </motion.span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
