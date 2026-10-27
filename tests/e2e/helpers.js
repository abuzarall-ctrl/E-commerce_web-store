const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const SAMPLE_PRODUCT = {
  id: '11111111-1111-4111-8111-111111111112',
  name: 'Test Glass Tumbler',
  description: 'A test product for automated checks.',
  category: 'Glassware',
  price: 950,
  discount: 0,
  stock_quantity: 25,
  stock_status: 'in stock',
  image_url: '',
  is_fast_selling: false,
  is_good_reviews: false,
}

function loadEnv() {
  const envFile = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envFile)) return { ...process.env }
  const env = { ...process.env }
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return env
}

function authStorageKey(env) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required for E2E tests.')
  return `sb-${new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0]}-auth-token`
}

function fakeSession(env, { role = 'customer', email = 'customer@example.com', userId = '11111111-1111-4111-8111-111111111111' } = {}) {
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required for E2E tests.')
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'e2e-refresh-token',
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { role },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  }
}

async function mockProducts(page, product = SAMPLE_PRODUCT) {
  await page.route('**/rest/v1/products*', async route => {
    const accept = route.request().headers().accept || ''
    const single = accept.includes('vnd.pgrst.object')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Content-Range': '0-0/1' },
      body: JSON.stringify(single ? product : [product]),
    })
  })
}

function sampleOrder(env, product = SAMPLE_PRODUCT) {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    user_id: '11111111-1111-4111-8111-111111111111',
    created_at: new Date().toISOString(),
    status: 'confirmed',
    total: 1900,
    total_amount: 1900,
    customer_name: 'Test Customer',
    customer_phone: '03001234567',
    customer_email: 'customer@example.com',
    customer_address: 'Test Street',
    customer_city: 'Lahore',
    notes: '',
    payment_method: 'cod',
    payment_status: 'cod',
    refund_status: 'none',
    products: {
      version: 2,
      items: [{ ...product, qty: 2, finalPrice: product.price }],
      delivery: {
        name: 'Test Customer',
        phone: '03001234567',
        email: 'customer@example.com',
        address: 'Test Street',
        city: 'Lahore',
      },
      notes: '',
      payment: 'Cash on Delivery',
    },
  }
}

function trackPageErrors(page) {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

module.exports = {
  BASE_URL,
  SAMPLE_PRODUCT,
  loadEnv,
  authStorageKey,
  fakeSession,
  mockProducts,
  sampleOrder,
  trackPageErrors,
}
