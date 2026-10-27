export const PAYMENT_METHODS = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    short: 'COD',
    desc: 'Pay when your order arrives at your door',
    badge: 'Most Popular',
    color: '#CCD5AE',
    successNote: null
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    short: 'JazzCash',
    desc: 'Send payment to our JazzCash wallet',
    badge: null,
    color: '#CC0000',
    successNote: {
      title: 'Send Payment via JazzCash',
      number: '+92 330 2816964',
      account: 'Abuzar',
      instruction: 'Send the total amount to this JazzCash number, then upload the transaction receipt below. Our team verifies it manually before confirming your order.'
    }
  },
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    short: 'Easypaisa',
    desc: 'Send payment to our Easypaisa account',
    badge: null,
    color: '#4AAD52',
    successNote: {
      title: 'Send Payment via Easypaisa',
      number: '+92 330 2816964',
      account: 'Abuzar',
      instruction: 'Send the total amount to this Easypaisa number, then upload the transaction receipt below. Our team verifies it manually before confirming your order.'
    }
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    short: 'Bank',
    desc: 'Direct deposit to our bank account',
    badge: null,
    color: '#4A90D9',
    successNote: {
      title: 'Bank Transfer Details',
      bank: 'Meezan Bank',
      accountName: 'Abuzar',
      accountNumber: '01330115617457',
      iban: '',
      instruction: 'Transfer the total amount to the account above, then upload the transaction receipt below. Our team verifies it manually before confirming your order.'
    }
  }
]

export const DEFAULT_PAYMENT_METHODS = Object.fromEntries(
  PAYMENT_METHODS.map(method => [method.id, true])
)

export function normalizePaymentMethods(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PAYMENT_METHODS }
  }

  const normalized = {}
  for (const method of PAYMENT_METHODS) {
    normalized[method.id] = value[method.id] !== false
  }

  if (!PAYMENT_METHODS.some(method => normalized[method.id])) {
    return { ...DEFAULT_PAYMENT_METHODS }
  }

  return normalized
}

export function availablePaymentMethods(value) {
  const enabled = normalizePaymentMethods(value)
  return PAYMENT_METHODS.filter(method => enabled[method.id])
}
