export const CATEGORIES = ['Plastic Crockery', 'Glassware', 'Melamine']

export const STOCK_STATUSES = ['in stock', 'low stock', 'out of stock']

export const LOW_STOCK_THRESHOLD = 5
export const DEFAULT_STOCK_QUANTITY = 25

export const CATEGORY_IMAGES = {
  'Plastic Crockery': '/images/category-plastic.svg',
  Glassware: '/images/category-glassware.svg',
  Melamine: '/images/category-melamine.svg',
}

export function stockStatusForQuantity(quantity) {
  const value = Number(quantity)
  if (!Number.isFinite(value) || value <= 0) return 'out of stock'
  if (value <= LOW_STOCK_THRESHOLD) return 'low stock'
  return 'in stock'
}

export function resolveStockQuantity(value, fallbackStatus = 'in stock') {
  const quantity = value === '' || value === null || value === undefined ? NaN : Number(value)
  if (Number.isFinite(quantity) && quantity >= 0) return Math.floor(quantity)
  if (fallbackStatus === 'out of stock') return 0
  if (fallbackStatus === 'low stock') return LOW_STOCK_THRESHOLD
  return DEFAULT_STOCK_QUANTITY
}

export function productStockQuantity(product) {
  if (product?.stock_quantity === null || product?.stock_quantity === undefined) {
    return resolveStockQuantity(undefined, product?.stock_status)
  }
  return resolveStockQuantity(product.stock_quantity, product?.stock_status)
}

export function productStockStatus(product) {
  if (product?.stock_quantity === null || product?.stock_quantity === undefined) {
    return STOCK_STATUSES.includes(product?.stock_status) ? product.stock_status : 'in stock'
  }
  return stockStatusForQuantity(product.stock_quantity)
}
