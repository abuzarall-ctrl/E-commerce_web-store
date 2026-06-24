'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import ProductCard from '@/app/components/ProductCard'

const stockColor = {
  'in stock': 'var(--badge-green)',
  'low stock': '#EF9F27',
  'out of stock': '#E24B4A'
}
const stockTextColor = {
  'in stock': 'var(--badge-green-text)',
  'low stock': '#412402',
  'out of stock': '#501313'
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('products').select('*').eq('id', id).single()
      if (data) {
        setProduct(data)
        const { data: rel } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .limit(4)
        if (rel) setRelated(rel)
      }
      setLoading(false)
    }
    fetch()
  }, [id])

  const discountedPrice = product?.discount
    ? product.price - (product.price * product.discount / 100)
    : product?.price

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    for (let i = 0; i < qty; i++) cart.push(product)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
          Loading...
        </div>
        <Footer />
      </main>
    )
  }

  if (!product) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <p style={{ fontSize: '20px', color: 'var(--text-primary)' }}>Product not found</p>
          <button
            onClick={() => router.push('/shop')}
            style={{ padding: '10px 24px', background: 'var(--accent)', color: 'var(--bg-primary)', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}>
            Back to Shop
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px 24px', flex: 1 }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px', fontSize: '13px', color: 'var(--text-faint)' }}>
          <span onClick={() => router.push('/')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}>Home</span>
          <span>/</span>
          <span onClick={() => router.push('/shop')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}>Shop</span>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)' }}>{product.name}</span>
        </div>

        {/* Main Product Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '48px',
          marginBottom: '64px'
        }}>

          {/* Image */}
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <img
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              style={{ width: '100%', height: '480px', objectFit: 'cover', display: 'block' }}
            />
            {product.discount > 0 && (
              <span style={{
                position: 'absolute', top: '14px', left: '14px',
                background: 'var(--accent)', color: 'var(--bg-primary)',
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'
              }}>
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Category + Stock */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '2px',
                background: 'rgba(212,163,115,0.1)', padding: '4px 10px', borderRadius: '20px',
                border: '1px solid rgba(212,163,115,0.2)'
              }}>
                {product.category}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: '600',
                background: stockColor[product.stock_status] || 'var(--badge-green)',
                color: stockTextColor[product.stock_status] || 'var(--badge-green-text)',
                padding: '4px 10px', borderRadius: '20px'
              }}>
                {product.stock_status}
              </span>
            </div>

            {/* Name */}
            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '30px', fontWeight: '800', color: 'var(--accent)' }}>
                Rs. {Math.round(discountedPrice).toLocaleString()}
              </span>
              {product.discount > 0 && (
                <>
                  <span style={{ fontSize: '18px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                    Rs. {product.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--badge-green)', fontWeight: '600' }}>
                    Save Rs. {(product.price - Math.round(discountedPrice)).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)' }} />

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '15px', color: 'var(--text-faint)', lineHeight: '1.8' }}>
                {product.description}
              </p>
            )}

            {/* Quantity */}
            {product.stock_status !== 'out of stock' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{
                      width: '40px', height: '40px',
                      background: 'var(--bg-surface2)', color: 'var(--text-primary)',
                      fontSize: '18px', fontWeight: '400', border: 'none',
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.background = 'var(--bg-surface2)'}>
                    −
                  </button>
                  <span style={{ width: '48px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600', fontSize: '15px' }}>
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => q + 1)}
                    style={{
                      width: '40px', height: '40px',
                      background: 'var(--bg-surface2)', color: 'var(--text-primary)',
                      fontSize: '18px', fontWeight: '400', border: 'none',
                      cursor: 'pointer', transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.background = 'var(--bg-surface2)'}>
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_status === 'out of stock'}
              style={{
                padding: '16px',
                background: product.stock_status === 'out of stock'
                  ? 'var(--bg-surface2)'
                  : added ? 'var(--badge-green)' : 'var(--accent)',
                color: product.stock_status === 'out of stock'
                  ? 'var(--text-faint)'
                  : added ? 'var(--badge-green-text)' : 'var(--bg-primary)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: product.stock_status === 'out of stock' ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s, transform 0.2s',
                transform: added ? 'scale(0.98)' : 'scale(1)'
              }}>
              {product.stock_status === 'out of stock'
                ? 'Out of Stock'
                : added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>

            {/* Back to shop */}
            <button
              onClick={() => router.push('/shop')}
              style={{
                padding: '12px',
                background: 'transparent',
                color: 'var(--text-faint)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.color = 'var(--text-faint)'
              }}>
              ← Back to Shop
            </button>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
              More in {product.category}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </main>
  )
}
