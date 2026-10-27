const assert = require('assert')
const { chromium } = require('playwright')
const { BASE_URL, mockProducts, trackPageErrors } = require('./helpers')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const pageErrors = trackPageErrors(page)
  await mockProducts(page)

  await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })

  const addButton = page.locator('button:has-text("Add to Cart")').first()
  await addButton.waitFor({ state: 'visible', timeout: 15000 })
  await addButton.click()
  await page.getByText('Added!', { exact: true }).waitFor({ timeout: 5000 })

  await page.locator('div[style*="rgba(212, 163, 115, 0.12)"]').first().click()
  await page.getByText('Proceed to Checkout', { exact: true }).waitFor({ timeout: 5000 })
  await page.getByText('Proceed to Checkout', { exact: true }).click()

  await page.waitForURL('**/checkout', { timeout: 15000 })
  await page.getByRole('heading', { name: 'Checkout', exact: true }).waitFor({ timeout: 15000 })
  const placeOrder = await page.locator('button:has-text("Place Order")').isVisible()
  const adminBlocked = await page.getByText('Admin accounts cannot place orders', { exact: true }).count()

  assert.strictEqual(placeOrder, true, 'Place Order button should be visible')
  assert.strictEqual(adminBlocked, 0, 'Guest checkout should not show admin block')
  assert.deepStrictEqual(pageErrors, [], 'No page errors expected')

  console.log('PASS guest-checkout', JSON.stringify({ placeOrder, adminBlocked }))
  await browser.close()
})().catch(error => {
  console.error('FAIL guest-checkout', error.message)
  process.exit(1)
})
