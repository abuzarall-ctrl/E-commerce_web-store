'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AuthLayout from '@/app/components/auth/AuthLayout'
import AuthButton from '@/app/components/auth/AuthButton'
import '@/app/auth/auth.css'

export default function AuthCallback() {
  const router = useRouter()
  const [msg, setMsg] = useState('Signing you in...')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer
    let subscription

    const finish = async (user) => {
      if (cancelled) return
      clearTimeout(timer)
      setMsg('Welcome! Taking you to the store...')
      // Ensure a public.users row exists for Google sign-ups. RLS failures
      // must not block the login itself.
      try {
        await supabase.from('users').upsert(
          { id: user.id, email: user.email, role: 'customer' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      } catch {
        // ignore — the auth session is already valid
      }
      router.replace('/')
    }

    const fail = (message) => {
      if (cancelled) return
      setMsg(message)
      setFailed(true)
      timer = setTimeout(() => router.replace('/auth/login'), 8000)
    }

    const run = async () => {
      if (!supabase) { fail('Sign in is temporarily unavailable.'); return }

      // Supabase can return OAuth errors in the query string or hash.
      const search = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const errorDescription =
        search.get('error_description') || hash.get('error_description')
      const errorCode = search.get('error_code') || hash.get('error_code')
      const oauthError = errorDescription || search.get('error') || hash.get('error')
      if (oauthError) {
        console.error('Supabase OAuth callback error:', errorCode || '', oauthError)
        const exchangeFailed =
          errorCode === 'unexpected_failure' || /exchange external code/i.test(oauthError)
        fail(
          exchangeFailed
            ? 'Google could not finish signing you in. The Google Client ID and Client Secret in Supabase must belong to the same Web client. Update them, then try again.'
            : oauthError.replace(/\+/g, ' ')
        )
        return
      }

      // supabase-js already recovers the session from the URL (implicit hash
      // tokens or a PKCE ?code) during initialization. getSession waits for
      // that to finish, so check it before exchanging anything manually.
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) { await finish(session.user); return }

      // Fallback: PKCE code that auto-detection did not consume.
      const code = search.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (data?.session?.user) { await finish(data.session.user); return }
        const { data: { session: retried } } = await supabase.auth.getSession()
        if (retried?.user) { await finish(retried.user); return }
        if (error) { fail(error.message); return }
      }

      // Session not ready yet — wait for the auth state change.
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          if (nextSession?.user) {
            sub.unsubscribe()
            await finish(nextSession.user)
          }
        }
      )
      subscription = sub

      timer = setTimeout(() => fail('Sign in timed out. Please try again.'), 10000)
    }

    run()

    return () => {
      cancelled = true
      clearTimeout(timer)
      subscription?.unsubscribe()
    }
  }, [router])

  return (
    <AuthLayout>
      <div className="auth-success">
        {failed ? (
          <>
            <p className="auth-spinner-text" role="alert">{msg}</p>
            <div style={{ height: '20px' }} />
            <AuthButton onClick={() => router.replace('/auth/login')}>
              Back to Sign In
            </AuthButton>
          </>
        ) : (
          <>
            <div className="auth-spinner" />
            <p className="auth-spinner-text" role="status">{msg}</p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
