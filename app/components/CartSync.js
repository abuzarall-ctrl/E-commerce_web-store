'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { readCartFromStorage, writeCartToStorage, clearCart, enableCartPersistence } from '@/lib/cartStorage'
import { initCartStore } from '@/lib/cartStore'

function mergeCarts(saved, local) {
  const map = new Map()
  for (const item of [...saved, ...local]) {
    if (!item || item.id == null) continue
    const qty = Math.max(1, Number(item.qty) || 1)
    const existing = map.get(item.id)
    if (existing) existing.qty = Math.max(existing.qty, qty)
    else map.set(item.id, { ...item, qty })
  }
  return [...map.values()]
}

export default function CartSync() {
  const userRef = useRef(null)
  const restoringRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!supabase) return
    initCartStore()

    const save = (event) => {
      if (restoringRef.current || !userRef.current) return
      if (event?.detail?.source === 'logout') return
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (!userRef.current) return
        const items = readCartFromStorage()
        supabase.auth.updateUser({ data: { cart: items } }).catch(() => {})
      }, 700)
    }

    const restore = (session) => {
      const user = session?.user
      if (!user) return
      enableCartPersistence()
      const saved = Array.isArray(user.user_metadata?.cart) ? user.user_metadata.cart : []
      const local = readCartFromStorage()
      const merged = mergeCarts(saved, local)
      const changed = JSON.stringify(merged) !== JSON.stringify(local)
      if (changed) {
        restoringRef.current = true
        writeCartToStorage(merged)
        restoringRef.current = false
      }
      if (changed || !saved.length) {
        supabase.auth.updateUser({ data: { cart: merged } }).catch(() => {})
      }
    }

    let active = true
    window.addEventListener('cartUpdated', save)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      userRef.current = session?.user ?? null
      if (session?.user) restore(session)
      else clearCart()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      userRef.current = session?.user ?? null
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        restore(session)
      } else if ((event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') && !session?.user) {
        clearCart()
      }
    })

    return () => {
      active = false
      clearTimeout(timerRef.current)
      window.removeEventListener('cartUpdated', save)
      subscription.unsubscribe()
    }
  }, [])

  return null
}
