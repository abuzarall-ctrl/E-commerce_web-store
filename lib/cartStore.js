import { readCartFromStorage } from './cartStorage'

let items = []
if (typeof window !== 'undefined') items = readCartFromStorage()

const listeners = new Set()

export function subscribeCart(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getCartItems() {
  return items
}

export function refreshCart() {
  if (typeof window === 'undefined') return
  const next = readCartFromStorage()
  if (JSON.stringify(next) !== JSON.stringify(items)) {
    items = next
    listeners.forEach(cb => cb())
  }
}

let inited = false

export function initCartStore() {
  if (typeof window === 'undefined' || inited) return
  inited = true
  window.addEventListener('cartUpdated', refreshCart)
}

if (typeof window !== 'undefined') initCartStore()
