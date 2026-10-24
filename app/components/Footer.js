'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiMapPin, FiPhone, FiMail, FiHeart, FiArrowRight, FiInstagram, FiFacebook, FiMessageCircle, FiRotateCcw } from 'react-icons/fi'
import { CATEGORIES } from '@/lib/categories'
import { useSiteSettings } from './SiteSettingsProvider'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const socialStyle = {
  width: '32px', height: '32px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'rgba(212, 163, 115, 0.1)',
  color: 'var(--accent)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', textDecoration: 'none'
}

export default function Footer() {
  const router = useRouter()
  const settings = useSiteSettings()

  const categories = CATEGORIES
  const contact = [
    { icon: FiMapPin, text: settings.address },
    { icon: FiPhone, text: settings.phone, href: `tel:${settings.phone.replace(/\s+/g, '')}` },
    { icon: FiMail, text: settings.email, href: `mailto:${settings.email}` },
  ]
  const whatsappDigits = settings.whatsapp.replace(/[^\d]/g, '')

  return (
    <footer style={{
      background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface2) 100%)',
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
              {settings.footerNote}
            </p>
            {(settings.instagram || settings.facebook || whatsappDigits) && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {settings.instagram && (
                  <a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" style={socialStyle}><FiInstagram size={15} /></a>
                )}
                {settings.facebook && (
                  <a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" style={socialStyle}><FiFacebook size={15} /></a>
                )}
                {whatsappDigits && (
                  <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" style={socialStyle}><FiMessageCircle size={15} /></a>
                )}
              </div>
            )}
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
                  onClick={() => router.push(`/shop?category=${encodeURIComponent(cat)}`)}
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

          {/* Contact */}
          <motion.div variants={fadeUp}>
            <h4 style={{
              fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)',
              textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '20px'
            }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contact.map(({ icon: Icon, text, href }) => (
                <div key={`${text}-${href || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  {href ? (
                    <a href={href} style={{ fontSize: '13px', color: 'var(--text-faint)', textDecoration: 'none' }}>{text}</a>
                  ) : (
                    <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>{text}</span>
                  )}
                </div>
              ))}
              <div
                onClick={() => router.push('/refund')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '13px', color: 'var(--text-faint)', cursor: 'pointer',
                  transition: 'color 0.2s', marginTop: '2px'
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                <div style={{
                  width: '30px', height: '30px',
                  background: 'rgba(212, 163, 115, 0.1)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FiRotateCcw size={13} color="var(--accent)" />
                </div>
                Refund request
              </div>
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
            © 2026 AbuzarStore. All rights reserved.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Made with <FiHeart size={12} color="var(--accent)" /> in Pakistan
          </p>
        </div>
      </div>
    </footer>
  )
}
