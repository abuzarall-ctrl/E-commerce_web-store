const WISHLIST_KEY = 'wishlist'
const OWNER_KEY = 'wishlist-owner'

let wishlist = []
let persistent = false

function normalize(raw) {
  if (!Array.isArray(raw)) return []
  const map = {}
  for (const product of raw) {
    if (!product || product.id == null) continue
    map[product.id] = { ...product }
  }
  return Object.values(map)
}

if (typeof window !== 'undefined') {
  persistent = localStorage.getItem(OWNER_KEY) === 'user'
  if (persistent) {
    try {
      wishlist = normalize(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'))
    } catch {
      wishlist = []
    }
  }
}

function persist() {
  if (typeof window === 'undefined') return
  if (!persistent) return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
}

export function readWishlistFromStorage() {
  return wishlist.map(item => ({ ...item }))
}

export function isInWishlist(id) {
  return wishlist.some(item => item.id === id)
}

export function toggleWishlistItem(product) {
  if (typeof window === 'undefined') return
  const existing = wishlist.find(item => item.id === product.id)
  if (existing) {
    wishlist = wishlist.filter(item => item.id !== product.id)
  } else {
    wishlist.push({ ...product })
  }
  persist()
  window.dispatchEvent(new Event('wishlistUpdated'))
}

export function writeWishlistToStorage(items) {
  if (typeof window === 'undefined') return
  wishlist = normalize(items)
  persist()
  window.dispatchEvent(new Event('wishlistUpdated'))
}

export function enableWishlistPersistence() {
  if (typeof window === 'undefined') return
  persistent = true
  localStorage.setItem(OWNER_KEY, 'user')
  persist()
}

export function clearWishlist() {
  if (typeof window === 'undefined') return
  wishlist = []
  persistent = false
  localStorage.removeItem(WISHLIST_KEY)
  localStorage.removeItem(OWNER_KEY)
  window.dispatchEvent(new CustomEvent('wishlistUpdated', { detail: { source: 'logout' } }))
}
