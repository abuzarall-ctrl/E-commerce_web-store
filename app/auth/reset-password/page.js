'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)  // session exchanged and ready

  useEffect(() => {
    const init = async () => {
      // Exchange the reset code for a session
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { setReady(true); return }
      }

      // Fallback: check if already in a recovery session (implicit flow)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setReady(true); return }

      // Listen for PASSWORD_RECOVERY event (Supabase sends this after redirect)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          subscription.unsubscribe()
          setReady(true)
        }
      })
    }
    init()
  }, [])

  const handleReset = async () => {
    if (!password) { setError('Please enter a new password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    setTimeout(() => router.push('/auth/login'), 3000)
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleReset() }

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColor = ['#EFE8DA', '#C0503E', '#A9773F', '#7E9158'][strength]
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength]

  if (done) {
    return (
      <AuthLayout>
        <div className="auth-success">
          <div className="auth-success-icon">
            <FiCheckCircle size={32} />
          </div>
          <h2>Password updated!</h2>
          <p>Your password has been changed.<br />Redirecting you to sign in...</p>
        </div>
      </AuthLayout>
    )
  }

  if (!ready) {
    return (
      <AuthLayout>
        <div className="auth-center" style={{ minHeight: '40vh' }}>
          <div className="auth-spinner" />
          <p className="auth-spinner-text">Verifying reset link...</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="auth-h1">Set new password</h1>
      <p className="auth-sub">Choose a strong password for your account.</p>

      <div className="auth-fields">
        <div>
          <AuthInput
            id="reset-password"
            label="New Password"
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

        <div>
          <AuthInput
            id="reset-confirm"
            label="Confirm Password"
            icon={FiLock}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={onKeyDown}
            name="confirm"
            autoComplete="new-password"
            error={error}
            suffix={
              <button
                type="button"
                className="auth-input-suffix"
                onClick={() => setShowConfirm(s => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
          />
          {confirm && confirm === password && (
            <span className="auth-match">
              <FiCheckCircle size={11} /> Passwords match
            </span>
          )}
        </div>

        {error && (
          <div className="auth-err" role="alert">{error}</div>
        )}

        <AuthButton onClick={handleReset} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password'}
        </AuthButton>
      </div>
    </AuthLayout>
  )
}