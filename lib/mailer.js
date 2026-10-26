import nodemailer from 'nodemailer'
import { getOrderDetails } from './orderPayload'
import { buildOrderReceiptPdf, orderReceiptFilename } from './orderReceipt'
import { formatMoney as money, orderItems, orderNumber, orderTotal, paymentLabel } from './orderSummary'

const STORE_NAME = process.env.STORE_NAME?.trim() || 'AbuzarStore'

function smtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT) || 587
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '')
  const secure = process.env.SMTP_SECURE
    ? /^(true|1|yes)$/i.test(process.env.SMTP_SECURE)
    : port === 465
  const from = String(process.env.SMTP_FROM || '').trim()
    || (user ? `${STORE_NAME} <${user}>` : `${STORE_NAME} <no-reply@localhost>`)

  return { host, port, user, pass, secure, from }
}

export function isMailConfigured() {
  return Boolean(smtpConfig().host)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

function buildText(order) {
  const details = getOrderDetails(order)
  const items = orderItems(order)
  const total = orderTotal(order)
  const lines = [
    `Hi ${details.delivery.name || 'there'},`,
    '',
    `Your order #${orderNumber(order)} has been confirmed. Thank you for shopping with ${STORE_NAME}!`,
    '',
    'Items:',
    ...items.map(item => `- ${item.quantity} x ${item.name} — ${money(item.lineTotal)}`),
    '',
    `Total: ${money(total)}`,
    `Payment: ${paymentLabel(order, details)}`,
    '',
    'Delivery address:',
    details.delivery.address,
    details.delivery.city,
    details.delivery.phone,
    '',
    'Your official order receipt is attached to this email. Keep it as proof of purchase.',
    `We'll contact you when your order is on the way.`,
    `${STORE_NAME}`,
  ]
  return lines.join('\n')
}

function buildHtml(order) {
  const details = getOrderDetails(order)
  const items = orderItems(order)
  const total = orderTotal(order)
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ece6dc;color:#2f3b38;font-size:14px;">
        ${escapeHtml(item.name)}
        ${item.category ? `<span style="display:block;font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:.6px;">${escapeHtml(item.category)}</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #ece6dc;color:#5f6b66;font-size:13px;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ece6dc;color:#2f3b38;font-size:13px;text-align:right;white-space:nowrap;">${money(item.lineTotal)}</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f1e9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e9;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e6e0d4;">
            <tr>
              <td style="background:#0b5f5a;padding:26px 28px;">
                <p style="margin:0;color:#d6eee8;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">${escapeHtml(STORE_NAME)}</p>
                <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;line-height:1.2;">Order confirmed</h1>
                <p style="margin:8px 0 0;color:#d6eee8;font-size:14px;">Order #${escapeHtml(orderNumber(order))}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 8px;color:#2f3b38;font-size:15px;">Hi ${escapeHtml(details.delivery.name || 'there')},</p>
                <p style="margin:0 0 22px;color:#5f6b66;font-size:14px;line-height:1.7;">
                  Thank you for your order. We have confirmed it and will contact you when it is on the way.
                </p>

                <p style="margin:0 0 22px;padding:12px 14px;background:#eef7f3;border-radius:8px;color:#0b5f5a;font-size:13px;line-height:1.6;">
                  Your official order receipt is attached as a PDF. Keep it as proof of purchase.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                  <thead>
                    <tr>
                      <th align="left" style="font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Item</th>
                      <th align="center" style="font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Qty</th>
                      <th align="right" style="font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" style="padding:14px 0 0;color:#2f3b38;font-size:15px;font-weight:bold;">Total</td>
                      <td align="right" style="padding:14px 0 0;color:#0b5f5a;font-size:18px;font-weight:bold;white-space:nowrap;">${money(total)}</td>
                    </tr>
                  </tfoot>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;border-radius:10px;margin-bottom:20px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 4px;font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Payment</p>
                      <p style="margin:0 0 12px;font-size:14px;color:#2f3b38;">${escapeHtml(paymentLabel(order, details))}</p>
                      <p style="margin:0 0 4px;font-size:11px;color:#8a918d;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Delivery address</p>
                      <p style="margin:0;font-size:14px;color:#2f3b38;line-height:1.6;">
                        ${escapeHtml(details.delivery.address)}<br />
                        ${escapeHtml(details.delivery.city)}<br />
                        ${escapeHtml(details.delivery.phone)}
                      </p>
                    </td>
                  </tr>
                </table>

                ${details.notes ? `<p style="margin:0 0 18px;font-size:13px;color:#5f6b66;"><strong>Note:</strong> ${escapeHtml(details.notes)}</p>` : ''}

                <p style="margin:0;color:#8a918d;font-size:12px;line-height:1.7;">
                  Need help? Reply to this email or contact us with your order number.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#f7f4ee;color:#8a918d;font-size:11px;text-align:center;">
                ${escapeHtml(STORE_NAME)} &middot; This is an automated order confirmation.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendOrderConfirmationEmail(order, { paymentReceipt } = {}) {
  const config = smtpConfig()
  if (!config.host) {
    return { skipped: true, reason: 'SMTP is not configured.' }
  }

  const details = getOrderDetails(order)
  const to = String(details.delivery.email || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { skipped: true, reason: 'Order has no valid email address.' }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  })

  const attachments = [
    {
      filename: orderReceiptFilename(order),
      content: buildOrderReceiptPdf(order),
      contentType: 'application/pdf',
    },
  ]

  if (paymentReceipt?.content) {
    attachments.push({
      filename: paymentReceipt.filename || 'payment-receipt',
      content: paymentReceipt.content,
      contentType: paymentReceipt.contentType || 'application/octet-stream',
    })
  }

  const info = await transporter.sendMail({
    from: config.from,
    to,
    subject: `Order confirmed · #${orderNumber(order)} · ${STORE_NAME}`,
    text: buildText(order),
    html: buildHtml(order),
    attachments,
  })

  return { sent: true, id: info.messageId, to, attachments: attachments.length }
}
