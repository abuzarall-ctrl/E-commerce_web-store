'use client'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'

export default function Toast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    const show = e => {
      setToast(e.detail?.message || 'Added to cart')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setToast(null), 2400)
    }
    window.addEventListener('appToast', show)
    return () => {
      window.removeEventListener('appToast', show)
      clearTimeout(timer.current)
    }
  }, [])

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 400 }}
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '28px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '12px',
            padding: '12px 18px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            maxWidth: 'calc(100vw - 32px)'
          }}>
          <FiCheckCircle size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{toast}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}