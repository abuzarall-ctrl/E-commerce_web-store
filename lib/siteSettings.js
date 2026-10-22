export const DEFAULT_SITE_SETTINGS = {
  phone: '+92 300 0000000',
  email: 'support@abuzarstore.pk',
  address: 'Karachi, Pakistan',
  announcement: 'Free delivery on orders over Rs. 3,000',
  returnsNote: 'Easy 7-day returns',
  footerNote: 'Everyday crockery in plastic, glass and melamine. Practical pieces for the table, delivered across Pakistan.',
  instagram: '',
  facebook: '',
  whatsapp: '',
}

const clean = (value, maxLength) => String(value ?? '').trim().slice(0, maxLength)

export function normalizeSiteSettings(value) {
  const input = value && typeof value === 'object' ? value : {}
  return {
    phone: clean(input.phone, 40) || DEFAULT_SITE_SETTINGS.phone,
    email: clean(input.email, 120) || DEFAULT_SITE_SETTINGS.email,
    address: clean(input.address, 160) || DEFAULT_SITE_SETTINGS.address,
    announcement: clean(input.announcement, 160) || DEFAULT_SITE_SETTINGS.announcement,
    returnsNote: clean(input.returnsNote, 120) || DEFAULT_SITE_SETTINGS.returnsNote,
    footerNote: clean(input.footerNote, 320) || DEFAULT_SITE_SETTINGS.footerNote,
    instagram: clean(input.instagram, 200),
    facebook: clean(input.facebook, 200),
    whatsapp: clean(input.whatsapp, 40),
  }
}
