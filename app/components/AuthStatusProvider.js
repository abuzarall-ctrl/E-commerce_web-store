'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { isAdminRole } from '@/lib/adminRoles'

const DEFAULT_STATUS = { ready: false, user: null, isAdmin: false }

const AuthStatusContext = createContext(DEFAULT_STATUS)

export function AuthStatusProvider({ children }) {
  const [status, setStatus] = useState(() =>
    supabase ? DEFAULT_STATUS : { ready: true, user: null, isAdmin: false }
  )

  useEffect(() => {
    if (!supabase) return

    const apply = (session) => {
      const user = session?.user ?? null
      setStatus({ ready: true, user, isAdmin: isAdminRole(user?.app_metadata?.role) })
    }

    supabase.auth.getSession().then(({ data: { session } }) => apply(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => apply(session))
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthStatusContext.Provider value={status}>
      {children}
    </AuthStatusContext.Provider>
  )
}

export function useAuthStatus() {
  return useContext(AuthStatusContext)
}
