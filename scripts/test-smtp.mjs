import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadEnv() {
  try {
    for (const line of readFileSync(resolve(process.cwd(), '.env.local'), 'utf8').split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch {
    // CI can provide environment variables directly.
  }
}

function samplePdf() {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n',
    '4 0 obj\n<< /Length 52 >>\nstream\nBT /F1 18 Tf 72 760 Td (SMTP attachment test) Tj ET\nendstream\nendobj\n',
  ]
  let pdf = '%PDF-1.4\n'
  for (const object of objects) pdf += object
  return Buffer.from(`${pdf}trailer\n<< /Root 1 0 R >>\n%%EOF`, 'latin1')
}

loadEnv()

const to = process.argv[2] || process.env.SMTP_TEST_TO
const host = process.env.SMTP_HOST
const port = Number(process.env.SMTP_PORT) || 587
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const secure = /^(true|1|yes)$/i.test(process.env.SMTP_SECURE || '') || port === 465
const from = process.env.SMTP_FROM || (user ? `AbuzarStore <${user}>` : 'AbuzarStore <no-reply@localhost>')

if (!to || !host || !user || !pass) {
  console.error('Usage: npm run test:smtp -- you@example.com')
  console.error('Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local or environment.')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
})

try {
  await transporter.verify()
  console.log('SMTP connection verified.')
} catch (error) {
  console.error('SMTP connection failed:', error.message)
  process.exit(1)
}

try {
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'AbuzarStore SMTP test',
    text: 'SMTP is working. The attached PDF verifies that attachments can be delivered.',
    html: '<p>SMTP is working.</p><p>The attached PDF verifies that attachments can be delivered.</p>',
    attachments: [
      {
        filename: 'smtp-test.pdf',
        content: samplePdf(),
        contentType: 'application/pdf',
      },
    ],
  })
  console.log(`Test email sent to ${to}. Message ID: ${info.messageId}`)
  console.log('Check the inbox and confirm the smtp-test.pdf attachment is present.')
} catch (error) {
  console.error('Send failed:', error.message)
  process.exit(1)
}
