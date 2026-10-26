import { getOrderDetails } from './orderPayload'

export const PAYMENT_LABELS = {
  cod: 'Cash on Delivery',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank: 'Bank Transfer',
}

export function formatMoney(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-PK')}`
}

export function orderNumber(order) {
  return String(order?.id || '').slice(0, 8).toUpperCase()
}

export function orderItems(order) {
  const { items } = getOrderDetails(order)
  return items.map(item => {
    const price = Number(item.price) || 0
    const discount = Number(item.discount) || 0
    const unitPrice = item.finalPrice !== undefined
      ? Number(item.finalPrice) || 0
      : Math.round(price - (price * discount / 100))
    const quantity = Math.max(1, Number(item.qty) || 1)
    return {
      name: String(item.name || 'Item'),
      category: String(item.category || ''),
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
    }
  })
}

export function orderTotal(order) {
  const recorded = Number(order?.total)
  if (Number.isFinite(recorded) && recorded > 0) return recorded
  return orderItems(order).reduce((sum, item) => sum + item.lineTotal, 0)
}

export function paymentLabel(order, details = getOrderDetails(order)) {
  return details.payment || PAYMENT_LABELS[order?.payment_method] || 'Cash on Delivery'
}

export function formatOrderDate(value) {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
