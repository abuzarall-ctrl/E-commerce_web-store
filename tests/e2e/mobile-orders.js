const assert = require('assert')
const { chromium } = require('playwright')
const {
  BASE_URL,
  loadEnv,
  authStorageKey,
  fakeSession,
  sampleOrder,
  trackPageErrors,
} = require('./helpers')

;(async () => {
  const env = loadEnv()
  const order = sampleOrder(env)
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
  const pageErrors = trackPageErrors(page)
  await page.route('**/rest/v1/orders*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Content-Range': '0-0/1' },
    body: JSON.stringify([order]),
  }))
  await page.addInitScript(({ storageKey, session }) => {
    localStorage.setItem(storageKey, JSON.stringify(session))
  }, { storageKey: authStorageKey(env), session: fakeSession(env) })

  await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' })
  await page.getByText('Tap for details ▼', { exact: true }).first().click()
  const receipt = page.getByText('Download receipt (PDF)', { exact: true }).first()
  const buyAgain = page.getByText('Buy again', { exact: true }).first()
  await receipt.waitFor({ timeout: 15000 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  await buyAgain.click()
  await page.getByText('Proceed to Checkout', { exact: true }).waitFor({ timeout: 5000 })

  assert.strictEqual(await receipt.isVisible(), true, 'Receipt button should be visible on mobile')
  assert.strictEqual(await buyAgain.isVisible(), true, 'Buy again should be visible on mobile')
  assert.strictEqual(overflow, 0, 'Orders page should not overflow horizontally')
  assert.deepStrictEqual(pageErrors, [], 'No page errors expected')

  console.log('PASS mobile-orders', JSON.stringify({ overflow, drawerOpened: true }))
  await browser.close()
})().catch(error => {
  console.error('FAIL mobile-orders', error.message)
  process.exit(1)
})
