'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiPackage, FiClock, FiCheckCircle, FiCheck, FiTruck, FiXCircle, FiShoppingBag, FiRotateCcw, FiAlertCircle, FiDownload } from 'react-icons/fi'
import Image from 'next/image'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { getOrderDetails } from '@/lib/orderPayload'
import { appendCartItem } from '@/lib/cartStorage'

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    icon: FiClock,       bg: 'rgba(250,237,205,0.15)', color: '#FAEDCD', border: 'rgba(250,237,205,0.3)' },
  confirmed:  { label: 'Confirmed',  icon: FiCheckCircle, bg: 'rgba(204,213,174,0.15)', color: '#CCD5AE', border: 'rgba(204,213,174,0.3)' },
  shipped:    { label: 'Shipped',    icon: FiTruck,       bg: 'rgba(147,197,253,0.15)', color: '#93C5FD', border: 'rgba(147,197,253,0.3)' },
  delivered:  { label: 'Delivered',  icon: FiCheckCircle, bg: 'rgba(134,239,172,0.15)', color: '#86EFAC', border: 'rgba(134,239,172,0.3)' },
  cancelled:  { label: 'Cancelled',  icon: FiXCircle,     bg: 'rgba(226,75,74,0.1)',   color: '#E24B4A', border: 'rgba(226,75,74,0.25)' },
  refunded:   { label: 'Refunded',   icon: FiXCircle,     bg: 'rgba(196,181,253,0.12)', color: '#C4B5FD', border: 'rgba(196,181,253,0.3)' },
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

const ORDER_FLOW = [
  { key: 'pending', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
]

function OrderTimeline({ status }) {
  const activeIndex = ORDER_FLOW.findIndex(step => step.key === status)
  if (activeIndex < 0) return null

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
      {ORDER_FLOW.map((step, index) => {
        const done = index <= activeIndex
        const lineDone = index < activeIndex
        return (
          <div key={step.key} style={{ flex: index < ORDER_FLOW.length - 1 ? 1 : '0 0 auto', display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '58px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--accent)' : 'var(--bg-surface)',
                border: `1px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                color: done ? 'var(--bg-primary)' : 'var(--text-faint)',
                fontSize: '10px', fontWeight: '800'
              }}>
                {done ? <FiCheck size={12} /> : index + 1}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: done ? '700' : '500',
                color: done ? 'var(--text-muted)' : 'var(--text-faint)',
                textAlign: 'center', whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
            {index < ORDER_FLOW.length - 1 && (
              <div style={{
                flex: 1, height: '2px', marginTop: '11px', marginLeft: '4px', marginRight: '4px',
                background: lineDone ? 'var(--accent)' : 'var(--border)'
              }} />
            )}
          </div>
        )
      })}
    </div>
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
  const [refundFor, setRefundFor] = useState(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundBusy, setRefundBusy] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [receiptBusy, setReceiptBusy] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (!supabase) { setOrders([]); setLoading(false); return }
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
  }, [router])

  const submitRefund = async (orderId) => {
    if (!refundReason.trim()) { setRefundError('Please describe what went wrong with the order.'); return }
    setRefundBusy(true)
    setRefundError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/refund-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ orderId, reason: refundReason }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setRefundError(result.error || 'Could not submit your refund request.')
        setRefundBusy(false)
        return
      }
      setOrders(list => list.map(order => order.id === orderId
        ? { ...order, refund_status: 'requested', refund_reason: refundReason }
        : order))
      setRefundFor(null)
      setRefundReason('')
      setRefundBusy(false)
    } catch {
      setRefundError('Network error. Please try again.')
      setRefundBusy(false)
    }
  }

  const downloadReceipt = async (order) => {
    if (receiptBusy) return
    setReceiptBusy(order.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login?redirect=/orders'); return }
      const response = await fetch(`/api/orders/receipt?id=${encodeURIComponent(order.id)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.error || 'Could not download this receipt.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${order.id.slice(0, 8).toUpperCase()}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      window.dispatchEvent(new CustomEvent('appToast', {
        detail: { message: err.message || 'Could not download this receipt.' }
      }))
    } finally {
      setReceiptBusy(null)
    }
  }

  const buyAgain = (order) => {
    const { items } = getOrderDetails(order)
    if (!items.length) return
    for (const item of items) appendCartItem(item, Number(item.qty) || 1)
    window.dispatchEvent(new CustomEvent('openCart'))
    window.dispatchEvent(new CustomEvent('appToast', {
      detail: { message: `${items.length} item${items.length === 1 ? '' : 's'} from order #${order.id.slice(0, 8).toUpperCase()} added to cart` }
    }))
  }

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
              const { items: products, delivery, notes } = getOrderDetails(order)
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
                        {order.refund_status === 'requested' && (
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                            color: '#FAEDCD', background: 'rgba(250,237,205,0.12)', border: '1px solid rgba(250,237,205,0.3)'
                          }}>Refund requested</span>
                        )}
                        {order.refund_status === 'rejected' && (
                          <span style={{
                            fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                            color: '#E24B4A', background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.25)'
                          }}>Refund rejected</span>
                        )}
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

                      <OrderTimeline status={order.status} />

                      {/* Delivery info */}
                      {delivery.name && (
                        <div style={{
                          background: 'var(--bg-surface)', border: '1px solid var(--border)',
                          borderRadius: '10px', padding: '14px 16px', marginBottom: '16px'
                        }}>
                          <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                            Delivery Details
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{delivery.name}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{delivery.phone}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{delivery.address}{delivery.city ? `, ${delivery.city}` : ''}</p>
                            {notes && <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px', fontStyle: 'italic' }}>&quot;{notes}&quot;</p>}
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
                              <div style={{ position: 'relative', width: '46px', height: '46px', flexShrink: 0 }}>
                                <Image src={item.image_url} alt={item.name} fill sizes="46px" style={{ objectFit: 'cover', borderRadius: '6px' }} />
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</p>
                              <p style={{ fontSize: '11px', color: 'var(--accent)' }}>{item.category} · Qty: {item.qty}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>
                                Rs. {((item.finalPrice ?? item.price) * (item.qty || 1)).toLocaleString()}
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

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
                        <button
                          onClick={() => downloadReceipt(order)}
                          disabled={receiptBusy === order.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                            padding: '10px 16px', borderRadius: '8px',
                            background: 'var(--bg-surface)', color: 'var(--text-muted)',
                            border: '1px solid var(--border)', fontSize: '13px',
                            fontWeight: '600', cursor: receiptBusy === order.id ? 'wait' : 'pointer'
                          }}>
                          <FiDownload size={14} color="var(--accent)" />
                          {receiptBusy === order.id ? 'Preparing receipt...' : 'Download receipt (PDF)'}
                        </button>
                        {products.length > 0 && (
                          <button
                            onClick={() => buyAgain(order)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '7px',
                              padding: '10px 16px', borderRadius: '8px',
                              background: 'var(--bg-surface)', color: 'var(--text-muted)',
                              border: '1px solid var(--border)', fontSize: '13px',
                              fontWeight: '600', cursor: 'pointer'
                            }}>
                            <FiShoppingBag size={14} color="var(--accent)" /> Buy again
                          </button>
                        )}
                      </div>

                      {/* Refund request */}
                      {order.status === 'delivered' && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                          {order.refund_status === 'requested' ? (
                            <div style={{
                              display: 'flex', gap: '10px', alignItems: 'flex-start',
                              padding: '12px 14px', borderRadius: '10px',
                              background: 'rgba(250,237,205,0.08)', border: '1px solid rgba(250,237,205,0.25)'
                            }}>
                              <FiClock size={16} color="#FAEDCD" style={{ flexShrink: 0, marginTop: '1px' }} />
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Refund request under review</p>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.6' }}>
                                  Our team will contact you after checking the issue. You submitted: &quot;{order.refund_reason}&quot;
                                </p>
                              </div>
                            </div>
                          ) : order.refund_status === 'approved' ? (
                            <div style={{
                              display: 'flex', gap: '10px', alignItems: 'center',
                              padding: '12px 14px', borderRadius: '10px',
                              background: 'rgba(196,181,253,0.1)', border: '1px solid rgba(196,181,253,0.3)'
                            }}>
                              <FiCheckCircle size={16} color="#C4B5FD" />
                              <p style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Your refund has been approved.</p>
                            </div>
                          ) : (
                            <>
                              {order.refund_status === 'rejected' && (
                                <div style={{
                                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                                  padding: '12px 14px', borderRadius: '10px', marginBottom: '12px',
                                  background: 'rgba(226,75,74,0.08)', border: '1px solid rgba(226,75,74,0.25)'
                                }}>
                                  <FiAlertCircle size={16} color="#E24B4A" style={{ flexShrink: 0, marginTop: '1px' }} />
                                  <div>
                                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Refund request rejected</p>
                                    {order.refund_note && (
                                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>{order.refund_note}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {refundFor === order.id ? (
                                <div>
                                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    What went wrong?
                                  </label>
                                  <textarea
                                    value={refundReason}
                                    onChange={event => setRefundReason(event.target.value)}
                                    placeholder="Tell us about the broken or damaged item..."
                                    rows={3}
                                    style={{
                                      width: '100%', padding: '11px 14px', borderRadius: '8px',
                                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                      color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'inherit',
                                      outline: 'none', resize: 'vertical'
                                    }}
                                  />
                                  {refundError && (
                                    <p style={{ fontSize: '12px', color: '#E24B4A', marginTop: '6px' }}>{refundError}</p>
                                  )}
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                      onClick={() => submitRefund(order.id)}
                                      disabled={refundBusy}
                                      style={{
                                        padding: '10px 18px', borderRadius: '8px', border: 'none',
                                        background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                                        fontSize: '13px', fontWeight: '700', cursor: refundBusy ? 'wait' : 'pointer'
                                      }}>
                                      {refundBusy ? 'Submitting...' : 'Submit Refund Request'}
                                    </button>
                                    <button
                                      onClick={() => { setRefundFor(null); setRefundReason(''); setRefundError('') }}
                                      style={{
                                        padding: '10px 18px', borderRadius: '8px',
                                        background: 'transparent', color: 'var(--text-muted)',
                                        border: '1px solid var(--border)', fontSize: '13px', cursor: 'pointer'
                                      }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setRefundFor(order.id); setRefundError(''); setRefundReason('') }}
                                  style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    padding: '10px 16px', borderRadius: '8px',
                                    background: 'transparent', color: 'var(--text-muted)',
                                    border: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                                  }}>
                                  <FiRotateCcw size={14} /> Report a problem / Request refund
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
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
