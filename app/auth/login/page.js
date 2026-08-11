'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton, { GoogleIcon } from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    setGoogleLoading(false)
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect') || '/'
      if (data.user?.app_metadata?.role === 'admin') {
        router.push('/admin')
      } else {
        router.push(redirect)
      }
    }
    setLoading(false)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

      <h1 className="auth-h1">Welcome back</h1>
      <p className="auth-sub">Sign in to your AbuzarStore account</p>

      <div className="auth-fields">
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
          placeholder="••••••••"
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
              onClick={() => setShowPassword(s => !s)}
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
        <GoogleIcon /> {googleLoading ? 'Redirecting...' : 'Continue with Google'}
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