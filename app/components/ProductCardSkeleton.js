import { motion } from 'framer-motion'

export default function ProductCardSkeleton({ index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)'
      }}>
      <div className="skeleton" style={{ height: '220px', borderRadius: 0 }} />
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: '11px', width: '55%', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '15px', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '13px', width: '40%', borderRadius: '4px' }} />
        <div className="skeleton" style={{ height: '36px', borderRadius: '8px', marginTop: '4px' }} />
      </div>
    </motion.div>
  )
}
