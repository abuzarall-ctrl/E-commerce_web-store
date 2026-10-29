'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FiLock, FiEye, FiEyeOff, FiCheckCircle, FiSmartphone, FiAlertTriangle } from 'react-icons/fi'
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
  const [linkError, setLinkError] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer

    const finishRecovery = async () => {
      if (cancelled) return

      try {
        // MFA-enabled accounts need an AAL2 session before updateUser(password)
        // is allowed. Prompt for the TOTP code now instead of failing later.
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (aal?.currentLevel !== 'aal2' && aal?.nextLevel === 'aal2') {
          const { data: factors } = await supabase.auth.mfa.listFactors()
          const verified = (factors?.all || []).find(
            factor => factor.factor_type === 'totp' && factor.status === 'verified'
          )
          if (verified) {
            if (cancelled) return
            setMfaFactorId(verified.id)
            setMfaRequired(true)
          }
        }
      } catch {
        // Ignore MFA lookup failures; the password form will surface the real error.
      }

      if (cancelled) return
      clearTimeout(timer)
      setReady(true)
    }

    const init = async () => {
      if (!supabase) {
        setLinkError('Password reset is temporarily unavailable. Please try again later.')
        setReady(true)
        return
      }
      // Supabase can return link errors in the query string or hash.
      const search = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const hashError = hash.get('error_description') || hash.get('error')
      const searchError = search.get('error_description') || search.get('error')
      if (hashError || searchError) {
        setLinkError(String(hashError || searchError).replace(/\+/g, ' '))
        clearTimeout(timer)
        setReady(true)
        return
      }

      // Exchange the reset code for a session
      const code = search.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { await finishRecovery(); return }
      }

      // Fallback: check if already in a recovery session (implicit flow)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { await finishRecovery(); return }

      // Listen for PASSWORD_RECOVERY event (Supabase sends this after redirect)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          subscription.unsubscribe()
          finishRecovery()
        }
      })

      // If nothing arrives, the link was already used or has expired.
      timer = setTimeout(() => {
        if (!cancelled) {
          setLinkError('This reset link is invalid or has expired. Please request a new one.')
          setReady(true)
        }
      }, 8000)
    }
    init()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const handleMfaVerify = async () => {
    if (!supabase) { setMfaError('Two-factor authentication is temporarily unavailable.'); return }
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError('Enter the 6-digit code from your authenticator app.')
      return
    }
    setMfaLoading(true)
    setMfaError('')
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
      if (challengeError) throw challengeError
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode.trim(),
      })
      if (verifyError) throw verifyError
      setMfaRequired(false)
      setMfaCode('')
    } catch (mfaErr) {
      setMfaError(mfaErr.message || 'That code did not work. Please try again.')
    } finally {
      setMfaLoading(false)
    }
  }

  const handleReset = async () => {
    if (!supabase) { setError('Password reset is temporarily unavailable. Please try again later.'); return }
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

  if (linkError) {
    return (
      <AuthLayout>
        <div className="auth-success">
          <div className="auth-success-icon" style={{ color: '#C0503E' }}>
            <FiAlertTriangle size={32} />
          </div>
          <h2>Reset link problem</h2>
          <p>{linkError}</p>
          <p className="auth-meta">Reset links can only be used once and expire after a short time.</p>
          <AuthButton onClick={() => router.push('/auth/forgot-password')}>
            Request a new link
          </AuthButton>
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

  if (mfaRequired) {
    return (
      <AuthLayout>
        <h1 className="auth-h1">Two-factor authentication</h1>
        <p className="auth-sub">
          Enter the 6-digit code from your authenticator app to continue resetting your password.
        </p>

        <div className="auth-fields">
          <AuthInput
            id="reset-mfa-code"
            label="Authentication code"
            icon={FiSmartphone}
            type="text"
            placeholder="000000"
            value={mfaCode}
            onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => { if (e.key === 'Enter') handleMfaVerify() }}
            name="one-time-code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            error={mfaError}
          />

          {mfaError && <div className="auth-err" role="alert">{mfaError}</div>}

          <AuthButton onClick={handleMfaVerify} disabled={mfaLoading}>
            {mfaLoading ? 'Verifying...' : 'Verify & Continue'}
          </AuthButton>
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