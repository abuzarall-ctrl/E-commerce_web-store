'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
  'Hyderabad', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Other'
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
  transition: 'border-color 0.2s'
}

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  marginBottom: '6px'
}

export default function CheckoutPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [user, setUser] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  })

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const map = {}
    for (const p of raw) {
      if (map[p.id]) map[p.id].qty += 1
      else map[p.id] = { ...p, qty: 1 }
    }
    setItems(Object.values(map))

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser(session.user)
    })
  }, [])

  const discounted = (item) =>
    item.discount ? item.price - (item.price * item.discount / 100) : item.price

  const subtotal = items.reduce((s, i) => s + Math.round(discounted(i)) * i.qty, 0)
  const totalItems = items.reduce((s, i) => s + i.qty, 0)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const focusBorder = (e) => { e.target.style.borderColor = 'var(--accent)' }
  const blurBorder = (e) => { e.target.style.borderColor = 'var(--border)' }

  const validate = () => {
    if (!form.name.trim()) return 'Full name is required'
    if (!form.phone.trim()) return 'Phone number is required'
    if (!/^(\+92|0)[0-9]{10}$/.test(form.phone.replace(/\s/g, '')))
      return 'Enter a valid Pakistani phone number (e.g. 03001234567)'
    if (!form.address.trim()) return 'Delivery address is required'
    if (!form.city) return 'Please select a city'
    if (items.length === 0) return 'Your cart is empty'
    return null
  }

  const handlePlaceOrder = async () => {
    const err = validate()
    if (err) { setError(err); return }

    setError('')
    setPlacing(true)

    const products = items.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: i.price,
      discount: i.discount,
      finalPrice: Math.round(discounted(i)),
      qty: i.qty,
      image_url: i.image_url
    }))

    const { data, error: dbErr } = await supabase.from('orders').insert({
      user_id: user?.id || null,
      products,
      total: subtotal,
      status: 'pending',
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim(),
      customer_address: form.address.trim(),
      customer_city: form.city,
      notes: form.notes.trim() || null
    }).select('id').single()

    if (dbErr) {
      setError('Failed to place order. Please try again.')
      setPlacing(false)
      return
    }

    localStorage.removeItem('cart')
    window.dispatchEvent(new Event('cartUpdated'))
    setOrderId(data.id)
    setSuccess(true)
    setPlacing(false)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px', textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '48px 40px',
            maxWidth: '480px',
            width: '100%'
          }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Order Placed!
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-faint)', lineHeight: '1.7', marginBottom: '8px' }}>
              Thank you for your order. We'll confirm via WhatsApp or call shortly.
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '28px' }}>
              Order ID: <span style={{ color: 'var(--accent)', fontWeight: '600', fontFamily: 'monospace' }}>
                {orderId?.slice(0, 8)?.toUpperCase()}
              </span>
            </p>

            <div style={{
              background: 'var(--bg-surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '28px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '4px' }}>Payment method</p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                💵 Cash on Delivery
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => router.push('/shop')}
                style={{
                  width: '100%', padding: '14px',
                  background: 'var(--accent)', color: 'var(--bg-primary)',
                  border: 'none', borderRadius: '10px',
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer'
                }}>
                Continue Shopping
              </button>
              <button
                onClick={() => router.push('/')}
                style={{
                  width: '100%', padding: '12px',
                  background: 'transparent', color: 'var(--text-faint)',
                  border: '1px solid var(--border)', borderRadius: '10px',
                  fontSize: '13px', cursor: 'pointer'
                }}>
                Back to Home
              </button>
            </div>
          </div>
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
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 24px'
        }}>
          <span style={{ fontSize: '48px' }}>🛒</span>
          <p style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '600' }}>Your cart is empty</p>
          <button
            onClick={() => router.push('/shop')}
            style={{
              padding: '12px 28px',
              background: 'var(--accent)', color: 'var(--bg-primary)',
              border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>
            Browse Products
          </button>
        </div>
        <Footer />
      </main>
    )
  }

  // ── Checkout form ───────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '40px 24px', flex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Checkout
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
            Fill in your delivery details below
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          alignItems: 'start'
        }}>

          {/* ── Left: Delivery Form ── */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Delivery Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Name */}
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmed Khan"
                  value={form.name}
                  onChange={set('name')}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  style={inputStyle}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Phone Number *</label>
                <input
                  type="tel"
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={set('phone')}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  style={inputStyle}
                />
              </div>

              {/* City */}
              <div>
                <label style={labelStyle}>City *</label>
                <select
                  value={form.city}
                  onChange={set('city')}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
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
                  value={form.address}
                  onChange={set('address')}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Order Notes <span style={{ color: 'var(--text-faint)', fontWeight: '400' }}>(optional)</span></label>
                <textarea
                  placeholder="Any special instructions..."
                  value={form.notes}
                  onChange={set('notes')}
                  onFocus={focusBorder}
                  onBlur={blurBorder}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Payment method badge */}
            <div style={{
              marginTop: '24px',
              background: 'var(--bg-surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>💵</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Cash on Delivery</p>
                <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Pay when your order arrives</p>
              </div>
              <span style={{
                marginLeft: 'auto',
                background: 'var(--badge-green)', color: 'var(--badge-green-text)',
                fontSize: '11px', fontWeight: '700',
                padding: '3px 8px', borderRadius: '20px'
              }}>Selected</span>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: '16px',
                background: 'rgba(226,75,74,0.1)',
                border: '1px solid rgba(226,75,74,0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#E24B4A'
              }}>
                {error}
              </div>
            )}

            {/* Place Order */}
            <button
              onClick={handlePlaceOrder}
              disabled={placing}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '16px',
                background: placing ? 'var(--bg-surface2)' : 'var(--accent)',
                color: placing ? 'var(--text-faint)' : 'var(--bg-primary)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: placing ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => { if (!placing) e.target.style.background = 'var(--accent-hover)' }}
              onMouseLeave={e => { if (!placing) e.target.style.background = 'var(--accent)' }}>
              {placing ? 'Placing Order...' : `Place Order • Rs. ${subtotal.toLocaleString()}`}
            </button>
          </div>

          {/* ── Right: Order Summary ── */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            position: 'sticky',
            top: '80px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
              Order Summary
              <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-faint)', marginLeft: '8px' }}>
                ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </span>
            </h2>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {items.map(item => {
                const unitPrice = Math.round(discounted(item))
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={item.image_url || '/placeholder.png'}
                        alt={item.name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <span style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: 'var(--accent)', color: 'var(--bg-primary)',
                        borderRadius: '50%', width: '20px', height: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: '700'
                      }}>{item.qty}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>{item.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--accent)' }}>{item.category}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>
                        Rs. {(unitPrice * item.qty).toLocaleString()}
                      </p>
                      {item.discount > 0 && (
                        <p style={{ fontSize: '11px', color: 'var(--text-faint)', textDecoration: 'line-through' }}>
                          Rs. {(item.price * item.qty).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--border)', marginBottom: '16px' }} />

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.some(i => i.discount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-faint)' }}>You save</span>
                  <span style={{ color: 'var(--badge-green)', fontWeight: '600' }}>
                    − Rs. {items.reduce((s, i) =>
                      s + (i.discount ? Math.round(i.price * i.discount / 100) * i.qty : 0), 0
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-faint)' }}>Delivery</span>
                <span style={{ color: 'var(--badge-green)', fontWeight: '600' }}>Free</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)' }}>
                  Rs. {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
