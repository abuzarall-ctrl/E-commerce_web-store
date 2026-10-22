const CART_KEY = 'cart'
const OWNER_KEY = 'cart-owner'

let cart = []
let persistent = false

function normalize(raw) {
  if (!Array.isArray(raw)) return []
  const map = {}
  for (const product of raw) {
    if (!product || product.id == null) continue
    const quantity = Math.max(1, Number(product.qty) || 1)
    if (map[product.id]) {
      map[product.id].qty += quantity
    } else {
      map[product.id] = { ...product, qty: quantity }
    }
  }
  return Object.values(map)
}

if (typeof window !== 'undefined') {
  persistent = localStorage.getItem(OWNER_KEY) === 'user'
  if (persistent) {
    try {
      cart = normalize(JSON.parse(localStorage.getItem(CART_KEY) || '[]'))
    } catch {
      cart = []
    }
  }
}

function persist() {
  if (typeof window === 'undefined') return
  if (!persistent) return
  const flat = cart.flatMap(item => Array(Math.max(1, item.qty)).fill({ ...item, qty: undefined }))
  localStorage.setItem(CART_KEY, JSON.stringify(flat))
}

export function readCartFromStorage() {
  return cart.map(item => ({ ...item }))
}

export function appendCartItem(product, qty = 1) {
  if (typeof window === 'undefined') return
  const quantity = Math.max(1, Number(qty) || 1)
  const existing = cart.find(item => item.id === product.id)
  if (existing) {
    existing.qty += quantity
  } else {
    cart.push({ ...product, qty: quantity })
  }
  persist()
  window.dispatchEvent(new Event('cartUpdated'))
}

export function writeCartToStorage(items) {
  if (typeof window === 'undefined') return
  cart = normalize(items)
  persist()
  window.dispatchEvent(new Event('cartUpdated'))
}

export function enableCartPersistence() {
  if (typeof window === 'undefined') return
  persistent = true
  localStorage.setItem(OWNER_KEY, 'user')
  persist()
}

export function clearCart() {
  if (typeof window === 'undefined') return
  cart = []
  persistent = false
  localStorage.removeItem(CART_KEY)
  localStorage.removeItem(OWNER_KEY)
  window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { source: 'logout' } }))
}
