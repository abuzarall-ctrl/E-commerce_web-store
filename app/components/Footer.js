'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiMapPin, FiPhone, FiMail, FiHeart, FiInstagram, FiFacebook, FiTwitter, FiArrowRight } from 'react-icons/fi'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Footer() {
  const router = useRouter()

  const categories = ['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers']
  const quickLinks = [
    { label: 'Shop All', path: '/shop' },
    { label: 'New Arrivals', path: '/shop' },
    { label: 'Best Sellers', path: '/shop' },
    { label: 'Sale', path: '/shop' },
  ]

  return (
    <footer style={{
      background: 'linear-gradient(180deg, var(--bg-surface) 0%, #1e1e1c 100%)',
      borderTop: '1px solid var(--border)',
      paddingTop: '64px',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Top grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '48px',
            paddingBottom: '48px'
          }}>

          {/* Brand */}
          <motion.div variants={fadeUp}>
            <div onClick={() => router.push('/')} style={{ cursor: 'pointer', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.5px' }}>
                Abuzar<span style={{ color: 'var(--text-primary)' }}>Store</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)', lineHeight: '1.8', marginBottom: '20px' }}>
              Pakistani clothing at its finest. Real quality, honest prices. Serving customers across Pakistan.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { icon: FiInstagram, label: 'Instagram' },
                { icon: FiFacebook, label: 'Facebook' },
                { icon: FiTwitter, label: 'Twitter' },
              ].map(({ icon: Icon, label }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  title={label}
                  style={{
                    width: '36px', height: '36px',
                    background: 'var(--bg-surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-faint)',
                    transition: 'color 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--accent)'
                    e.currentTarget.style.borderColor = 'var(--accent)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-faint)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}>
                  <Icon size={15} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div variants={fadeUp}>
            <h4 style={{
              fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px'
            }}>Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {categories.map(cat => (
                <div
                  key={cat}
                  onClick={() => router.push(`/shop?category=${cat}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', color: 'var(--text-faint)',
                    cursor: 'pointer', transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                  <FiArrowRight size={12} style={{ flexShrink: 0 }} />
                  {cat}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={fadeUp}>
            <h4 style={{
              fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px'
            }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {quickLinks.map(({ label, path }) => (
                <div
                  key={label}
                  onClick={() => router.push(path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', color: 'var(--text-faint)',
                    cursor: 'pointer', transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                  <FiArrowRight size={12} style={{ flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div variants={fadeUp}>
            <h4 style={{
              fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px'
            }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { icon: FiMapPin, text: 'Karachi, Pakistan' },
                { icon: FiPhone, text: '+92 300 0000000' },
                { icon: FiMail, text: 'support@abuzarstore.pk' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '30px', height: '30px',
                    background: 'rgba(212, 163, 115, 0.1)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={13} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '24px' }} />

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '28px'
        }}>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            © 2025 AbuzarStore. All rights reserved.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Made with <FiHeart size={12} color="var(--accent)" /> in Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}
