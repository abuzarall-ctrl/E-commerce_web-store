export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/orders', '/checkout', '/api/'],
    },
    sitemap: 'https://abuzarstore.pk/sitemap.xml',
  }
}