'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCheckCircle, FiShoppingBag, FiArrowRight, FiHome,
  FiPhone, FiTruck, FiCreditCard, FiAlertCircle, FiCopy, FiCheck
} from 'react-icons/fi'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Other'
]

const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    short: 'COD',
    desc: 'Pay when your order arrives at your door',
    badge: 'Most Popular',
    color: '#CCD5AE',
    successNote: null
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    short: 'JazzCash',
    desc: 'Send payment to our JazzCash wallet',
    badge: null,
    color: '#CC0000',
    successNote: {
      title: 'Send Payment via JazzCash',
      number: '0300-0000000',
      account: 'AbuzarStore',
      instruction: 'Send the total amount to this JazzCash number, then WhatsApp us the screenshot to confirm your order.'
    }
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    short: 'Easypaisa',
    desc: 'Send payment to our Easypaisa account',
    badge: null,
    color: '#4AAD52',
    successNote: {
      title: 'Send Payment via Easypaisa',
      number: '0300-0000000',
      account: 'AbuzarStore',
      instruction: 'Send the total amount to this Easypaisa number, then WhatsApp us the transaction ID to confirm your order.'
    }
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    short: 'Bank',
    desc: 'Direct deposit to our bank account',
    badge: null,
    color: '#4A90D9',
    successNote: {
      title: 'Bank Transfer Details',
      bank: 'Meezan Bank',
      account: '0123456789012345',
      iban: 'PK00MEZN0001234567890123',
      instruction: 'Transfer the total amount to the account above, then WhatsApp us the receipt to confirm your order.'
    }
  }
]

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--bg-surface2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  fontFamily: 'inherit'
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginBottom: '6px'
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

// ── Copy helper ───────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{
        background: 'none', border: 'none', color: copied ? 'var(--badge-green)' : 'var(--text-faint)',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px',
        padding: '2px 6px', borderRadius: '4px', transition: 'color 0.2s'
      }}>
      {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </motion.button>
  )
}

// ── Success payment panel ─────────────────────────────────────────────────────
function PaymentInstructions({ method, total }) {
  const note = method.successNote
  if (!note) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      style={{
        background: 'var(--bg-surface2)', border: `1px solid ${method.color}44`,
        borderRadius: '12px', padding: '18px', marginBottom: '24px', textAlign: 'left'
      }}>
      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
        {note.title}
      </p>

      {method.id === 'bank' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Bank</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{note.bank}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Account Name</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{note.account}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Account No.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{note.account}</span>
              <CopyButton text={note.account} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>IBAN</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--accent)', fontFamily: 'monospace' }}>{note.iban}</span>
              <CopyButton text={note.iban} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Amount</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)' }}>Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Send to</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)', fontFamily: 'monospace' }}>{note.number}</span>
              <CopyButton text={note.number} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Account Name</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{note.account}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Amount</span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent)' }}>Rs. {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '14px', padding: '10px 12px',
        background: 'rgba(212,163,115,0.08)', borderRadius: '8px',
        fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6'
      }}>
        {note.instruction}
      </div>
    </motion.div>
  )
}

// ── Checkout Page ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', notes: '' })

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const map = {}
    for (const p of raw) {
      if (map[p.id]) map[p.id].qty += 1
      else map[p.id] = { ...p, qty: 1 }
    }
    setItems(Object.values(map))

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth/login?redirect=/checkout')
      } else {
        setUser(session.user)
        setAuthChecked(true)
      }
    })
  }, [])

  if (!authChecked) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
          Checking session...
        </div>
        <Footer />
      </main>
    )
  }

  const discounted = (item) =>
    item.discount ? item.price - (item.price * item.discount / 100) : item.price

  const subtotal = items.reduce((s, i) => s + Math.round(discounted(i)) * i.qty, 0)
  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const phoneDigits = form.phone.replace(/[^0-9]/g, '')
  const phoneError = phoneTouched && form.phone.length > 0 && phoneDigits.length !== 11

  const phoneInputStyle = {
    ...inputStyle,
    paddingLeft: '42px',
    ...(phoneError
      ? { border: '1px solid #E24B4A', boxShadow: '0 0 0 3px rgba(226,75,74,0.1)', background: 'rgba(226,75,74,0.04)' }
      : {}
    )
  }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required'
    if (!form.phone.trim()) return 'Phone number is required'
    if (phoneDigits.length !== 11) return 'Enter a valid 11-digit phone number (e.g. 03001234567)'
    if (!form.address.trim()) return 'Delivery address is required'
    if (!form.city) return 'Please select a city'
    if (items.length === 0) return 'Your cart is empty'
    return null
  }

  const handlePlaceOrder = async () => {
    setPhoneTouched(true)
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setPlacing(true)

    const products = items.map(i => ({
      id: i.id, name: i.name, category: i.category,
      price: i.price, discount: i.discount,
      finalPrice: Math.round(discounted(i)), qty: i.qty, image_url: i.image_url
    }))

    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod)
    const notesWithPayment = [
      form.notes.trim(),
      `Payment: ${selectedMethod?.name || paymentMethod}`
    ].filter(Boolean).join(' | ')

    const { data, error: dbErr } = await supabase.from('orders').insert({
      user_id: user?.id || null,
      products,
      total: subtotal,
      status: 'pending',
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim(),
      customer_address: form.address.trim(),
      customer_city: form.city,
      notes: notesWithPayment || null
    }).select('id').single()

    if (dbErr) {
      // Extract all possible error properties (Supabase errors have non-enumerable props)
      console.error('Order insert error:', {
        code: dbErr?.code,
        message: dbErr?.message,
        details: dbErr?.details,
        hint: dbErr?.hint,
        status: dbErr?.status,
        json: (() => { try { return JSON.stringify(dbErr) } catch (_) { return '[unstringifiable]' } })()
      })
      setError(dbErr?.message || 'Failed to place order. Please check console for details and try again.')
      setPlacing(false)
      return
    }

    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cartUpdated'))
    setOrderId(data.id)
    setSuccess(true)
    setPlacing(false)
  }

  const selectedPayment = PAYMENT_METHODS.find(m => m.id === paymentMethod)

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '24px', padding: '40px 36px',
              maxWidth: '500px', width: '100%', textAlign: 'center',
              boxShadow: '0 32px 80px rgba(0,0,0,0.4)'
            }}>

            <motion.div
              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}>
              <div style={{
                width: '76px', height: '76px', borderRadius: '50%',
                background: 'rgba(212,163,115,0.1)', border: '1px solid rgba(212,163,115,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
              }}>
                <FiCheckCircle size={38} color="var(--accent)" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Order Placed!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: '1.7', marginBottom: '6px' }}>
              Thank you! We'll confirm via WhatsApp or call shortly.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '24px' }}>
              Order ID:{' '}
              <span style={{ color: 'var(--accent)', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '1px' }}>
                {orderId?.slice(0, 8)?.toUpperCase()}
              </span>
            </motion.p>

            {/* Payment instructions (non-COD methods) */}
            <PaymentInstructions method={selectedPayment} total={subtotal} />

            {/* COD summary */}
            {paymentMethod === 'cod' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                style={{
                  background: 'var(--bg-surface2)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px', marginBottom: '24px',
                  display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left'
                }}>
                <FiTruck size={20} color="var(--accent)" />
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '2px' }}>Payment method</p>
                  <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Cash on Delivery</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Pay Rs. {subtotal.toLocaleString()} when order arrives</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/orders')}
                style={{
                  width: '100%', padding: '13px',
                  background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 20px rgba(212,163,115,0.3)'
                }}>
                <FiCheckCircle size={15} /> View My Orders
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/shop')}
                style={{
                  width: '100%', padding: '12px',
                  background: 'transparent', color: 'var(--text-faint)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '13px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  transition: 'border-color 0.2s, color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-faint)' }}>
                <FiShoppingBag size={14} /> Continue Shopping
              </motion.button>
              <button
                onClick={() => router.push('/')}
                style={{
                  width: '100%', padding: '11px',
                  background: 'transparent', color: 'var(--text-faint)',
                  border: 'none', borderRadius: '10px', fontSize: '12px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}>
                <FiHome size={13} /> Back to Home
              </button>
            </motion.div>
          </motion.div>
        </div>
        <Footer />
      </main>
    )
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 24px' }}>
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 0.35 }} transition={{ duration: 0.5 }}>
            <FiShoppingBag size={56} color="var(--text-faint)" />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '600' }}>
            Your cart is empty
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/shop')}
            style={{
              padding: '12px 28px', background: 'var(--gradient-accent)',
              color: 'var(--bg-primary)', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(212,163,115,0.25)'
            }}>
            Browse Products
          </motion.button>
        </div>
        <Footer />
      </main>
    )
  }

  // ── Checkout form ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
          .order-summary-sticky { position: relative !important; top: auto !important; }
          .payment-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .checkout-form-pad { padding: 18px !important; }
          .checkout-heading { font-size: 22px !important; }
          .payment-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
        }
      `}</style>

      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '40px 24px', flex: 1 }}>

          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <h1 className="checkout-heading" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Checkout
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '32px' }}>
              Fill in your delivery details below
            </p>
          </motion.div>

          <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '32px', alignItems: 'start' }}>

            {/* ── Form Panel ──────────────────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
              className="checkout-form-pad"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px' }}>

              <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Delivery Information
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>

                {/* Full Name */}
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text" placeholder="e.g. Ahmed Khan" value={form.name}
                    onChange={set('name')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    style={inputStyle}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>
                    Phone Number *
                    {phoneTouched && form.phone.length > 0 && (
                      <span style={{
                        marginLeft: '8px', fontSize: '11px', fontWeight: '500',
                        color: phoneError ? '#E24B4A' : 'var(--badge-green)'
                      }}>
                        {phoneDigits.length}/11 digits
                      </span>
                    )}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiPhone size={15} style={{
                      position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                      color: phoneError ? '#E24B4A' : 'var(--text-faint)', pointerEvents: 'none', transition: 'color 0.2s'
                    }} />
                    <input
                      type="tel" placeholder="03001234567" value={form.phone}
                      onChange={e => {
                        setForm(f => ({ ...f, phone: e.target.value }))
                        if (!phoneTouched && e.target.value.length > 0) setPhoneTouched(true)
                      }}
                      onFocus={e => e.target.style.borderColor = phoneError ? '#E24B4A' : 'var(--accent)'}
                      onBlur={e => { setPhoneTouched(true); e.target.style.borderColor = phoneError ? '#E24B4A' : 'var(--border)' }}
                      style={phoneInputStyle}
                    />
                  </div>
                  <AnimatePresence>
                    {phoneError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ fontSize: '12px', color: '#E24B4A', fontWeight: '500', marginTop: '5px' }}>
                        Phone must be exactly 11 digits (e.g. 03001234567)
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* City */}
                <div>
                  <label style={labelStyle}>City *</label>
                  <select
                    value={form.city} onChange={set('city')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select your city</option>
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label style={labelStyle}>Delivery Address *</label>
                  <textarea
                    placeholder="House/flat number, street, area..."
                    value={form.address} onChange={set('address')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>
                    Order Notes <span style={{ color: 'var(--text-faint)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="Any special instructions..."
                    value={form.notes} onChange={set('notes')}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    rows={2} style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* ── Payment Method ───────────────────────────────────────── */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Payment Method
                </h2>

                <div className="payment-grid" style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px'
                }}>
                  {PAYMENT_METHODS.map(method => {
                    const selected = paymentMethod === method.id
                    return (
                      <motion.div
                        key={method.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setPaymentMethod(method.id)}
                        style={{
                          border: `1.5px solid ${selected ? method.color : 'var(--border)'}`,
                          borderRadius: '12px',
                          padding: '14px 12px',
                          cursor: 'pointer',
                          background: selected ? `${method.color}11` : 'var(--bg-surface2)',
                          transition: 'all 0.2s',
                          position: 'relative',
                          boxShadow: selected ? `0 0 0 1px ${method.color}44` : 'none'
                        }}>
                        {method.badge && (
                          <span style={{
                            position: 'absolute', top: '-8px', left: '10px',
                            background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                            fontSize: '9px', fontWeight: '800', padding: '2px 7px',
                            borderRadius: '10px', letterSpacing: '0.5px', textTransform: 'uppercase'
                          }}>
                            {method.badge}
                          </span>
                        )}

                        {/* Radio indicator */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                            border: `2px solid ${selected ? method.color : 'var(--text-faint)'}`,
                            background: selected ? method.color : 'transparent',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {selected && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <div>
                            <p style={{
                              fontSize: '13px', fontWeight: '700',
                              color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
                              marginBottom: '3px', lineHeight: 1.2
                            }}>
                              {method.name}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.4 }}>
                              {method.desc}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Non-COD notice */}
                {paymentMethod !== 'cod' && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      marginTop: '12px', padding: '10px 12px',
                      background: 'rgba(212,163,115,0.07)', border: '1px solid rgba(212,163,115,0.2)',
                      borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start'
                    }}>
                    <FiAlertCircle size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      Payment instructions will be shown after you place the order.
                      Your order will be processed once payment is confirmed.
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    style={{
                      marginBottom: '16px', background: 'rgba(226,75,74,0.1)',
                      border: '1px solid rgba(226,75,74,0.3)', borderRadius: '8px',
                      padding: '12px 16px', fontSize: '13px', color: '#E24B4A',
                      display: 'flex', gap: '8px', alignItems: 'flex-start'
                    }}>
                    <FiAlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Place Order button */}
              <motion.button
                whileHover={{ scale: placing ? 1 : 1.02, y: placing ? 0 : -1 }}
                whileTap={{ scale: placing ? 1 : 0.97 }}
                onClick={handlePlaceOrder}
                disabled={placing}
                style={{
                  width: '100%', padding: '16px',
                  background: placing ? 'var(--bg-surface2)' : 'var(--gradient-accent)',
                  color: placing ? 'var(--text-faint)' : 'var(--bg-primary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '16px', fontWeight: '700',
                  cursor: placing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: placing ? 'none' : '0 4px 20px rgba(212,163,115,0.3)',
                  transition: 'all 0.3s'
                }}>
                {placing ? (
                  <span style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>◌</span>
                    Placing Order...
                  </span>
                ) : (
                  <><FiArrowRight size={16} /> Place Order · Rs. {subtotal.toLocaleString()}</>
                )}
              </motion.button>
            </motion.div>

            {/* ── Order Summary Panel ──────────────────────────────────────── */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}
              className="order-summary-sticky"
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '24px',
                position: 'sticky', top: '80px'
              }}>
              <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Order Summary
                <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-faint)', marginLeft: '8px', textTransform: 'none', letterSpacing: 'normal' }}>
                  ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                {items.map(item => {
                  const unitPrice = Math.round(discounted(item))
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                          src={item.image_url || '/placeholder.png'} alt={item.name}
                          style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                        <span style={{
                          position: 'absolute', top: '-5px', right: '-5px',
                          background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                          borderRadius: '50%', width: '18px', height: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: '800'
                        }}>{item.qty}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>{item.category}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>
                          Rs. {(unitPrice * item.qty).toLocaleString()}
                        </p>
                        {item.discount > 0 && (
                          <p style={{ fontSize: '10px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                            Rs. {(item.price * item.qty).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                {items.some(i => i.discount > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-faint)' }}>You save</span>
                    <span style={{ color: 'var(--badge-green)', fontWeight: '600' }}>
                      − Rs. {items.reduce((s, i) => s + (i.discount ? Math.round(i.price * i.discount / 100) * i.qty : 0), 0).toLocaleString()}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Delivery</span>
                  <span style={{ color: 'var(--badge-green)', fontWeight: '600' }}>Free</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--text-faint)' }}>Payment</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{selectedPayment?.name}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Total</span>
                  <span style={{
                    fontSize: '22px', fontWeight: '800',
                    background: 'var(--gradient-accent)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                  }}>
                    Rs. {subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <Footer />
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
