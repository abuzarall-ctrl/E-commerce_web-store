'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiShoppingCart, FiCheck } from 'react-icons/fi'
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
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
          .from('products').select('*')
          .eq('category', data.category).neq('id', id).limit(4)
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
          <button onClick={() => router.push('/shop')}
            style={{ padding: '10px 24px', background: 'var(--gradient-accent)', color: 'var(--bg-primary)', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer' }}>
            Back to Shop
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <>
      <style>{`
        .product-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 64px; align-items: start; }
        .product-img-wrap { height: 480px !important; }
        @media (max-width: 768px) {
          .product-detail-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .product-img-wrap { height: 320px !important; }
          .product-detail-pad { padding: 20px 16px !important; }
        }
        @media (max-width: 480px) {
          .product-img-wrap { height: 260px !important; }
          .related-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
      `}</style>

    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div className="product-detail-pad" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '32px 24px', flex: 1 }}>

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '28px', fontSize: '13px', color: 'var(--text-faint)', flexWrap: 'wrap' }}>
          <span onClick={() => router.push('/')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}>Home</span>
          <span>/</span>
          <span onClick={() => router.push('/shop')} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-faint)'}>Shop</span>
          <span>/</span>
          <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{product.name}</span>
        </motion.div>

        {/* Main layout */}
        <div className="product-detail-grid">

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div className="product-img-wrap" style={{ overflow: 'hidden' }}>
              <motion.img
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {product.discount > 0 && (
              <span style={{
                position: 'absolute', top: '14px', left: '14px',
                background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                boxShadow: '0 2px 10px rgba(212,163,115,0.3)'
              }}>
                -{product.discount}% OFF
              </span>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Badges */}
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

            <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>
              {product.name}
            </h1>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '30px', fontWeight: '800',
                background: 'var(--gradient-accent)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
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

            <div style={{ borderTop: '1px solid var(--border)' }} />

            {product.description && (
              <p style={{ fontSize: '15px', color: 'var(--text-faint)', lineHeight: '1.8' }}>
                {product.description}
              </p>
            )}

            {/* Qty */}
            {product.stock_status !== 'out of stock' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    style={{ width: '40px', height: '40px', background: 'var(--bg-surface2)', color: 'var(--text-primary)', fontSize: '18px', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.background = 'var(--bg-surface2)'}>−</button>
                  <span style={{ width: '48px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600', fontSize: '15px' }}>{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    style={{ width: '40px', height: '40px', background: 'var(--bg-surface2)', color: 'var(--text-primary)', fontSize: '18px', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.target.style.background = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.background = 'var(--bg-surface2)'}>+</button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <motion.button
              whileHover={{ scale: product.stock_status === 'out of stock' ? 1 : 1.02 }}
              whileTap={{ scale: product.stock_status === 'out of stock' ? 1 : 0.97 }}
              onClick={handleAddToCart}
              disabled={product.stock_status === 'out of stock'}
              style={{
                padding: '16px',
                background: product.stock_status === 'out of stock'
                  ? 'var(--bg-surface2)'
                  : added ? 'rgba(204,213,174,0.2)' : 'var(--gradient-accent)',
                color: product.stock_status === 'out of stock'
                  ? 'var(--text-faint)'
                  : added ? 'var(--badge-green)' : 'var(--bg-primary)',
                border: added ? '1px solid var(--badge-green)' : 'none',
                borderRadius: '10px',
                fontSize: '15px', fontWeight: '700',
                cursor: product.stock_status === 'out of stock' ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: added || product.stock_status === 'out of stock' ? 'none' : '0 4px 20px rgba(212,163,115,0.3)'
              }}>
              {product.stock_status === 'out of stock' ? (
                'Out of Stock'
              ) : added ? (
                <><FiCheck size={16} /> Added to Cart</>
              ) : (
                <><FiShoppingCart size={16} /> Add to Cart</>
              )}
            </motion.button>

            {/* Back */}
            <motion.button
              whileHover={{ x: -4 }}
              onClick={() => router.push('/shop')}
              style={{
                padding: '12px',
                background: 'transparent', color: 'var(--text-faint)',
                border: '1px solid var(--border)', borderRadius: '10px',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-faint)'
              }}>
              <FiArrowLeft size={15} /> Back to Shop
            </motion.button>
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section>
            <motion.h2
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
              More in {product.category}
            </motion.h2>
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="related-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {related.map(p => (
                <motion.div key={p.id} variants={fadeUp}>
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </div>

      <Footer />
    </main>
    </>
  )
}
