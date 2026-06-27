'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiPackage, FiClock, FiCheckCircle, FiTruck, FiXCircle, FiShoppingBag } from 'react-icons/fi'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    icon: FiClock,       bg: 'rgba(250,237,205,0.15)', color: '#FAEDCD', border: 'rgba(250,237,205,0.3)' },
  confirmed:  { label: 'Confirmed',  icon: FiCheckCircle, bg: 'rgba(204,213,174,0.15)', color: '#CCD5AE', border: 'rgba(204,213,174,0.3)' },
  shipped:    { label: 'Shipped',    icon: FiTruck,       bg: 'rgba(147,197,253,0.15)', color: '#93C5FD', border: 'rgba(147,197,253,0.3)' },
  delivered:  { label: 'Delivered',  icon: FiCheckCircle, bg: 'rgba(134,239,172,0.15)', color: '#86EFAC', border: 'rgba(134,239,172,0.3)' },
  cancelled:  { label: 'Cancelled',  icon: FiXCircle,     bg: 'rgba(226,75,74,0.1)',   color: '#E24B4A', border: 'rgba(226,75,74,0.25)' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`
    }}>
      <Icon size={11} /> {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login?redirect=/orders'); return }
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
          Loading orders...
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '40px 24px', flex: 1 }}>

        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>My Orders</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '32px' }}>
            {orders.length === 0 ? 'No orders yet' : `${orders.length} order${orders.length > 1 ? 's' : ''} placed`}
          </p>
        </motion.div>

        {orders.length === 0 ? (
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '64px 24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center'
            }}>
            <FiShoppingBag size={48} color="var(--text-faint)" style={{ opacity: 0.4 }} />
            <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>No orders yet</p>
            <p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>Start shopping and your orders will appear here.</p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/shop')}
              style={{
                marginTop: '8px', padding: '12px 28px',
                background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(212,163,115,0.25)'
              }}>
              Browse Products
            </motion.button>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map((order, i) => {
              const isOpen = expanded === order.id
              const products = Array.isArray(order.products) ? order.products : []
              return (
                <motion.div
                  key={order.id}
                  variants={fadeUp} initial="hidden" animate="visible"
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '14px', overflow: 'hidden'
                  }}>

                  {/* Order header */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : order.id)}
                    style={{
                      padding: '20px 24px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
                    }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'var(--bg-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FiPackage size={18} color="var(--accent)" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>
                          #{order.id?.slice(0, 8)?.toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '3px' }}>
                        {formatDate(order.created_at)} · {products.length} item{products.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
                        Rs. {order.total?.toLocaleString()}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {isOpen ? 'Tap to collapse ▲' : 'Tap for details ▼'}
                      </p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '20px 24px', background: 'var(--bg-surface2)' }}>

                      {/* Delivery info */}
                      {order.customer_name && (
                        <div style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          borderRadius: '10px', padding: '14px 16px', marginBottom: '16px'
                        }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                            Delivery Details
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{order.customer_name}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{order.customer_phone}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}</p>
                            {order.notes && <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px', fontStyle: 'italic' }}>"{order.notes}"</p>}
                          </div>
                        </div>
                      )}

                      {/* Products */}
                      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                        Items Ordered
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {products.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {item.image_url && (
                              <img src={item.image_url} alt={item.name}
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</p>
                              <p style={{ fontSize: '11px', color: 'var(--accent)' }}>{item.category} · Qty: {item.qty}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>
                                Rs. {(item.finalPrice * item.qty).toLocaleString()}
                              </p>
                              {item.discount > 0 && (
                                <p style={{ fontSize: '11px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                                  Rs. {(item.price * item.qty).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total row */}
                      <div style={{
                        borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Total Paid</span>
                        <span style={{
                          fontSize: '20px', fontWeight: '800',
                          background: 'var(--gradient-accent)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>Rs. {order.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
