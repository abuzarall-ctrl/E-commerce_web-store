'use client'
import { useSyncExternalStore, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShoppingCart, FiShoppingBag, FiX, FiTrash2, FiArrowRight } from 'react-icons/fi'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { writeCartToStorage } from '@/lib/cartStorage'
import { subscribeCart, getCartItems, refreshCart } from '@/lib/cartStore'

export default function CartDrawer({ isOpen, onClose }) {
  const router = useRouter()
  const emptyCartRef = useRef([])
  const items = useSyncExternalStore(subscribeCart, getCartItems, () => emptyCartRef.current)

  const writeCart = (newItems) => {
    writeCartToStorage(newItems)
    refreshCart()
  }

  const setQty = (id, qty) => {
    if (qty < 1) return remove(id)
    writeCart(items.map(i => i.id === id ? { ...i, qty } : i))
  }

  const remove = (id) => writeCart(items.filter(i => i.id !== id))

  const discounted = (item) =>
    item.discount ? item.price - (item.price * item.discount / 100) : item.price

  const total = items.reduce((sum, i) => sum + Math.round(discounted(i)) * i.qty, 0)
  const totalQty = items.reduce((s, i) => s + i.qty, 0)

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 1100
            }}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(420px, 100vw)',
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-surface2) 100%)',
          borderLeft: '1px solid var(--glass-border)',
          zIndex: 1101,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 48px rgba(0,0,0,0.5)'
        }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiShoppingCart size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Your Cart
            </h2>
            {totalQty > 0 && (
              <span style={{
                background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                borderRadius: '50%', width: '22px', height: '22px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: '700'
              }}>
                {totalQty}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'var(--bg-surface2)', border: '1px solid var(--border)',
              color: 'var(--text-faint)', borderRadius: '8px',
              width: '34px', height: '34px',
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
            <FiX size={16} />
          </motion.button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (() => {
          const FREE_SHIPPING = 3000
          const remaining = Math.max(0, FREE_SHIPPING - total)
          const pct = Math.min(100, Math.round((total / FREE_SHIPPING) * 100))
          return (
            <div style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--glass-bg)'
            }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {remaining > 0 ? (
                  <>Add <b style={{ color: 'var(--accent)' }}>Rs. {Math.round(remaining).toLocaleString()}</b> more for <b>FREE shipping</b></>
                ) : (
                  <b style={{ color: 'var(--badge-green)' }}>You have unlocked FREE shipping!</b>
                )}
              </p>
              <div style={{
                height: '6px', borderRadius: '3px',
                background: 'var(--bg-surface2)',
                overflow: 'hidden'
              }}>
                <motion.div
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', damping: 22, stiffness: 120 }}
                  style={{
                    height: '100%',
                    background: remaining > 0 ? 'var(--gradient-accent)' : 'var(--badge-green)',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>
          )
        })()}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', paddingTop: '80px' }}>
              <FiShoppingBag size={48} color="var(--text-faint)" style={{ opacity: 0.4 }} />
              <p style={{ color: 'var(--text-faint)', fontSize: '15px' }}>Your cart is empty</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); router.push('/shop') }}
                style={{
                  padding: '10px 24px',
                  background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                  border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(212,163,115,0.25)'
                }}>
                Browse Products
              </motion.button>
            </div>
          ) : (
            items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  background: 'var(--bg-surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px'
                }}>
                <div
                  onClick={() => { onClose(); router.push(`/product/${item.id}`) }}
                  style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0, cursor: 'pointer' }}>
                  <Image
                    src={item.image_url || '/placeholder.png'}
                    alt={item.name}
                    fill
                    sizes="72px"
                    style={{ objectFit: 'cover', borderRadius: '8px' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '2px', cursor: 'pointer'
                  }} onClick={() => { onClose(); router.push(`/product/${item.id}`) }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--accent)', marginBottom: '8px' }}>{item.category}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    {/* Qty controls */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden'
                    }}>
                      <button onClick={() => setQty(item.id, item.qty - 1)}
                        style={{ width: '28px', height: '28px', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', border: 'none', cursor: 'pointer' }}>−</button>
                      <span style={{ width: '32px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.qty}</span>
                      <button onClick={() => setQty(item.id, item.qty + 1)}
                        style={{ width: '28px', height: '28px', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '14px', border: 'none', cursor: 'pointer' }}>+</button>
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
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => remove(item.id)}
                      style={{
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text-faint)', borderRadius: '6px',
                        width: '28px', height: '28px',
                        cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                      <FiTrash2 size={12} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
                Subtotal ({totalQty} {totalQty === 1 ? 'item' : 'items'})
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>
                Rs. {total.toLocaleString()}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={async () => {
                let session = null
                if (supabase) {
                  const { data } = await supabase.auth.getSession()
                  session = data.session
                }
                onClose()
                router.push(session ? '/checkout' : '/auth/login?redirect=/checkout')
              }}
              style={{
                width: '100%', padding: '14px',
                background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                border: 'none', borderRadius: '10px',
                fontSize: '15px', fontWeight: '700',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 20px rgba(212,163,115,0.3)'
              }}>
              Proceed to Checkout <FiArrowRight size={16} />
            </motion.button>

            <button
              onClick={onClose}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent', color: 'var(--text-faint)',
                border: '1px solid var(--border)', borderRadius: '10px',
                fontSize: '13px', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s'
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-faint)' }}>
              Continue Shopping
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
