'use client'
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { readWishlistFromStorage, writeWishlistToStorage, clearWishlist, enableWishlistPersistence } from '@/lib/wishlistStorage'
import { initWishlistStore } from '@/lib/wishlistStore'

function mergeWishlists(saved, local) {
  const map = new Map()
  for (const item of [...saved, ...local]) {
    if (!item || item.id == null) continue
    map.set(item.id, { ...item })
  }
  return [...map.values()]
}

export default function WishlistSync() {
  const userRef = useRef(null)
  const restoringRef = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!supabase) return
    initWishlistStore()

    const save = (event) => {
      if (restoringRef.current || !userRef.current) return
      if (event?.detail?.source === 'logout') return
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (!userRef.current) return
        const items = readWishlistFromStorage()
        supabase.auth.updateUser({ data: { wishlist: items } }).catch(() => {})
      }, 700)
    }

    const restore = (session) => {
      const user = session?.user
      if (!user) return
      enableWishlistPersistence()
      const saved = Array.isArray(user.user_metadata?.wishlist) ? user.user_metadata.wishlist : []
      const local = readWishlistFromStorage()
      const merged = mergeWishlists(saved, local)
      const changed = JSON.stringify(merged) !== JSON.stringify(local)
      if (changed) {
        restoringRef.current = true
        writeWishlistToStorage(merged)
        restoringRef.current = false
      }
      if (changed || !saved.length) {
        supabase.auth.updateUser({ data: { wishlist: merged } }).catch(() => {})
      }
    }

    let active = true
    window.addEventListener('wishlistUpdated', save)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      userRef.current = session?.user ?? null
      if (session?.user) restore(session)
      else clearWishlist()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      userRef.current = session?.user ?? null
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        restore(session)
      } else if ((event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') && !session?.user) {
        clearWishlist()
      }
    })

    return () => {
      active = false
      clearTimeout(timerRef.current)
      window.removeEventListener('wishlistUpdated', save)
      subscription.unsubscribe()
    }
  }, [])

  return null
}
