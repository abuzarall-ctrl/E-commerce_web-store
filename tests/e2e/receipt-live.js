const assert = require('assert')
const { createClient } = require('@supabase/supabase-js')
const { BASE_URL, loadEnv } = require('./helpers')

;(async () => {
  const env = loadEnv()
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  }

  const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: order, error } = await client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) throw error

  const details = order.products?.delivery || {}
  const contact = order.customer_email || order.customer_phone || details.email || details.phone || ''
  const response = await fetch(`${BASE_URL}/api/orders/receipt?id=${encodeURIComponent(order.id)}&contact=${encodeURIComponent(contact)}`)
  const buffer = Buffer.from(await response.arrayBuffer())

  assert.strictEqual(response.status, 200, `Receipt API returned ${response.status}`)
  assert.match(response.headers.get('content-type') || '', /application\/pdf/, 'Expected a PDF response')
  assert.strictEqual(buffer.subarray(0, 8).toString('latin1'), '%PDF-1.4', 'Invalid PDF header')
  assert.match(buffer.subarray(-6).toString('latin1'), /%%EOF/, 'PDF should end with %%EOF')

  console.log('PASS receipt-live', JSON.stringify({ bytes: buffer.length, orderStatus: order.status }))
})().catch(error => {
  console.error('FAIL receipt-live', error.message)
  process.exit(1)
})
