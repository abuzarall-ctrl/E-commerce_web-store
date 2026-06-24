'use client'
import { useRouter } from 'next/navigation'

export default function ProductCard({ product }) {
  const router = useRouter()

  const discountedPrice = product.discount
    ? product.price - (product.price * product.discount / 100)
    : product.price

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

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = 'var(--accent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}>

      {/* Product Image */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img
          src={product.image_url || '/placeholder.png'}
          alt={product.name}
          style={{
            width: '100%',
            height: '220px',
            objectFit: 'cover',
            transition: 'transform 0.3s'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            -{product.discount}% OFF
          </span>
        )}

        {/* Stock Badge */}
        <span style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: stockColor[product.stock_status] || 'var(--badge-green)',
          color: stockTextColor[product.stock_status] || 'var(--badge-green-text)',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600'
        }}>
          {product.stock_status}
        </span>
      </div>

      {/* Product Info */}
      <div style={{ padding: '14px' }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '4px'
        }}>
          {product.category}
        </p>

        <h3 style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {product.name}
        </h3>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            fontSize: '17px',
            fontWeight: '700',
            color: 'var(--accent)'
          }}>
            Rs. {Math.round(discountedPrice).toLocaleString()}
          </span>
          {product.discount > 0 && (
            <span style={{
              fontSize: '13px',
              color: 'var(--text-faint)',
              textDecoration: 'line-through'
            }}>
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          disabled={product.stock_status === 'out of stock'}
          onClick={e => {
            e.stopPropagation()
            const cart = JSON.parse(localStorage.getItem('cart') || '[]')
            cart.push(product)
            localStorage.setItem('cart', JSON.stringify(cart))
            window.dispatchEvent(new Event('cartUpdated'))
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: product.stock_status === 'out of stock'
              ? 'var(--bg-surface2)'
              : 'var(--accent)',
            color: product.stock_status === 'out of stock'
              ? 'var(--text-faint)'
              : 'var(--bg-primary)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: product.stock_status === 'out of stock' ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
          {product.stock_status === 'out of stock' ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}