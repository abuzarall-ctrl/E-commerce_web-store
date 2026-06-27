'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingCart, FiCheck } from 'react-icons/fi'

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

export default function ProductCard({ product }) {
  const router = useRouter()
  const [added, setAdded] = useState(false)

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount / 100)
    : product.price

  const handleAddToCart = (e) => {
    e.stopPropagation()
    if (added || product.stock_status === 'out of stock') return
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    cart.push(product)
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  const outOfStock = product.stock_status === 'out of stock'

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(`/product/${product.id}`)}
      style={{
        background: 'var(--gradient-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(212, 163, 115, 0.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}>

      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <motion.img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          whileHover={{ scale: 1.07 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }}
        />

        {product.discount > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              position: 'absolute', top: '10px', left: '10px',
              background: 'var(--gradient-accent)',
              color: 'var(--bg-primary)',
              padding: '3px 8px', borderRadius: '6px',
              fontSize: '11px', fontWeight: '700',
              boxShadow: '0 2px 8px rgba(212,163,115,0.3)'
            }}>
            -{product.discount}% OFF
          </motion.span>
        )}

        <span style={{
          position: 'absolute', top: '10px', right: '10px',
          background: stockColor[product.stock_status] || 'var(--badge-green)',
          color: stockTextColor[product.stock_status] || 'var(--badge-green-text)',
          padding: '3px 8px', borderRadius: '6px',
          fontSize: '11px', fontWeight: '600'
        }}>
          {product.stock_status}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <p style={{
          fontSize: '11px', color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px'
        }}>
          {product.category}
        </p>

        <h3 style={{
          fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)',
          marginBottom: '8px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--accent)' }}>
            Rs. {Math.round(discountedPrice).toLocaleString()}
          </span>
          {product.discount > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: outOfStock ? 1 : 1.02 }}
          whileTap={{ scale: outOfStock ? 1 : 0.96 }}
          disabled={outOfStock}
          onClick={handleAddToCart}
          animate={added ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.3 }}
          style={{
            width: '100%', padding: '10px',
            background: outOfStock
              ? 'var(--bg-surface2)'
              : added
              ? 'rgba(134,239,172,0.15)'
              : 'var(--gradient-accent)',
            color: outOfStock
              ? 'var(--text-faint)'
              : added
              ? '#86EFAC'
              : 'var(--bg-primary)',
            border: added ? '1px solid rgba(134,239,172,0.3)' : 'none',
            borderRadius: '8px',
            fontSize: '13px', fontWeight: '600',
            cursor: outOfStock ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: outOfStock || added ? 'none' : '0 2px 12px rgba(212,163,115,0.25)',
            transition: 'background 0.3s, color 0.3s, border 0.3s, box-shadow 0.3s'
          }}>
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheck size={14} /> Added!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiShoppingCart size={14} />
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}
