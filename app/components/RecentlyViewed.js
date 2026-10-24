'use client'
import { useSyncExternalStore } from 'react'
import { motion } from 'framer-motion'
import { FiClock } from 'react-icons/fi'
import ProductCard from './ProductCard'
import { getRecentlyViewed, subscribeRecentlyViewed } from '@/lib/recentlyViewed'

const EMPTY_ITEMS = []

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function RecentlyViewed({ excludeId }) {
  const items = useSyncExternalStore(
    subscribeRecentlyViewed,
    () => getRecentlyViewed(excludeId),
    () => EMPTY_ITEMS
  )

  if (items.length === 0) return null

  return (
    <section style={{ marginTop: '56px' }}>
      <motion.h2
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{
          fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
        <FiClock size={18} color="var(--accent)" /> Recently viewed
      </motion.h2>
      <motion.div
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="related-grid"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {items.map(product => (
          <motion.div key={product.id} variants={fadeUp}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
