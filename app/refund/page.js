'use client'

import { Suspense, useState } from 'react'
import { motion } from 'framer-motion'
import { FiRotateCcw, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import { useRouter, useSearchParams } from 'next/navigation'

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--bg-surface2)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit',
}

function RefundContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState(searchParams.get('order') || '')
  const [contact, setContact] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!orderId.trim()) { setError('Enter the Order ID from your confirmation.'); return }
    if (!contact.trim()) { setError('Enter the email or phone number used on the order.'); return }
    if (!reason.trim()) { setError('Tell us what went wrong with the item.'); return }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim(), contact: contact.trim(), reason: reason.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(result.error || 'Could not submit your refund request.')
        setLoading(false)
        return
      }
      setSuccess(true)
      setLoading(false)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .refund-inner { padding: 48px 24px; }
        @media (max-width: 768px) {
          .refund-inner { padding: 32px 18px !important; }
          .refund-title { font-size: 25px !important; }
          .refund-form { padding: 20px !important; }
        }
        @media (max-width: 420px) {
          .refund-inner { padding: 24px 14px !important; }
          .refund-form { padding: 16px !important; }
          .refund-success { padding: 34px 18px !important; }
        }
      `}</style>
      <Navbar />

      <div className="refund-inner" style={{ maxWidth: '720px', margin: '0 auto', width: '100%', padding: '48px 24px', flex: 1 }}>
        {success ? (
          <motion.div
            className="refund-success"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '16px', padding: '48px 28px', textAlign: 'center'
            }}>
            <FiCheckCircle size={44} color="var(--accent)" />
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '18px 0 8px' }}>
              Refund request received
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: '1.7', maxWidth: '460px', margin: '0 auto 28px' }}>
              Our team will review your order and contact you using the email or phone number you provided.
              If the item is confirmed broken, the refund will be processed manually.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px', border: 'none', borderRadius: '8px',
                background: 'var(--gradient-accent)', color: 'var(--bg-primary)',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer'
              }}>
              Back to store <FiArrowRight style={{ verticalAlign: 'middle', marginLeft: '4px' }} />
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <p style={{ fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: '700', marginBottom: '8px' }}>
                Customer support
              </p>
              <h1 className="refund-title" style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Refund request
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', lineHeight: '1.7', marginBottom: '28px' }}>
                Received a broken or damaged item? Send us the details and our team will verify the issue
                and handle the refund manually. Refunds are available for delivered orders only.
              </p>
            </motion.div>

            <motion.form
              className="refund-form"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px'
              }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Order ID *
                </label>
                <input
                  value={orderId}
                  onChange={event => setOrderId(event.target.value)}
                  placeholder="e.g. A1B2C3D4"
                  style={inputStyle}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                  You can find this on your order confirmation screen or in your account.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Email or phone used on the order *
                </label>
                <input
                  value={contact}
                  onChange={event => setContact(event.target.value)}
                  placeholder="you@example.com or 03001234567"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  What went wrong? *
                </label>
                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  placeholder="Describe the broken or damaged item, and the condition it arrived in..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <div style={{
                  display: 'flex', gap: '8px', alignItems: 'flex-start',
                  padding: '12px 14px', borderRadius: '8px',
                  background: 'rgba(226,75,74,0.1)', border: '1px solid rgba(226,75,74,0.3)',
                  fontSize: '13px', color: '#E24B4A'
                }}>
                  <FiAlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px', border: 'none', borderRadius: '9px',
                  background: loading ? 'var(--bg-surface2)' : 'var(--gradient-accent)',
                  color: loading ? 'var(--text-faint)' : 'var(--bg-primary)',
                  fontSize: '15px', fontWeight: '700', cursor: loading ? 'wait' : 'pointer'
                }}>
                {loading ? 'Submitting...' : <><FiRotateCcw size={15} /> Submit Refund Request</>}
              </button>
            </motion.form>
          </>
        )}
      </div>

      <Footer />
    </main>
  )
}

function RefundFallback() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
      Loading refund form...
    </main>
  )
}

export default function RefundPage() {
  return (
    <Suspense fallback={<RefundFallback />}>
      <RefundContent />
    </Suspense>
  )
}
