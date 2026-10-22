'use client'
import { useEffect, useState } from 'react'
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion'
import { FiArrowUp } from 'react-icons/fi'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 })
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <>
      <motion.div
        style={{
          scaleX,
          position: 'fixed', top: 0, left: 0, right: 0,
          height: '3px', transformOrigin: '0% 50%',
          background: 'var(--gradient-accent)',
          zIndex: 1200,
          pointerEvents: 'none'
        }}
      />
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="scroll-to-top"
            type="button"
            aria-label="Back to top"
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            onClick={scrollToTop}
            style={{
              position: 'fixed', bottom: '86px', right: '20px', zIndex: 900,
              width: '44px', height: '44px', borderRadius: '50%',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid var(--glass-border)',
              color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
            }}>
            <FiArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
