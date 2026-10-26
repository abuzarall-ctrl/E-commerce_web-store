const CART_KEY = 'cart'

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

function loadCart() {
  if (typeof window === 'undefined') return []
  try {
    return normalize(JSON.parse(localStorage.getItem(CART_KEY) || '[]'))
  } catch {
    return []
  }
}

function cartState() {
  if (typeof window === 'undefined') return null
  if (!window.__abuzarCartState) {
    window.__abuzarCartState = { items: loadCart() }
  }
  return window.__abuzarCartState
}

function currentItems() {
  const state = cartState()
  return state ? state.items : []
}

function persist() {
  if (typeof window === 'undefined') return
  const flat = currentItems().flatMap(item => Array(Math.max(1, item.qty)).fill({ ...item, qty: undefined }))
  localStorage.setItem(CART_KEY, JSON.stringify(flat))
}

function notify(detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cartUpdated', {
    detail: { ...detail, items: readCartFromStorage() }
  }))
}

export function readCartFromStorage() {
  return currentItems().map(item => ({ ...item }))
}

export function appendCartItem(product, qty = 1) {
  if (typeof window === 'undefined') return
  const items = currentItems()
  const quantity = Math.max(1, Number(qty) || 1)
  const existing = items.find(item => item.id === product.id)
  if (existing) {
    existing.qty += quantity
  } else {
    items.push({ ...product, qty: quantity })
  }
  persist()
  notify()
}

export function writeCartToStorage(items) {
  if (typeof window === 'undefined') return
  const state = cartState()
  state.items = normalize(items)
  persist()
  notify()
}

export function enableCartPersistence() {
  if (typeof window === 'undefined') return
  persist()
}

export function clearCart() {
  if (typeof window === 'undefined') return
  const state = cartState()
  state.items = []
  localStorage.removeItem(CART_KEY)
  notify({ source: 'logout' })
}
