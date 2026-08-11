export function readCartFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem('cart') || '[]')
    const map = {}
    for (const p of raw) {
      if (map[p.id]) map[p.id].qty += 1
      else map[p.id] = { ...p, qty: 1 }
    }
    return Object.values(map)
  } catch {
    return []
  }
}

export function appendCartItem(product, qty = 1) {
  if (typeof window === 'undefined') return
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  for (let i = 0; i < qty; i++) cart.push(product)
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

export function writeCartToStorage(items) {
  const flat = items.flatMap(item => Array(item.qty).fill({ ...item, qty: undefined }))
  localStorage.setItem('cart', JSON.stringify(flat))
  window.dispatchEvent(new Event('cartUpdated'))
}