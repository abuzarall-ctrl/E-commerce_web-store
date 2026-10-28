import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  const file = resolve(process.cwd(), '.env.local')
  try {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    // CI can provide environment variables directly.
  }
}

loadEnv()

const email = process.argv[2]
const password = process.env.ADMIN_NEW_PASSWORD || process.argv[3]

if (!email || !password) {
  console.log('Usage: ADMIN_NEW_PASSWORD="new-strong-password" node scripts/reset-admin-password.mjs admin@example.com')
  console.log('The password is read from ADMIN_NEW_PASSWORD so it does not appear in shell history.')
  process.exit(1)
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters. Use 12+ and a password manager.')
  process.exit(1)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (error) {
  console.error('Could not list users:', error.message)
  process.exit(1)
}

const user = data.users.find(candidate => candidate.email?.toLowerCase() === email.toLowerCase())
if (!user) {
  console.error(`No user found with email: ${email}`)
  console.error('Create the user first in Supabase → Authentication → Users → Add user.')
  process.exit(1)
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password })
if (updateError) {
  console.error('Password reset failed:', updateError.message)
  process.exit(1)
}

console.log(`Password updated for ${user.email}. Sign in at /admin/login to enroll or verify TOTP MFA.`)
