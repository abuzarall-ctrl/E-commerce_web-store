const assert = require('assert')
const { chromium } = require('playwright')
const {
  BASE_URL,
  loadEnv,
  authStorageKey,
  fakeSession,
  mockProducts,
  sampleOrder,
  trackPageErrors,
} = require('./helpers')

;(async () => {
  const env = loadEnv()
  const key = authStorageKey(env)
  const order = sampleOrder(env)
  const browser = await chromium.launch()

  const customerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await customerContext.newPage()
  const pageErrors = trackPageErrors(page)
  await page.route('**/rest/v1/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Content-Range': '0-0/1' },
    body: JSON.stringify([order]),
  }))
  let receiptRequested = false
  await page.route('**/api/orders/receipt*', route => {
    receiptRequested = true
    return route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      headers: { 'Content-Disposition': 'attachment; filename="receipt.pdf"' },
      body: Buffer.from('%PDF-1.4 test\n%%EOF'),
    })
  })
  await page.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify(session))
    localStorage.setItem('cart', '[]')
  }, { storageKey: key, session: fakeSession(env) })

  await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
  await page.getByText('Tap for details ▼', { exact: true }).first().click()
  const receiptButton = page.getByText('Download receipt (PDF)', { exact: true }).first()
  const buyAgain = page.getByText('Buy again', { exact: true }).first()
  await buyAgain.waitFor({ timeout: 15000 })
  await receiptButton.click()
  await page.waitForTimeout(800)
  assert.strictEqual(receiptRequested, true, 'Receipt API should be requested')

  const cartBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'))
  await buyAgain.click()
  await page.getByText('Proceed to Checkout', { exact: true }).waitFor({ timeout: 5000 })
  const cartAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]'))
  assert.strictEqual(cartBefore.length, 0, 'Cart should start empty')
  assert.strictEqual(cartAfter.length, 2, 'Buy again should add the order items')
  assert.deepStrictEqual(pageErrors, [], 'No page errors expected')
  await customerContext.close()

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const adminPage = await adminContext.newPage()
  const adminErrors = trackPageErrors(adminPage)
  await mockProducts(adminPage)
  await adminPage.route('**/api/admin/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ orders: [order] }),
  }))
  await adminPage.route('**/rest/v1/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Content-Range': '0-0/1' },
    body: JSON.stringify([order]),
  }))
  await adminPage.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify(session))
  }, { storageKey: key, session: fakeSession(env, { role: 'admin', email: 'admin-test@example.com' }) })

  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
  await adminPage.getByText('Orders', { exact: true }).first().click()
  await adminPage.getByText('Resend receipt email', { exact: true }).first().waitFor({ timeout: 15000 })
  assert.strictEqual(await adminPage.getByText('Resend receipt email', { exact: true }).count(), 1, 'Resend button should render')
  assert.strictEqual(await adminPage.getByText('Download receipt', { exact: true }).count(), 1, 'Download button should render')
  assert.deepStrictEqual(adminErrors, [], 'No admin page errors expected')
  await adminContext.close()

  console.log('PASS ux-buttons', JSON.stringify({ receiptRequested, cartAfter: cartAfter.length, adminButtons: true }))
  await browser.close()
})().catch(error => {
  console.error('FAIL ux-buttons', error.message)
  process.exit(1)
})
