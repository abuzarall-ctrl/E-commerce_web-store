import { readWishlistFromStorage } from './wishlistStorage'

let items = []
if (typeof window !== 'undefined') items = readWishlistFromStorage()

const listeners = new Set()

export function subscribeWishlist(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getWishlistItems() {
  return items
}

export function refreshWishlist() {
  if (typeof window === 'undefined') return
  const next = readWishlistFromStorage()
  if (JSON.stringify(next) !== JSON.stringify(items)) {
    items = next
    listeners.forEach(cb => cb())
  }
}

export function initWishlistStore() {
  if (typeof window === 'undefined' || window.__wishlistStoreInited) return
  window.__wishlistStoreInited = true
  window.addEventListener('wishlistUpdated', refreshWishlist)
}
