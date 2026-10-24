export function buildOrderPayload(items, delivery, meta = {}) {
  return {
    version: 2,
    items: Array.isArray(items) ? items : [],
    delivery: {
      name: String(delivery?.name || '').trim(),
      phone: String(delivery?.phone || '').trim(),
      email: String(delivery?.email || '').trim(),
      address: String(delivery?.address || '').trim(),
      city: String(delivery?.city || '').trim(),
    },
    notes: String(meta.notes || '').trim(),
    payment: String(meta.payment || '').trim(),
  }
}

export function getOrderDetails(order) {
  const payload = order?.products
  const base = {
    items: [],
    delivery: { name: '', phone: '', email: '', address: '', city: '' },
    notes: '',
    payment: '',
  }

  if (Array.isArray(payload)) {
    return {
      ...base,
      items: payload,
      delivery: {
        name: order?.customer_name || '',
        phone: order?.customer_phone || '',
        email: order?.customer_email || '',
        address: order?.customer_address || '',
        city: order?.customer_city || '',
      },
      notes: order?.notes || '',
    }
  }

  if (payload && typeof payload === 'object') {
    const embedded = payload.delivery && typeof payload.delivery === 'object' ? payload.delivery : {}
    return {
      items: Array.isArray(payload.items) ? payload.items : [],
      delivery: {
        name: embedded.name || order?.customer_name || '',
        phone: embedded.phone || order?.customer_phone || '',
        email: embedded.email || order?.customer_email || '',
        address: embedded.address || order?.customer_address || '',
        city: embedded.city || order?.customer_city || '',
      },
      notes: payload.notes || order?.notes || '',
      payment: payload.payment || '',
    }
  }

  return base
}

export function orderItemCount(order) {
  return getOrderDetails(order).items.reduce((total, item) => total + (Number(item.qty) || 1), 0)
}
