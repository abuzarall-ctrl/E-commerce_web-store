 'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiTruck, FiShield, FiTag, FiLock, FiArrowRight } from 'react-icons/fi'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import HeroClothBackground from './components/HeroClothBackground'
import MarqueeStrip from './components/MarqueeStrip'
import ProductCardSkeleton from './components/ProductCardSkeleton'
import dynamic from 'next/dynamic'

// Dynamically import heavier UI pieces to improve initial render performance
const ProductCard = dynamic(() => import('./components/ProductCard'), { ssr: false })
const Footer = dynamic(() => import('./components/Footer'), { ssr: false })

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
  const heroRef = useRef(null)
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

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      // Gentle parallax: hero content drifts up slower as you scroll
      gsap.to('.hero-content', {
        yPercent: 16,
        opacity: 0.2,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })

      // Magnetic buttons
      gsap.utils.toArray('.hero-buttons button').forEach(btn => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power3.out' })
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power3.out' })
        const move = e => {
          const r = btn.getBoundingClientRect()
          xTo((e.clientX - r.left - r.width / 2) * 0.3)
          yTo((e.clientY - r.top - r.height / 2) * 0.3)
        }
        const reset = () => { xTo(0); yTo(0) }
        btn.addEventListener('pointermove', move)
        btn.addEventListener('pointerleave', reset)
      })
    }, heroRef)

    return () => ctx.revert()
  }, [])

  const trustItems = [
    { icon: FiTruck, title: 'Fast Delivery', desc: 'Across Pakistan' },
    { icon: FiShield, title: 'Quality Guaranteed', desc: 'Or money back' },
    { icon: FiTag, title: 'Best Prices', desc: 'No hidden charges' },
    { icon: FiLock, title: 'Secure Checkout', desc: '100% safe' },
  ]

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .hero-section { padding: 56px 20px !important; }
          .hero-buttons { flex-direction: column !important; align-items: stretch !important; }
          .hero-buttons button { width: 100% !important; justify-content: center !important; }
          .categories-section { padding: 40px 16px !important; }
          .featured-section { padding: 0 16px 48px !important; }
          .trust-section { padding: 36px 16px !important; }
          .category-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .featured-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
        @media (max-width: 400px) {
          .category-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .featured-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="hero-section" style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface2) 100%)',
        padding: '90px 24px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Cloth-only background: garment silhouettes (video shown when provided) */}
        <HeroClothBackground />

        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(212,163,115,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        <div className="hero-content">

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
          className="hero-buttons"
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
        </div>
      </section>

      {/* Garment marquee */}
      <MarqueeStrip />

      {/* Categories */}
      <section className="categories-section" style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <motion.h2
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '24px' }}>
          Shop by Category
        </motion.h2>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="category-grid"
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
      <section className="featured-section" style={{ padding: '0 24px 60px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
          <div className="featured-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} index={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>No products yet. Check back soon!</div>
        ) : (
          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="featured-grid"
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
      <section className="trust-section" style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface2) 100%)',
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
    </>
  )
}
