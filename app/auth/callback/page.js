'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#111110', gap: '20px'
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        border: '3px solid rgba(212,163,115,0.15)',
        borderTop: '3px solid #D4A373',
        animation: 'spin 0.75s linear infinite'
      }} />
      <p style={{ color: '#FEFAE0', fontSize: '16px', fontWeight: '500', letterSpacing: '-0.2px' }}>
        {msg}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
