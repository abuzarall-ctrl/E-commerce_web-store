'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiMail, FiUser, FiPhone, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton, { GoogleIcon } from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (!supabase) { setError('Sign up is temporarily unavailable. Please try again later.'); return }
    setError('')
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  const handleSendCode = async () => {
    if (!name.trim()) { setError('Please enter your full name'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Please enter a valid email address'); return }
    if (phone.replace(/\D/g, '').length < 10) { setError('Please enter a valid phone number'); return }
    if (!supabase) { setError('Sign up is temporarily unavailable. Please try again later.'); return }

    setLoading(true)
    setError('')
    const normalizedEmail = email.trim().toLowerCase()

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
        data: { full_name: name.trim(), phone: phone.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (otpError) {
      setError(otpError.message || 'Could not send the verification code. Please try again.')
      return
    }

    router.push(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`)
  }

  const onKeyDown = (event) => { if (event.key === 'Enter') handleSendCode() }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

      <h1 className="auth-h1">Create your account</h1>
      <p className="auth-sub">Verify your email, then create a password</p>

      <div className="auth-fields">
        <AuthInput
          id="signup-name"
          label="Full Name"
          icon={FiUser}
          type="text"
          placeholder="e.g. Ahmed Khan"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={onKeyDown}
          name="name"
          autoComplete="name"
          error={error}
        />

        <AuthInput
          id="signup-email"
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

        <AuthInput
          id="signup-phone"
          label="Phone Number"
          icon={FiPhone}
          type="tel"
          placeholder="03001234567"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={onKeyDown}
          name="phone"
          autoComplete="tel"
          error={error}
        />

        {error && <div className="auth-err" role="alert">{error}</div>}

        <AuthButton onClick={handleSendCode} disabled={loading}>
          {loading ? 'Sending code...' : <><FiMail size={15} /> Send Verification Code</>}
        </AuthButton>
      </div>

      <div className="auth-divider"><span>or</span></div>

      <AuthButton variant="secondary" onClick={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading
          ? <><span className="auth-btn-spinner" aria-hidden="true" /> Connecting to Google…</>
          : <><GoogleIcon /> Continue with Google</>}
      </AuthButton>

      <p className="auth-legal" style={{ marginTop: '24px', marginBottom: '0' }}>
        Already have an account?{' '}
        <span className="auth-link" onClick={() => router.push('/auth/login')}>
          Sign in
        </span>
      </p>
    </AuthLayout>
  )
}
