'use client'
import { Suspense, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { isAdminRole } from '@/lib/adminRoles'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton, { GoogleIcon } from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const created = searchParams.get('created') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (!supabase) { setError('Sign in is temporarily unavailable. Please try again later.'); return }
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

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (!supabase) { setError('Sign in is temporarily unavailable. Please try again later.'); return }
    setLoading(true)
    setError('')
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })

    if (loginError) {
      setError(loginError.message)
      setLoading(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect') || '/'
    router.push(isAdminRole(data.user?.app_metadata?.role) ? '/admin' : redirect)
    setLoading(false)
  }

  const onKeyDown = (event) => { if (event.key === 'Enter') handleLogin() }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

      <h1 className="auth-h1">Welcome back</h1>
      <p className="auth-sub">Sign in with your email and password</p>

      <div className="auth-fields">
        {created && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '12px 14px', borderRadius: '8px',
            background: 'rgba(47,127,117,0.1)', border: '1px solid rgba(47,127,117,0.35)',
            fontSize: '13px', color: 'var(--badge-green-text)'
          }}>
            <FiCheckCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            Password created successfully. Sign in with your new password.
          </div>
        )}

        <AuthInput
          id="login-email"
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
          id="login-password"
          label="Password"
          labelRight={
            <button
              type="button"
              className="auth-link"
              onClick={() => router.push('/auth/forgot-password')}>
              Forgot password?
            </button>
          }
          icon={FiLock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={onKeyDown}
          name="password"
          autoComplete="current-password"
          error={error}
          suffix={
            <button
              type="button"
              className="auth-input-suffix"
              onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          }
        />

        {error && (
          <div className="auth-err" role="alert">{error}</div>
        )}

        <AuthButton onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in...' : <><FiArrowRight size={15} /> Sign In</>}
        </AuthButton>
      </div>

      <div className="auth-divider"><span>or</span></div>

      <AuthButton variant="secondary" onClick={handleGoogleLogin} disabled={googleLoading}>
        {googleLoading
          ? <><span className="auth-btn-spinner" aria-hidden="true" /> Connecting to Google…</>
          : <><GoogleIcon /> Continue with Google</>}
      </AuthButton>

      <p className="auth-legal" style={{ marginTop: '24px', marginBottom: '0' }}>
        Don&apos;t have an account?{' '}
        <span
          className="auth-link"
          onClick={() => router.push('/auth/signup')}>
          Create one free
        </span>
      </p>
    </AuthLayout>
  )
}

function LoginFallback() {
  return (
    <AuthLayout>
      <p className="auth-sub">Loading sign in...</p>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
