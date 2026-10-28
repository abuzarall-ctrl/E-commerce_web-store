'use client'
import { useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { isAdminRole } from '@/lib/adminRoles'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft, FiShield, FiSmartphone } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [stage, setStage] = useState('credentials')
  const [factorId, setFactorId] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const startMfa = async (user) => {
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError) throw aalError
    if (aal?.currentLevel === 'aal2') {
      router.push('/admin')
      return
    }

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) throw factorsError
    const totpFactors = (factors?.all || []).filter(factor => factor.factor_type === 'totp')
    const verified = totpFactors.find(factor => factor.status === 'verified')

    if (verified) {
      setFactorId(verified.id)
      setStage('verify')
      setLoading(false)
      return
    }

    for (const factor of totpFactors) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }

    const { data: enrollment, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Admin ${user?.email || ''}`.trim(),
    })
    if (enrollError) throw enrollError

    const qr = String(enrollment.totp.qr_code || '')
      .replace(/^data:image\/svg\+xml;utf-8,/, '')
      .trim()
    setFactorId(enrollment.id)
    setQrCode(`data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`)
    setSecret(enrollment.totp.secret)
    setStage('enroll')
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Please fill in all fields'); return }
    if (!supabase) { setError('Admin authentication is not configured on this server. Please try again later.'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (!isAdminRole(data.user?.app_metadata?.role)) {
      await supabase.auth.signOut()
      setError('This account does not have admin access')
      setLoading(false)
      return
    }

    try {
      await startMfa(data.user)
    } catch (mfaError) {
      setError(mfaError.message || 'Could not start two-factor authentication.')
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code from your authenticator app.'); return }
    if (!supabase) return
    setLoading(true)
    setError('')
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      })
      if (verifyError) throw verifyError
      router.push('/admin')
    } catch (verifyError) {
      setError(verifyError.message || 'That code did not work. Please try again.')
      setLoading(false)
    }
  }

  const resetLogin = async () => {
    if (supabase) await supabase.auth.signOut()
    setStage('credentials')
    setCode('')
    setFactorId('')
    setQrCode('')
    setSecret('')
    setError('')
    setPassword('')
  }

  const onKeyDown = (e) => {
    if (e.key !== 'Enter') return
    if (stage === 'credentials') handleLogin()
    else handleVerify()
  }

  return (
    <AuthLayout variant="admin">
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

      {stage === 'credentials' ? (
        <>
          <h1 className="auth-h1">Welcome back, Admin</h1>
          <p className="auth-sub">Sign in to your store dashboard</p>

          <div className="auth-fields">
            <AuthInput
              id="admin-email"
              label="Admin Email"
              icon={FiMail}
              type="email"
              placeholder="admin@abuzarstore.pk"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              name="email"
              autoComplete="email"
              error={error}
            />

            <AuthInput
              id="admin-password"
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
              placeholder="Enter your password"
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
              {loading ? 'Verifying...' : <><FiArrowRight size={15} /> Admin Sign In</>}
            </AuthButton>
          </div>
        </>
      ) : (
        <>
          <h1 className="auth-h1">
            {stage === 'enroll' ? 'Secure your account' : 'Two-factor authentication'}
          </h1>
          <p className="auth-sub">
            {stage === 'enroll'
              ? 'Scan the QR code with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code.'
              : 'Enter the 6-digit code from your authenticator app to finish signing in.'}
          </p>

          <div className="auth-fields">
            {stage === 'enroll' && (
              <div className="auth-mfa-box">
                {qrCode && (
                  <Image
                    src={qrCode}
                    alt="Authenticator QR code"
                    width={168}
                    height={168}
                    unoptimized
                    className="auth-mfa-qr"
                  />
                )}
                <p className="auth-mfa-hint">Can&apos;t scan? Enter this key manually:</p>
                <code className="auth-mfa-secret">{secret}</code>
              </div>
            )}

            <AuthInput
              id="admin-mfa-code"
              label="Authentication code"
              icon={FiSmartphone}
              type="text"
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={onKeyDown}
              name="one-time-code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              error={error}
            />

            {error && (
              <div className="auth-err" role="alert">{error}</div>
            )}

            <AuthButton onClick={handleVerify} disabled={loading}>
              {loading ? 'Verifying...' : <><FiShield size={15} /> Verify &amp; Continue</>}
            </AuthButton>

            <AuthButton onClick={resetLogin} variant="secondary" disabled={loading}>
              Use a different account
            </AuthButton>
          </div>
        </>
      )}

      <div className="auth-note">
        <FiShield size={13} /> Protected by two-factor authentication
      </div>
    </AuthLayout>
  )
}
