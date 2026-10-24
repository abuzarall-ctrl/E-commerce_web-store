import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
env.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const separator = trimmed.indexOf('=')
  if (separator === -1) return
  process.env[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim()
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function listAllUsers() {
  const users = []
  let page = 1
  while (page <= 20) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    users.push(...(data.users || []))
    if (!data.nextPage || data.nextPage === page) break
    page = data.nextPage
  }
  return users
}

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase()

  if (!email) {
    const users = await listAllUsers()
    const admins = users.filter(user => ['admin', 'super_admin'].includes(user.app_metadata?.role))
    if (admins.length === 0) {
      console.log('No admin accounts found. Pass an email: node scripts/make-super-admin.mjs you@example.com')
      return
    }
    console.log('Admin accounts:')
    admins.forEach(user => {
      const name = user.user_metadata?.full_name || user.user_metadata?.name || 'no name'
      const lastSeen = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'never signed in'
      console.log(`- ${user.email} (${user.app_metadata.role}) — ${name} — last seen: ${lastSeen}`)
    })
    console.log('\nRun: node scripts/make-super-admin.mjs <email>')
    return
  }

  const users = await listAllUsers()
  const user = users.find(item => item.email?.toLowerCase() === email)
  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exitCode = 1
    return
  }
  if (user.app_metadata?.role === 'super_admin') {
    console.log(`${user.email} is already a super admin.`)
    return
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: 'super_admin' },
  })

  if (error) {
    console.error(`Failed: ${error.message}`)
    process.exitCode = 1
    return
  }
  console.log(`✓ ${data.user.email} is now a super admin. Sign out and sign in again.`)
}

main().catch(error => {
  console.error(`Failed: ${error.message}`)
  process.exitCode = 1
})
