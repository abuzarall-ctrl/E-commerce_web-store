'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX } from 'react-icons/fi'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setUser(session.user)
    }
    getUser()

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.length)

    const handler = () => {
      const updated = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartCount(updated.length)
    }
    window.addEventListener('cartUpdated', handler)
    return () => window.removeEventListener('cartUpdated', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const linkStyle = {
    color: 'var(--text-muted)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'color 0.2s',
    fontWeight: '500'
  }

  return (
    <>
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: 'rgba(28, 28, 26, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--glass-border)',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>

        {/* Logo */}
        <div onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={linkStyle} onClick={() => router.push('/')}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            Home
          </span>

          <span style={linkStyle} onClick={() => router.push('/shop')}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            Shop
          </span>

          {user ? (
            <>
              <span style={linkStyle} onClick={() => router.push('/admin')}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                Admin
              </span>
              <span style={linkStyle} onClick={handleLogout}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                Logout
              </span>
            </>
          ) : (
            <span style={linkStyle} onClick={() => router.push('/auth/login')}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              Login
            </span>
          )}

          {/* Cart Button — glassy rectangular */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCartOpen(true)}
            style={{
              background: 'rgba(212, 163, 115, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border)',
              color: 'var(--accent)',
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s, border-color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gradient-accent)'
              e.currentTarget.style.color = 'var(--bg-primary)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212, 163, 115, 0.15)'
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.borderColor = 'var(--glass-border)'
            }}>
            <FiShoppingCart size={16} />
            Cart
            {cartCount > 0 && (
              <span style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700'
              }}>{cartCount}</span>
            )}
          </motion.div>
        </div>
      </motion.nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
