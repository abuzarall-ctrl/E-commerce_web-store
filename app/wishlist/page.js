'use client'
import { useSyncExternalStore, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiHeart, FiShoppingBag, FiTrash2 } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { subscribeWishlist, getWishlistItems } from '@/lib/wishlistStore'
import { writeWishlistToStorage } from '@/lib/wishlistStorage'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
}
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
}

export default function WishlistPage() {
  const router = useRouter()
  const emptyRef = useRef([])
  const items = useSyncExternalStore(subscribeWishlist, getWishlistItems, () => emptyRef.current)

  const clearAll = () => {
    if (!confirm('Remove all items from your wishlist?')) return
    writeWishlistToStorage([])
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media (max-width: 900px) {
          .wishlist-header { padding: 28px 20px 22px !important; }
          .wishlist-inner { padding: 22px 20px !important; }
        }
        @media (max-width: 640px) {
          .wishlist-header { padding: 22px 16px 18px !important; }
          .wishlist-inner { padding: 20px 16px !important; }
          .wishlist-title { font-size: 23px !important; }
          .wishlist-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
        @media (max-width: 360px) {
          .wishlist-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <Navbar />

      <div className="wishlist-header" style={{
        background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '36px 24px 28px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <motion.p
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiHeart size={12} /> Saved for later
          </motion.p>
          <motion.h1
            className="wishlist-title"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Your Wishlist
          </motion.h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
            {items.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={clearAll}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--text-faint)', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}>
                <FiTrash2 size={12} /> Clear all
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="wishlist-inner" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 }}>
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 24px' }}>
            <FiHeart size={40} color="var(--text-faint)" style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>Your wishlist is empty</p>
            <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '20px' }}>Tap the heart on any product to save it here.</p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/shop')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 28px', background: 'var(--gradient-accent)',
                color: 'var(--bg-primary)', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer'
              }}>
              <FiShoppingBag size={15} /> Browse the shop
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              className="wishlist-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '20px'
              }}>
              {items.map(product => (
                <motion.div key={product.id} variants={cardVariants} layout>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </main>
  )
}
