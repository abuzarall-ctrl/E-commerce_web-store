export default function sitemap() {
  const base = 'https://abuzarstore.pk'
  const now = new Date()

  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/auth/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]
}