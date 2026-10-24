const KEY = 'recently-viewed'
const MAX_ITEMS = 8
const listeners = new Set()
let cacheKey = null
let cacheValue = []

function read() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function invalidate() {
  cacheKey = null
}

function notify() {
  invalidate()
  listeners.forEach(listener => listener())
}

export function subscribeRecentlyViewed(listener) {
  if (typeof window === 'undefined') return () => {}
  listeners.add(listener)
  const onStorage = event => {
    if (!event.key || event.key === KEY) notify()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function addRecentlyViewed(product) {
  if (typeof window === 'undefined' || !product?.id) return
  const snapshot = {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    discount: product.discount,
    image_url: product.image_url,
    stock_status: product.stock_status,
  }
  const existing = read().filter(item => item.id !== snapshot.id)
  existing.unshift(snapshot)
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, MAX_ITEMS)))
  notify()
}

export function getRecentlyViewed(excludeId) {
  const key = excludeId || ''
  if (key === cacheKey) return cacheValue
  cacheKey = key
  cacheValue = read().filter(item => item.id !== excludeId)
  return cacheValue
}
