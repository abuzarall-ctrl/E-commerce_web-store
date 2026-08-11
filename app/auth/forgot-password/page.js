'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiMail, FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) { setError('Please enter your email address'); return }
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleSend() }

  if (sent) {
    return (
      <AuthLayout>
        <button className="auth-back" onClick={() => router.push('/auth/login')}>
          <FiArrowLeft size={14} /> Back to sign in
        </button>

        <div className="auth-success">
          <div className="auth-success-icon">
            <FiCheckCircle size={32} />
          </div>
          <h2>Check your inbox</h2>
          <p>We sent a password reset link to</p>
          <p className="auth-email">{email}</p>
          <p className="auth-meta">
            Click the link in the email to set a new password. Check your spam
            folder if it doesn&apos;t arrive within a minute.
          </p>
          <AuthButton onClick={() => router.push('/auth/login')}>
            <FiArrowRight size={15} /> Back to Sign In
          </AuthButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/auth/login')}>
        <FiArrowLeft size={14} /> Back to sign in
      </button>

      <h1 className="auth-h1">Forgot password?</h1>
      <p className="auth-sub">Enter your email and we&apos;ll send you a link to reset your password.</p>

      <div className="auth-fields">
        <AuthInput
          id="forgot-email"
          label="Email Address"
          icon={FiMail}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={onKeyDown}
          name="email"
          autoComplete="email"
          error={error}
        />

        {error && (
          <div className="auth-err" role="alert">{error}</div>
        )}

        <AuthButton onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </AuthButton>
      </div>
    </AuthLayout>
  )
}