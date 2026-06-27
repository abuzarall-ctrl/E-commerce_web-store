'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingCart, FiMenu, FiX, FiPackage, FiLogOut, FiLogIn } from 'react-icons/fi'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [prevCount, setPrevCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })

    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartCount(cart.length)
    setPrevCount(cart.length)

    const handler = () => {
      const updated = JSON.parse(localStorage.getItem('cart') || '[]')
      setPrevCount(c => c)
      setCartCount(updated.length)
    }
    window.addEventListener('cartUpdated', handler)
    return () => window.removeEventListener('cartUpdated', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    router.push('/')
  }

  const navigate = (path) => { router.push(path); setMenuOpen(false) }

  const linkStyle = {
    color: 'var(--text-muted)',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
    padding: '4px 0',
    position: 'relative'
  }

  const NavLink = ({ label, path, icon: Icon }) => (
    <motion.span
      whileHover={{ color: 'var(--accent)' }}
      onClick={() => navigate(path)}
      style={linkStyle}>
      {Icon && <Icon size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />}
      {label}
    </motion.span>
  )

  return (
    <>
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          background: 'rgba(28, 28, 26, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border)',
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
        <motion.div
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ cursor: 'pointer' }}>
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
            Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
          </span>
        </motion.div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}
            className="desktop-nav">
            <NavLink label="Home" path="/" />
            <NavLink label="Shop" path="/shop" />
            {user && <NavLink label="My Orders" path="/orders" icon={FiPackage} />}
            {user ? (
              <motion.span
                whileHover={{ color: '#E24B4A' }}
                onClick={handleLogout}
                style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiLogOut size={13} /> Logout
              </motion.span>
            ) : (
              <motion.span
                whileHover={{ color: 'var(--accent)' }}
                onClick={() => navigate('/auth/login')}
                style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FiLogIn size={13} /> Login
              </motion.span>
            )}
          </div>

          {/* Cart Button */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCartOpen(true)}
            style={{
              background: 'rgba(212, 163, 115, 0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background 0.2s, border-color 0.2s, color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--gradient-accent)'
              e.currentTarget.style.color = 'var(--bg-primary)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212, 163, 115, 0.12)'
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}>
            <FiShoppingCart size={15} />
            Cart
            <AnimatePresence mode="wait">
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--bg-primary)',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '800',
                    flexShrink: 0
                  }}>
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Mobile hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'none',
              background: 'none', border: 'none',
              color: 'var(--text-primary)', cursor: 'pointer',
              padding: '4px'
            }}
            className="mobile-menu-btn">
            {menuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{
              background: 'rgba(28, 28, 26, 0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid var(--border)',
              overflow: 'hidden',
              position: 'sticky',
              top: '64px',
              zIndex: 999
            }}>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Home', path: '/' },
                { label: 'Shop', path: '/shop' },
                ...(user ? [{ label: 'My Orders', path: '/orders' }] : [])
              ].map(({ label, path }) => (
                <motion.span
                  key={path}
                  whileTap={{ x: 4 }}
                  onClick={() => navigate(path)}
                  style={{ fontSize: '16px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '500' }}>
                  {label}
                </motion.span>
              ))}
              {user ? (
                <motion.span
                  whileTap={{ x: 4 }}
                  onClick={handleLogout}
                  style={{ fontSize: '16px', color: '#E24B4A', cursor: 'pointer', fontWeight: '500' }}>
                  Logout
                </motion.span>
              ) : (
                <motion.span
                  whileTap={{ x: 4 }}
                  onClick={() => navigate('/auth/login')}
                  style={{ fontSize: '16px', color: 'var(--accent)', cursor: 'pointer', fontWeight: '500' }}>
                  Login
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
