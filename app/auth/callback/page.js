'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AuthLayout from '@/app/components/auth/AuthLayout'
import '@/app/auth/auth.css'

export default function AuthCallback() {
  const router = useRouter()
  const [msg, setMsg] = useState('Signing you in...')

  useEffect(() => {
    const run = async () => {
      try {
        // PKCE flow: exchange ?code= for a real session
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setMsg('Sign in failed — redirecting...')
            setTimeout(() => router.push('/auth/login'), 2000)
            return
          }
        }

        // Implicit / already-set session
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Ensure a row exists in the users table for Google sign-ups
          await supabase.from('users').upsert(
            { id: session.user.id, email: session.user.email, role: 'customer' },
            { onConflict: 'id', ignoreDuplicates: true }
          )
          setMsg('Welcome! Taking you to the store...')
          router.push('/')
          return
        }

        // Session not ready yet — wait for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, sess) => {
            if (sess?.user) {
              subscription.unsubscribe()
              await supabase.from('users').upsert(
                { id: sess.user.id, email: sess.user.email, role: 'customer' },
                { onConflict: 'id', ignoreDuplicates: true }
              )
              router.push('/')
            }
          }
        )

        // Fallback: if nothing fires in 6 s, go to login
        setTimeout(() => {
          subscription.unsubscribe()
          router.push('/auth/login')
        }, 6000)

      } catch {
        setMsg('Something went wrong — redirecting...')
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    }

    run()
  }, [router])

  return (
    <AuthLayout>
      <div className="auth-success">
        <div className="auth-spinner" />
        <p className="auth-spinner-text" role="status">{msg}</p>
      </div>
    </AuthLayout>
  )
}