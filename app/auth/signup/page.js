'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton, { GoogleIcon } from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleGoogleLogin = async () => {
    if (!supabase) { setError('Sign up is temporarily unavailable. Please try again later.'); return }
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
    // On success Supabase redirects the browser, so the button stays disabled.
  }

  const handleSignup = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!supabase) { setError('Sign up is temporarily unavailable. Please try again later.'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
    } else {
      await supabase.from('users').insert([{ id: data.user.id, email: data.user.email, role: 'customer' }])
      setDone(true)
    }
    setLoading(false)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleSignup() }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['#EFE8DA', '#C0503E', '#A9773F', '#7E9158'][strength]
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]

  if (done) {
    return (
      <AuthLayout>
        <div className="auth-success">
          <div className="auth-success-icon">
            <FiCheckCircle size={34} />
          </div>
          <h2>Account Created!</h2>
          <p>Check your email to confirm your account,<br />then sign in to start shopping.</p>
          <div style={{ height: '22px' }} />
          <AuthButton onClick={() => router.push('/auth/login')}>
            <FiArrowRight size={15} /> Go to Sign In
          </AuthButton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

      <h1 className="auth-h1">Create your account</h1>
      <p className="auth-sub">Join AbuzarStore today</p>

      <div className="auth-fields">
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

        <div>
          <AuthInput
            id="signup-password"
            label="Password"
            icon={FiLock}
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            name="password"
            autoComplete="new-password"
            error={error}
            suffix={
              <button
                type="button"
                className="auth-input-suffix"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
          />
          {password.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div className="auth-strength">
                {[1, 2, 3].map(n => (
                  <span key={n} style={{ background: strength >= n ? strengthColor : undefined }} />
                ))}
              </div>
              <span className="auth-strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="auth-err" role="alert">{error}</div>
        )}

        <AuthButton onClick={handleSignup} disabled={loading}>
          {loading ? 'Creating account...' : <><FiArrowRight size={15} /> Create Account</>}
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
        <span
          className="auth-link"
          onClick={() => router.push('/auth/login')}>
          Sign in
        </span>
      </p>
    </AuthLayout>
  )
}