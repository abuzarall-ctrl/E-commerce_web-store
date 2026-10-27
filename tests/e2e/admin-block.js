const assert = require('assert')
const { chromium } = require('playwright')
const {
  BASE_URL,
  SAMPLE_PRODUCT,
  loadEnv,
  authStorageKey,
  fakeSession,
  mockProducts,
  sampleOrder,
  trackPageErrors,
} = require('./helpers')

;(async () => {
  const env = loadEnv()
  const session = fakeSession(env, { role: 'admin', email: 'admin-test@example.com' })
  const order = sampleOrder(env)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = trackPageErrors(page)
  await mockProducts(page)
  await page.route('**/rest/v1/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Content-Range': '0-0/1' },
    body: JSON.stringify([order]),
  }))

  await page.addInitScript(({ key, value, product }) => {
    localStorage.setItem(key, JSON.stringify(value))
    localStorage.setItem('cart', JSON.stringify([{ ...product, qty: 1 }]))
  }, { key: authStorageKey(env), value: session, product: SAMPLE_PRODUCT })

  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' })
  const adminButtons = page.locator('button:has-text("Admin account")')
  await adminButtons.first().waitFor({ timeout: 15000 })
  assert.strictEqual(await adminButtons.count(), 1, 'Shop should show admin account button')
  await adminButtons.first().click()
  await page.getByText('Admin accounts cannot place orders. Sign in as a customer to buy.').waitFor({ timeout: 5000 })

  const cartBefore = await page.evaluate(() => localStorage.getItem('cart'))
  await page.locator('div[style*="rgba(212, 163, 115, 0.12)"]').first().click()
  await page.getByText('Admin accounts cannot place orders. Sign in with a customer account to checkout.').waitFor({ timeout: 5000 })
  assert.strictEqual(await page.getByText('Proceed to Checkout', { exact: true }).count(), 0, 'Admin cart must not show checkout')
  assert.strictEqual(JSON.parse(cartBefore).length, 1, 'Admin cart should stay unchanged')

  await page.goto(`${BASE_URL}/product/${SAMPLE_PRODUCT.id}`, { waitUntil: 'networkidle' })
  await page.getByText('You are signed in as an admin. Admin accounts cannot place orders', { exact: false }).waitFor({ timeout: 15000 })
  assert.ok(await page.getByRole('button', { name: 'Admin account', exact: true }).count() >= 1, 'Product page should show admin button')

  await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Admin accounts cannot place orders' }).waitFor({ timeout: 15000 })
  assert.strictEqual(await page.locator('button:has-text("Place Order")').count(), 0, 'Admin checkout must not show Place Order')
  assert.deepStrictEqual(pageErrors, [], 'No page errors expected')

  console.log('PASS admin-block', JSON.stringify({ cartUnchanged: true }))
  await browser.close()
})().catch(error => {
  console.error('FAIL admin-block', error.message)
  process.exit(1)
})
