'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { isAdminRole } from '@/lib/adminRoles'
import { useRouter } from 'next/navigation'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiArrowLeft, FiShield } from 'react-icons/fi'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthInput from '@/app/components/auth/AuthInput'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    router.push('/admin')
  }

  const onKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <AuthLayout variant="admin">
      <button className="auth-back" onClick={() => router.push('/')}>
        <FiArrowLeft size={14} /> Back to store
      </button>

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
          {loading ? 'Verifying...' : <><FiArrowRight size={15} /> Admin Sign In</>}
        </AuthButton>
      </div>

      <div className="auth-note">
        <FiShield size={13} /> Manage your store securely
      </div>
    </AuthLayout>
  )
}