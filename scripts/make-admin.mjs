import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
env.split('\n').forEach(line => {
  const [key, val] = line.split('=')
  if (key && val) process.env[key.trim()] = val.trim()
})

const email = process.argv[2]
if (!email) {
  console.log('Usage: node scripts/make-admin.mjs your@email.com')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
if (listErr) { console.error('Error:', listErr.message); process.exit(1) }

const user = users.find(u => u.email === email)
if (!user) { console.error(`No user found with email: ${email}`); process.exit(1) }

const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { role: 'admin' }
})

if (error) { console.error('Failed:', error.message); process.exit(1) }
console.log(`✓ Admin granted to ${data.user.email}`)
