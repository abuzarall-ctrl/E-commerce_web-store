'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { FiMail, FiKey, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = (searchParams.get('email') || '').trim().toLowerCase()

  const [stage, setStage] = useState('otp')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(30)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleVerifyOtp = async () => {
    if (!supabase) { setError('Verification is temporarily unavailable. Please try again.'); return }
    if (!/^\d{6,10}$/.test(otp.trim())) { setError('Enter the verification code from your email'); return }

    setLoading(true)
    setError('')
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: 'email',
    })

    if (verifyError || !data.user) {
      setError(verifyError?.message || 'That code is invalid or expired. Request a new one.')
      setLoading(false)
      return
    }

    await supabase.from('users').upsert(
      { id: data.user.id, email: data.user.email, role: 'customer' },
      { onConflict: 'id' }
    )

    setLoading(false)
    setStage('password')
  }

  const handleCreatePassword = async () => {
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (!supabase) { setError('Verification is temporarily unavailable. Please try again.'); return }

    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message || 'Could not create your password.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.replace('/auth/login?created=1')
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending || !supabase) return
    setResending(true)
    setError('')
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setResending(false)
    if (resendError) {
      setError(resendError.message || 'Could not resend the code.')
      return
    }
    setCooldown(30)
  }

  const onKeyDown = (event) => {
    if (event.key !== 'Enter') return
    if (stage === 'otp') handleVerifyOtp()
    else handleCreatePassword()
  }

  if (!email) {
    return (
      <AuthLayout>
        <button className="auth-back" onClick={() => router.push('/auth/signup')}>
          <FiArrowLeft size={14} /> Back to signup
        </button>
        <h1 className="auth-h1">Email missing</h1>
        <p className="auth-sub">Please start again from the signup page.</p>
        <AuthButton onClick={() => router.push('/auth/signup')}>
          <FiArrowLeft size={15} /> Go to Signup
        </AuthButton>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <button className="auth-back" onClick={() => router.push('/auth/signup')}>
        <FiArrowLeft size={14} /> Back to signup
      </button>

      <h1 className="auth-h1">{stage === 'otp' ? 'Verify your email' : 'Create your password'}</h1>
      <p className="auth-sub">
        {stage === 'otp'
          ? <>We sent a verification code to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></>
          : 'Almost done — set a password so you can sign in next time'}
      </p>

      {stage === 'otp' ? (
        <div className="auth-fields">
          <AuthInput
            id="verify-otp"
            label="Verification Code"
            icon={FiKey}
            type="text"
            inputMode="numeric"
            placeholder="Enter code"
            value={otp}
            maxLength={10}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyDown={onKeyDown}
            name="otp"
            autoComplete="one-time-code"
            error={error}
          />

          {error && <div className="auth-err" role="alert">{error}</div>}

          <AuthButton onClick={handleVerifyOtp} disabled={loading}>
            {loading ? 'Verifying...' : <><FiCheckCircle size={15} /> Verify Code</>}
          </AuthButton>

          <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>
            Didn&apos;t get the code?{' '}
            <span
              className="auth-link"
              onClick={handleResend}
              style={{ opacity: cooldown > 0 || resending ? 0.5 : 1, cursor: cooldown > 0 ? 'default' : 'pointer' }}>
              {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </span>
          </p>
        </div>
      ) : (
        <div className="auth-fields">
          <AuthInput
            id="verify-password"
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
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
          />

          <AuthInput
            id="verify-confirm-password"
            label="Confirm Password"
            icon={FiLock}
            type={showPassword ? 'text' : 'password'}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            onKeyDown={onKeyDown}
            name="confirm-password"
            autoComplete="new-password"
            error={error}
          />

          {error && <div className="auth-err" role="alert">{error}</div>}

          <AuthButton onClick={handleCreatePassword} disabled={loading}>
            {loading ? 'Saving password...' : <><FiCheckCircle size={15} /> Create Password</>}
          </AuthButton>

          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#E24B4A', margin: 0 }}>
              Passwords do not match
            </p>
          )}
        </div>
      )}
    </AuthLayout>
  )
}

function VerifyFallback() {
  return (
    <AuthLayout>
      <p className="auth-sub">Loading verification...</p>
    </AuthLayout>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyFallback />}>
      <VerifyContent />
    </Suspense>
  )
}
