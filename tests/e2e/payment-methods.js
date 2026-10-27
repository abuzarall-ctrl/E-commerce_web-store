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
  const key = authStorageKey(env)
  const order = sampleOrder(env)
  let savedSettings = {
    paymentMethods: { cod: true, jazzcash: false, easypaisa: false, bank: false },
  }
  let savedPayload = null

  const browser = await chromium.launch()
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const adminPage = await adminContext.newPage()
  const adminErrors = trackPageErrors(adminPage)
  await mockProducts(adminPage)
  await adminPage.route('**/api/admin/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ orders: [order] }),
  }))
  await adminPage.route('**/api/site-settings*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ settings: savedSettings }),
  }))
  await adminPage.route('**/api/admin/site-settings*', async route => {
    if (route.request().method() === 'PUT') {
      savedPayload = JSON.parse(route.request().postData() || '{}')
      savedSettings = savedPayload
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ settings: savedSettings }),
    })
  })
  await adminPage.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify(session))
  }, { storageKey: key, session: fakeSession(env, { role: 'admin', email: 'admin-test@example.com' }) })

  await adminPage.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
  await adminPage.getByText('Site Info', { exact: true }).first().click()
  await adminPage.getByText('Payment methods', { exact: true }).waitFor({ timeout: 15000 })
  const bankSwitch = adminPage.getByRole('switch', { name: 'Enable Bank Transfer', exact: true })
  assert.strictEqual(await bankSwitch.getAttribute('aria-checked'), 'false', 'Bank Transfer should start disabled')
  await bankSwitch.click()
  assert.strictEqual(await adminPage.getByRole('switch', { name: 'Disable Bank Transfer', exact: true }).getAttribute('aria-checked'), 'true', 'Bank Transfer should toggle on')
  await adminPage.getByText('Save site info', { exact: true }).click()
  await adminPage.getByText('Saved. Your storefront has been updated.', { exact: true }).waitFor({ timeout: 10000 })
  assert.strictEqual(savedPayload.paymentMethods.bank, true, 'Save should persist the toggled method')
  assert.deepStrictEqual(adminErrors, [], 'No admin page errors expected')
  await adminContext.close()

  const customerContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const checkout = await customerContext.newPage()
  const customerErrors = trackPageErrors(checkout)
  await checkout.route('**/api/site-settings*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ settings: savedSettings }),
  }))
  await checkout.addInitScript(({ storageKey, session, product }) => {
    localStorage.setItem(storageKey, JSON.stringify(session))
    localStorage.setItem('cart', JSON.stringify([{ ...product, qty: 1 }]))
  }, { storageKey: key, session: fakeSession(env), product: SAMPLE_PRODUCT })

  await checkout.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' })
  await checkout.getByRole('heading', { name: 'Checkout', exact: true }).waitFor({ timeout: 15000 })
  assert.strictEqual(await checkout.getByText('JazzCash', { exact: true }).count(), 0, 'Disabled JazzCash should be hidden')
  assert.strictEqual(await checkout.getByText('Easypaisa', { exact: true }).count(), 0, 'Disabled Easypaisa should be hidden')
  assert.ok(await checkout.getByText('Cash on Delivery', { exact: true }).count() >= 1, 'COD should be visible')
  assert.deepStrictEqual(customerErrors, [], 'No checkout page errors expected')
  await customerContext.close()

  console.log('PASS payment-methods', JSON.stringify({ saved: savedPayload.paymentMethods }))
  await browser.close()
})().catch(error => {
  console.error('FAIL payment-methods', error.message)
  process.exit(1)
})
