import { DEFAULT_PAYMENT_METHODS, normalizePaymentMethods } from './paymentMethods'

export const DEFAULT_SITE_SETTINGS = {
  categories: ['Plastic Crockery', 'Glassware', 'Melamine'],
  paymentMethods: { ...DEFAULT_PAYMENT_METHODS },
  phone: '+92 300 0000000',
  email: 'support@abuzarstore.pk',
  address: 'Karachi, Pakistan',
  announcement: 'Free delivery on orders over Rs. 3,000',
  returnsNote: 'Easy 7-day returns',
  footerNote: 'Everyday crockery in plastic, glass and melamine. Practical pieces for the table, delivered across Pakistan.',
  instagram: '',
  facebook: '',
  whatsapp: '',
  lowStockThreshold: 5,
}

const clean = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength)

function cleanCategories(value) {
  if (!Array.isArray(value)) return [...DEFAULT_SITE_SETTINGS.categories]
  const seen = new Set()
  const categories = []
  for (const item of value) {
    const name = clean(item, 40)
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    categories.push(name)
    if (categories.length >= 24) break
  }
  return categories.length ? categories : [...DEFAULT_SITE_SETTINGS.categories]
}

export function normalizeSiteSettings(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    categories: cleanCategories(input.categories),
    paymentMethods: normalizePaymentMethods(input.paymentMethods),
    phone: clean(input.phone, 40) || DEFAULT_SITE_SETTINGS.phone,
    email: clean(input.email, 120) || DEFAULT_SITE_SETTINGS.email,
    address: clean(input.address, 160) || DEFAULT_SITE_SETTINGS.address,
    announcement: clean(input.announcement, 160) || DEFAULT_SITE_SETTINGS.announcement,
    returnsNote: clean(input.returnsNote, 120) || DEFAULT_SITE_SETTINGS.returnsNote,
    footerNote: clean(input.footerNote, 320) || DEFAULT_SITE_SETTINGS.footerNote,
    instagram: clean(input.instagram, 200),
    facebook: clean(input.facebook, 200),
    whatsapp: clean(input.whatsapp, 40),
    lowStockThreshold: Math.min(50, Math.max(1, Math.floor(Number(input.lowStockThreshold) || DEFAULT_SITE_SETTINGS.lowStockThreshold))),
  }
}
