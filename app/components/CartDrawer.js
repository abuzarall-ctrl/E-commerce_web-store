'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CartDrawer({ isOpen, onClose }) {
  const router = useRouter()
  const [items, setItems] = useState([])

  const readCart = () => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    // group by product id, keep product data + count
    const map = {}
    for (const p of raw) {
      if (map[p.id]) {
        map[p.id].qty += 1
      } else {
        map[p.id] = { ...p, qty: 1 }
      }
    }
    setItems(Object.values(map))
  }

  useEffect(() => {
    readCart()
    const handler = () => readCart()
    window.addEventListener('cartUpdated', handler)
    return () => window.removeEventListener('cartUpdated', handler)
  }, [])

  // re-read when drawer opens
  useEffect(() => { if (isOpen) readCart() }, [isOpen])

  const writeCart = (newItems) => {
    const flat = newItems.flatMap(item => Array(item.qty).fill({ ...item, qty: undefined }))
    localStorage.setItem('cart', JSON.stringify(flat))
    window.dispatchEvent(new Event('cartUpdated'))
    setItems(newItems)
  }

  const setQty = (id, qty) => {
    if (qty < 1) return remove(id)
    writeCart(items.map(i => i.id === id ? { ...i, qty } : i))
  }

  const remove = (id) => {
    writeCart(items.filter(i => i.id !== id))
  }

  const discounted = (item) =>
    item.discount ? item.price - (item.price * item.discount / 100) : item.price

  const total = items.reduce((sum, i) => sum + Math.round(discounted(i)) * i.qty, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 1100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s'
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 1101,
        display: 'flex',
        flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛒</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Your Cart
            </h2>
            {items.length > 0 && (
              <span style={{
                background: 'var(--accent)', color: 'var(--bg-primary)',
                borderRadius: '50%', width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700'
              }}>
                {items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-surface2)', border: '1px solid var(--border)',
              color: 'var(--text-faint)', borderRadius: '8px',
              width: '34px', height: '34px', fontSize: '16px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s, border-color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-faint)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}>
            ✕
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', paddingTop: '80px' }}>
              <span style={{ fontSize: '48px' }}>🛍️</span>
              <p style={{ color: 'var(--text-faint)', fontSize: '15px' }}>Your cart is empty</p>
              <button
                onClick={() => { onClose(); router.push('/shop') }}
                style={{
                  padding: '10px 24px',
                  background: 'var(--accent)', color: 'var(--bg-primary)',
                  border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}>
                Browse Products
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                background: 'var(--bg-surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px'
              }}>
                {/* Thumbnail */}
                <img
                  src={item.image_url || '/placeholder.png'}
                  alt={item.name}
                  onClick={() => { onClose(); router.push(`/product/${item.id}`) }}
                  style={{
                    width: '72px', height: '72px',
                    objectFit: 'cover', borderRadius: '8px',
                    flexShrink: 0, cursor: 'pointer'
                  }}
                />

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: '600',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '2px', cursor: 'pointer'
                  }}
                    onClick={() => { onClose(); router.push(`/product/${item.id}`) }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '8px' }}>{item.category}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {/* Qty controls */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setQty(item.id, item.qty - 1)}
                        style={{
                          width: '28px', height: '28px', background: 'var(--bg-surface)',
                          color: 'var(--text-primary)', fontSize: '14px', border: 'none', cursor: 'pointer'
                        }}>−</button>
                      <span style={{
                        width: '32px', textAlign: 'center',
                        fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)'
                      }}>{item.qty}</span>
                      <button
                        onClick={() => setQty(item.id, item.qty + 1)}
                        style={{
                          width: '28px', height: '28px', background: 'var(--bg-surface)',
                          color: 'var(--text-primary)', fontSize: '14px', border: 'none', cursor: 'pointer'
                        }}>+</button>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>
                        Rs. {(Math.round(discounted(item)) * item.qty).toLocaleString()}
                      </p>
                      {item.discount > 0 && (
                        <p style={{ fontSize: '11px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                          Rs. {(item.price * item.qty).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => remove(item.id)}
                      title="Remove"
                      style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text-faint)', borderRadius: '6px',
                        width: '28px', height: '28px', fontSize: '12px',
                        cursor: 'pointer', flexShrink: 0,
                        transition: 'color 0.2s, border-color 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#E24B4A'
                        e.currentTarget.style.borderColor = '#E24B4A'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'var(--text-faint)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
                Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>
                Rs. {total.toLocaleString()}
              </span>
            </div>

            {/* Checkout */}
            <button
              onClick={() => { onClose(); router.push('/checkout') }}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--accent)', color: 'var(--bg-primary)',
                border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '700',
                cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--accent-hover)'}
              onMouseLeave={e => e.target.style.background = 'var(--accent)'}>
              Proceed to Checkout →
            </button>

            {/* Continue shopping */}
            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent', color: 'var(--text-faint)',
                border: '1px solid var(--border)', borderRadius: '10px',
                fontSize: '13px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = 'var(--accent)'
                e.target.style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = 'var(--border)'
                e.target.style.color = 'var(--text-faint)'
              }}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}
