'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { FiShoppingCart } from 'react-icons/fi'

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

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount / 100)
    : product.price

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
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(212, 163, 115, 0.15)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}>

      {/* Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          style={{
            width: '100%', height: '220px',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />

        {product.discount > 0 && (
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            background: 'var(--gradient-accent)',
            color: 'var(--bg-primary)',
            padding: '3px 8px', borderRadius: '6px',
            fontSize: '11px', fontWeight: '700',
            boxShadow: '0 2px 8px rgba(212,163,115,0.3)'
          }}>
            -{product.discount}% OFF
          </span>
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
          whileHover={{ scale: product.stock_status === 'out of stock' ? 1 : 1.02 }}
          whileTap={{ scale: product.stock_status === 'out of stock' ? 1 : 0.97 }}
          disabled={product.stock_status === 'out of stock'}
          onClick={e => {
            e.stopPropagation()
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
            cart.push(product)
            localStorage.setItem('cart', JSON.stringify(cart))
            window.dispatchEvent(new Event('cartUpdated'))
          }}
          style={{
            width: '100%', padding: '10px',
            background: product.stock_status === 'out of stock' ? 'var(--bg-surface2)' : 'var(--gradient-accent)',
            color: product.stock_status === 'out of stock' ? 'var(--text-faint)' : 'var(--bg-primary)',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: '600',
            cursor: product.stock_status === 'out of stock' ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            boxShadow: product.stock_status === 'out of stock' ? 'none' : '0 2px 12px rgba(212,163,115,0.25)'
          }}>
          <FiShoppingCart size={14} />
          {product.stock_status === 'out of stock' ? 'Out of Stock' : 'Add to Cart'}
        </motion.button>
      </div>
    </motion.div>
  )
}
