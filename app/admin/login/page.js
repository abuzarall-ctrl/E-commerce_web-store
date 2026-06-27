'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiEye, FiEyeOff, FiArrowRight, FiMail, FiLock, FiShield } from 'react-icons/fi'

const ORBS = [
  { id: 1, w: 280, h: 280, style: { top: '-8%', left: '-6%' }, dur: 7, delay: 0 },
  { id: 2, w: 200, h: 200, style: { bottom: '5%', right: '-4%' }, dur: 9, delay: 1.5 },
  { id: 3, w: 140, h: 140, style: { top: '38%', left: '58%' }, dur: 6, delay: 0.8 },
  { id: 4, w: 90,  h: 90,  style: { bottom: '22%', left: '12%' }, dur: 8, delay: 2 },
  { id: 5, w: 70,  h: 70,  style: { top: '12%', right: '18%' }, dur: 5, delay: 0.4 },
  { id: 6, w: 50,  h: 50,  style: { top: '60%', left: '35%' }, dur: 7, delay: 1.2 },
]

const GARMENTS = [
  {
    id: 1,
    path: 'M28 14 L8 32 L22 38 L22 82 L78 82 L78 38 L92 32 L72 14 Q60 22 50 22 Q40 22 28 14 Z',
    style: { top: '12%', left: '8%', width: 90, height: 90, rotate: -10, delay: 0 }
  },
  {
    id: 2,
    path: 'M26 10 L4 32 L20 40 L20 96 L80 96 L80 40 L96 32 L74 10 Q62 20 50 20 Q38 20 26 10 Z',
    style: { bottom: '14%', right: '6%', width: 75, height: 95, rotate: 8, delay: 1 }
  },
  {
    id: 3,
    path: 'M14 2 L86 2 L86 12 L68 12 L68 58 Q70 80 86 98 L56 98 L50 64 L44 98 L14 98 Q30 80 32 58 L32 12 Z',
    style: { top: '52%', right: '22%', width: 65, height: 80, rotate: -5, delay: 1.8 }
  },
  {
    id: 4,
    path: 'M50 8 C42 8 38 14 40 20 L14 38 L86 38 L60 20 C62 14 58 8 50 8 Z M22 38 L22 92 L78 92 L78 38',
    style: { bottom: '32%', left: '4%', width: 55, height: 55, rotate: 6, delay: 0.5 }
  },
]

const ADMIN_FEATURES = [
  'Manage Products & Inventory',
  'Process Orders in Real-Time',
  'Toggle Stock Status Instantly',
  'Full Store Control Panel',
]

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } }
}
const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
}

function AdminPanel() {
  return (
    <div className="auth-fashion-panel" style={{
      position: 'relative',
      overflow: 'hidden',
      background: '#111110',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 48px',
      minHeight: '100vh',
      flex: '0 0 48%',
      maxWidth: '48%'
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        filter: 'brightness(0.12) saturate(0.6)',
        zIndex: 0
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(160deg, rgba(17,17,16,0.96) 0%, rgba(42,38,30,0.82) 50%, rgba(17,17,16,0.96) 100%)',
        zIndex: 1
      }} />

      {/* Floating orbs */}
      {ORBS.map(orb => (
        <motion.div
          key={orb.id}
          animate={{ y: [0, -22, 0], x: [0, 8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: orb.dur, repeat: Infinity, ease: 'easeInOut', delay: orb.delay }}
          style={{
            position: 'absolute',
            width: orb.w, height: orb.h,
            ...orb.style,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,163,115,0.13) 0%, rgba(212,163,115,0.03) 60%, transparent 80%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      ))}

      {/* Floating garment silhouettes */}
      {GARMENTS.map(g => (
        <motion.div
          key={g.id}
          animate={{
            y: [0, -14, 0],
            rotate: [g.style.rotate, g.style.rotate + 4, g.style.rotate],
          }}
          transition={{ duration: 9 + g.style.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: g.style.delay }}
          style={{
            position: 'absolute',
            width: g.style.width, height: g.style.height,
            top: g.style.top, bottom: g.style.bottom,
            left: g.style.left, right: g.style.right,
            zIndex: 3, opacity: 0.09, pointerEvents: 'none'
          }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <path d={g.path} fill="#D4A373" />
          </svg>
        </motion.div>
      ))}

      {/* Main content */}
      <motion.div
        variants={staggerContainer} initial="hidden" animate="show"
        style={{ position: 'relative', zIndex: 5, textAlign: 'center', maxWidth: '360px', width: '100%' }}>

        <motion.div variants={fadeSlideUp} style={{ marginBottom: '28px' }}>
          <span style={{ fontSize: '34px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '-1.5px' }}>Abuzar</span>
          <span style={{ fontSize: '34px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1.5px' }}>Store</span>
        </motion.div>

        <motion.div
          variants={fadeSlideUp}
          style={{ width: '48px', height: '2px', background: 'var(--gradient-accent)', margin: '0 auto 28px', borderRadius: '2px' }}
        />

        <motion.h2
          variants={fadeSlideUp}
          style={{
            fontSize: 'clamp(38px, 3.5vw, 52px)',
            fontWeight: '900',
            color: 'var(--text-primary)',
            lineHeight: 1.08,
            letterSpacing: '-2px',
            marginBottom: '36px'
          }}>
          Control.<br />
          <span style={{
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Command.</span>
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {ADMIN_FEATURES.map((feat, i) => (
            <motion.div
              key={feat}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: 'easeOut' }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <motion.div
                whileHover={{ scale: 1.15 }}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'rgba(212,163,115,0.12)',
                  border: '1px solid rgba(212,163,115,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: 'var(--accent)', fontSize: '11px', fontWeight: '700'
                }}>✓</motion.div>
              <span style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: '500', lineHeight: 1.4 }}>
                {feat}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.7 }}
          style={{
            fontSize: '11px', color: 'var(--text-faint)',
            marginTop: '44px', letterSpacing: '2.5px', textTransform: 'uppercase'
          }}>
          Admin Access Only
        </motion.p>
      </motion.div>
    </div>
  )
}

function AuthInput({ icon: Icon, type, placeholder, value, onChange, onKeyDown, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      position: 'relative',
      border: `1px solid ${focused ? 'var(--accent)' : 'rgba(212, 163, 115, 0.2)'}`,
      borderRadius: '14px',
      background: focused ? 'rgba(212,163,115,0.04)' : 'rgba(28,28,26,0.6)',
      transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
      boxShadow: focused ? '0 0 0 3px rgba(212,163,115,0.1)' : 'none',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)'
    }}>
      {Icon && (
        <Icon size={15} style={{
          position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
          color: focused ? 'var(--accent)' : 'var(--text-faint)',
          pointerEvents: 'none', transition: 'color 0.2s', zIndex: 1
        }} />
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: `12px 16px 12px ${Icon ? '42px' : '16px'}`,
          paddingRight: suffix ? '56px' : '16px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '14px',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />
      {suffix}
    </div>
  )
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

    if (data.user.app_metadata?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('Access denied. This account is not an admin.')
      setLoading(false)
      return
    }

    router.push('/admin')
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

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

        <AdminPanel />

        {/* Form panel */}
        <div
          className="auth-form-panel"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 32px',
            background: 'radial-gradient(ellipse at 70% 15%, rgba(212,163,115,0.22) 0%, transparent 45%), radial-gradient(ellipse at 25% 85%, rgba(196,147,106,0.16) 0%, transparent 45%), radial-gradient(ellipse at 55% 50%, rgba(212,163,115,0.07) 0%, transparent 70%), #111110',
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative'
          }}>

          {/* Ambient glow blobs */}
          <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', top: '-15%', right: '-8%', background: 'radial-gradient(circle, rgba(212,163,115,0.18) 0%, rgba(212,163,115,0.06) 45%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', width: '280px', height: '280px', borderRadius: '50%', bottom: '5%', left: '2%', background: 'radial-gradient(circle, rgba(196,147,106,0.14) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', top: '45%', right: '5%', background: 'radial-gradient(circle, rgba(212,163,115,0.10) 0%, transparent 70%)', filter: 'blur(35px)', pointerEvents: 'none', zIndex: 0 }} />

          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
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

            {/* Mobile-only brand */}
            <motion.div
              className="auth-mobile-brand"
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'none', textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ fontSize: '28px', fontWeight: '900', color: 'var(--accent)', letterSpacing: '-1px' }}>
                Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
              </span>
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(212,163,115,0.12)',
                  border: '1px solid rgba(212,163,115,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FiShield size={18} color="var(--accent)" />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
                  Admin Sign In
                </h1>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '24px' }}>
                Access the AbuzarStore control panel
              </p>
            </motion.div>

            {/* Role selector */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              style={{
                display: 'flex', gap: '10px', marginBottom: '28px',
                background: 'rgba(28,28,26,0.6)', borderRadius: '12px', padding: '5px',
                border: '1px solid rgba(212,163,115,0.15)'
              }}>
              <motion.button
                whileHover={{ background: 'rgba(212,163,115,0.12)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/auth/login')}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: '8px', border: 'none',
                  background: 'rgba(0,0,0,0)',
                  color: 'rgba(212,163,115,0.7)',
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(212,163,115,0.7)' }}>
                Customer
              </motion.button>
              <button style={{
                flex: 1, padding: '10px',
                borderRadius: '8px', border: 'none',
                background: 'var(--gradient-accent)',
                color: 'var(--bg-primary)',
                fontSize: '13px', fontWeight: '700',
                cursor: 'default',
                boxShadow: '0 2px 12px rgba(212,163,115,0.3)'
              }}>
                Admin
              </button>
            </motion.div>

            {/* Form fields */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Admin Email
                </label>
                <AuthInput
                  icon={FiMail}
                  type="email"
                  placeholder="admin@abuzarstore.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Password
                </label>
                <AuthInput
                  icon={FiLock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
                whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? 'rgba(42,42,40,0.7)' : 'var(--gradient-accent)',
                  color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '700',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '6px',
                  boxShadow: loading ? 'none' : '0 4px 24px rgba(212,163,115,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 0.3s, box-shadow 0.3s, color 0.3s'
                }}>
                {loading ? 'Signing in...' : <><FiArrowRight size={15} /> Sign In as Admin</>}
              </motion.button>
            </motion.div>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)', marginTop: '28px' }}>
              Not an admin?{' '}
              <motion.span
                whileHover={{ color: 'var(--accent)' }}
                onClick={() => router.push('/auth/login')}
                style={{ color: 'rgba(212,163,115,0.85)', fontWeight: '700', cursor: 'pointer' }}>
                Customer login →
              </motion.span>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
