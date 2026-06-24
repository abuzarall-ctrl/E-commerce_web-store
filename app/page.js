'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiTruck, FiShield, FiTag, FiLock, FiArrowRight } from 'react-icons/fi'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProductCard from './components/ProductCard'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').limit(8)
      if (data) setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const trustItems = [
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Across Pakistan' },
    { icon: FiShield, title: 'Quality Guaranteed', desc: 'Or money back' },
    { icon: FiTag, title: 'Best Prices', desc: 'No hidden charges' },
    { icon: FiLock, title: 'Secure Checkout', desc: '100% safe' },
  ]

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, #222220 100%)',
        padding: '90px 24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(212,163,115,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible"
          style={{ fontSize: '12px', color: 'var(--accent)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px' }}>
          Pakistani Clothing Store
        </motion.p>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.1 }}
          style={{
            fontSize: 'clamp(32px, 6vw, 68px)',
            fontWeight: '900',
            color: 'var(--text-primary)',
            lineHeight: '1.05',
            marginBottom: '20px',
            letterSpacing: '-2px'
          }}>
          Real Quality.<br />
          <span style={{
            background: 'var(--gradient-accent)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Honest Price.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible"
          transition={{ delay: 0.2 }}
          style={{ fontSize: '16px', color: 'var(--text-faint)', maxWidth: '480px', margin: '0 auto 36px', lineHeight: '1.8' }}>
          T-Shirts, Shalwar Kameez, Kurta, Shorts & Trousers —
          best quality at prices that make sense.
        </motion.p>

        <motion.div
          variants={stagger} initial="hidden" animate="visible"
          transition={{ delayChildren: 0.3 }}
          style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/shop')}
            style={{
              background: 'var(--gradient-accent)',
              color: 'var(--bg-primary)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(212,163,115,0.35)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
            Shop Now <FiArrowRight size={16} />
          </motion.button>

          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/shop')}
            style={{
              background: 'rgba(212,163,115,0.08)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: 'var(--text-primary)',
              padding: '14px 32px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              border: '1px solid var(--glass-border)',
              cursor: 'pointer'
            }}>
            View Categories
          </motion.button>
        </motion.div>
      </section>

      {/* Categories */}
      <section style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <motion.h2
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px' }}>
          Shop by Category
        </motion.h2>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers'].map(cat => (
            <motion.div
              key={cat}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/shop?category=${cat}`)}
              style={{
                background: 'var(--gradient-surface)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '20px 12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,163,115,0.12)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Products */}
      <section style={{ padding: '0 24px 60px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Featured Products
          </h2>
          <span
            onClick={() => router.push('/shop')}
            style={{ fontSize: '14px', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <FiArrowRight size={14} />
          </span>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>Loading products...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>No products yet. Check back soon!</div>
        ) : (
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {products.map((product, i) => (
              <motion.div key={product.id} variants={fadeUp} custom={i}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Trust Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, #222220 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 24px'
      }}>
        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{
            maxWidth: '1200px', margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '24px', textAlign: 'center'
          }}>
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'rgba(212, 163, 115, 0.1)',
                border: '1px solid var(--glass-border)',
                borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon size={22} color="var(--accent)" />
              </div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Footer />
    </main>
  )
}
