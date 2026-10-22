const KEY = 'recently-viewed'
const MAX_ITEMS = 8

function read() {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
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
}

export function getRecentlyViewed(excludeId) {
  return read().filter(item => item.id !== excludeId)
}
