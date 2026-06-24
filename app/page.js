'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .limit(8)
      if (data) setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        background: 'var(--bg-surface)',
        padding: '80px 24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at center, rgba(212,163,115,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <p style={{
          fontSize: '12px',
          color: 'var(--accent)',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          Pakistani Clothing Store
        </p>

        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 64px)',
          fontWeight: '800',
          color: 'var(--text-primary)',
          lineHeight: '1.1',
          marginBottom: '20px',
          letterSpacing: '-1px'
        }}>
          Real Quality.<br />
          <span style={{ color: 'var(--accent)' }}>Honest Price.</span>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-faint)',
          maxWidth: '480px',
          margin: '0 auto 36px',
          lineHeight: '1.7'
        }}>
          T-Shirts, Shalwar Kameez, Kurta, Shorts & Trousers —
          best quality at prices that make sense.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/shop')}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'var(--accent-hover)'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'var(--accent)'
              e.target.style.transform = 'translateY(0)'
            }}>
            Shop Now →
          </button>

          <button
            onClick={() => router.push('/shop')}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}>
            View Categories
          </button>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '24px'
        }}>Shop by Category</h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px'
        }}>
          {['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers'].map(cat => (
            <div
              key={cat}
              onClick={() => router.push(`/shop?category=${cat}`)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, transform 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Featured Products
          </h2>
          <span
            onClick={() => router.push('/shop')}
            style={{ fontSize: '14px', color: 'var(--accent)', cursor: 'pointer' }}>
            View All →
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>
            No products yet. Check back soon!
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <section style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '40px 24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px',
          textAlign: 'center'
        }}>
          {[
            { icon: '🚚', title: 'Fast Delivery', desc: 'Across Pakistan' },
            { icon: '✅', title: 'Quality Guaranteed', desc: 'Or money back' },
            { icon: '💰', title: 'Best Prices', desc: 'No hidden charges' },
            { icon: '🔒', title: 'Secure Checkout', desc: '100% safe' },
          ].map(item => (
            <div key={item.title}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}