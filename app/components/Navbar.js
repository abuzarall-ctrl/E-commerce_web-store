'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)

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

  return (
    <>
      <nav style={{
        background: 'var(--bg-surface)',
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
        <div
          onClick={() => router.push('/')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--accent)',
            letterSpacing: '-0.5px'
          }}>
            Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
          </span>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span
            onClick={() => router.push('/shop')}
            style={{ color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
            Shop
          </span>

          {user ? (
            <>
              <span
                onClick={() => router.push('/admin')}
                style={{ color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                Admin
              </span>
              <span
                onClick={handleLogout}
                style={{ color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                Logout
              </span>
            </>
          ) : (
            <span
              onClick={() => router.push('/auth/login')}
              style={{ color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
              Login
            </span>
          )}

          {/* Cart Button */}
          <div
            onClick={() => setCartOpen(true)}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
            🛒 Cart {cartCount > 0 && (
              <span style={{
                background: 'var(--bg-primary)',
                color: 'var(--accent)',
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
          </div>
        </div>
      </nav>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
