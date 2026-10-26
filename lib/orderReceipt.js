import { getOrderDetails } from './orderPayload'
import {
  formatMoney,
  formatOrderDate,
  orderItems,
  orderNumber,
  orderTotal,
  paymentLabel,
} from './orderSummary'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const STORE_NAME = process.env.STORE_NAME?.trim() || 'AbuzarStore'

const COLORS = {
  ink: [0.071, 0.145, 0.137],
  body: [0.373, 0.42, 0.4],
  muted: [0.541, 0.569, 0.553],
  accent: [0.498, 0.82, 0.749],
  accentDark: [0.043, 0.373, 0.353],
  cream: [0.961, 0.945, 0.914],
  line: [0.902, 0.878, 0.831],
  white: [1, 1, 1],
}

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
}

function toPdfText(value) {
  return String(value ?? '')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u00b7/g, '-')
    .replace(/[^\x20-\x7E]/g, '?')
}

function escapePdf(value) {
  return toPdfText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function colorCmd(color) {
  return `${color[0]} ${color[1]} ${color[2]}`
}

function textWidth(value, size) {
  return toPdfText(value).length * size * 0.52
}

function clamp(value, max) {
  const text = toPdfText(value)
  if (text.length <= max) return text
  return `${text.slice(0, Math.max(1, max - 1))}...`
}

function drawText(ops, x, y, value, { size = 10, bold = false, color = COLORS.ink } = {}) {
  const font = bold ? 'F2' : 'F1'
  ops.push(`BT ${colorCmd(color)} rg /${font} ${size} Tf ${x} ${y} Td (${escapePdf(value)}) Tj ET`)
}

function drawRightText(ops, right, y, value, options = {}) {
  const size = options.size ?? 10
  drawText(ops, right - textWidth(value, size), y, value, options)
}

function drawRect(ops, x, y, width, height, color) {
  ops.push(`${colorCmd(color)} rg ${x} ${y} ${width} ${height} re f`)
}

function drawLine(ops, x1, y1, x2, y2, color = COLORS.line, width = 0.7) {
  ops.push(`${colorCmd(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
}

function header(ops) {
  drawRect(ops, 0, PAGE_HEIGHT - 96, PAGE_WIDTH, 96, COLORS.ink)
  drawText(ops, MARGIN, PAGE_HEIGHT - 50, STORE_NAME, { size: 19, bold: true, color: COLORS.white })
  drawText(ops, MARGIN, PAGE_HEIGHT - 68, 'Everyday crockery, delivered across Pakistan', {
    size: 9,
    color: COLORS.accent,
  })
  drawRightText(ops, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 54, 'ORDER RECEIPT', {
    size: 15,
    bold: true,
    color: COLORS.white,
  })
  drawRightText(ops, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 70, 'Proof of purchase', {
    size: 9,
    color: COLORS.accent,
  })
}

function tableHeader(ops, y) {
  drawRect(ops, MARGIN, y - 6, CONTENT_WIDTH, 24, COLORS.cream)
  drawText(ops, MARGIN + 10, y + 2, 'ITEM', { size: 8, bold: true, color: COLORS.muted })
  drawRightText(ops, 400, y + 2, 'QTY', { size: 8, bold: true, color: COLORS.muted })
  drawRightText(ops, 470, y + 2, 'UNIT PRICE', { size: 8, bold: true, color: COLORS.muted })
  drawRightText(ops, PAGE_WIDTH - MARGIN - 10, y + 2, 'AMOUNT', { size: 8, bold: true, color: COLORS.muted })
  return y - 26
}

function footer(ops, pageNumber, pageCount, order) {
  drawLine(ops, MARGIN, 58, PAGE_WIDTH - MARGIN, 58, COLORS.line)
  drawText(ops, MARGIN, 42, `${STORE_NAME} - Order #${orderNumber(order)}`, { size: 8, color: COLORS.muted })
  drawRightText(ops, PAGE_WIDTH - MARGIN, 42, `Page ${pageNumber} of ${pageCount}`, {
    size: 8,
    color: COLORS.muted,
  })
}

function serializePdf(pageStreams) {
  const objects = {}
  const firstPageObject = 5
  const pageObjects = pageStreams.map((_, index) => firstPageObject + index * 2)
  const contentObjects = pageStreams.map((_, index) => firstPageObject + index * 2 + 1)

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageObjects.map(ref => `${ref} 0 R`).join(' ')}] /Count ${pageStreams.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  pageStreams.forEach((stream, index) => {
    const streamBuffer = Buffer.from(stream, 'latin1')
    objects[pageObjects[index]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjects[index]} 0 R >>`
    objects[contentObjects[index]] = `<< /Length ${streamBuffer.length} >>\nstream\n${stream}\nendstream`
  })

  const maxObject = Math.max(...Object.keys(objects).map(Number))
  let pdf = '%PDF-1.4\n'
  const offsets = []

  for (let index = 1; index <= maxObject; index += 1) {
    offsets[index] = Buffer.byteLength(pdf, 'latin1')
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefStart = Buffer.byteLength(pdf, 'latin1')
  pdf += `xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`
  for (let index = 1; index <= maxObject; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return Buffer.from(pdf, 'latin1')
}

export function buildOrderReceiptPdf(order) {
  const details = getOrderDetails(order)
  const items = orderItems(order)
  const total = orderTotal(order)
  const receiptNumber = orderNumber(order)
  const pageStreams = []
  let ops = []
  let y = PAGE_HEIGHT - 120

  const startPage = () => {
    ops = []
    header(ops)
    y = PAGE_HEIGHT - 120
  }

  const finishPage = () => {
    pageStreams.push(ops.join('\n'))
  }

  const newPage = () => {
    finishPage()
    ops = []
    drawRect(ops, 0, PAGE_HEIGHT - 60, PAGE_WIDTH, 60, COLORS.ink)
    drawText(ops, MARGIN, PAGE_HEIGHT - 32, STORE_NAME, { size: 13, bold: true, color: COLORS.white })
    drawRightText(ops, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 32, `Order #${receiptNumber} - continued`, {
      size: 9,
      color: COLORS.accent,
    })
    y = PAGE_HEIGHT - 92
    y = tableHeader(ops, y)
  }

  startPage()

  drawText(ops, MARGIN, y, 'Receipt details', { size: 8, bold: true, color: COLORS.accentDark })
  y -= 18
  drawText(ops, MARGIN, y, `Order #${receiptNumber}`, { size: 17, bold: true })
  drawRightText(ops, PAGE_WIDTH - MARGIN, y, STATUS_LABELS[order.status] || String(order.status || 'Pending'), {
    size: 12,
    bold: true,
    color: COLORS.accentDark,
  })
  y -= 20
  drawText(ops, MARGIN, y, `Placed ${formatOrderDate(order.created_at)}`, { size: 9, color: COLORS.muted })
  y -= 14
  drawText(ops, MARGIN, y, `Payment: ${paymentLabel(order, details)}`, { size: 9, color: COLORS.muted })
  y -= 32

  const billToX = MARGIN
  drawText(ops, billToX, y, 'BILLED TO', { size: 8, bold: true, color: COLORS.muted })
  drawText(ops, billToX + 220, y, 'DELIVER TO', { size: 8, bold: true, color: COLORS.muted })
  y -= 16
  drawText(ops, billToX, y, clamp(details.delivery.name || 'Customer', 34), { size: 11, bold: true })
  drawText(ops, billToX + 220, y, clamp(details.delivery.address || 'Address not provided', 38), { size: 10 })
  y -= 14
  drawText(ops, billToX, y, clamp(details.delivery.phone || '', 34), { size: 9, color: COLORS.body })
  drawText(ops, billToX + 220, y, clamp(details.delivery.city || '', 38), { size: 9, color: COLORS.body })
  y -= 14
  drawText(ops, billToX, y, clamp(details.delivery.email || '', 34), { size: 9, color: COLORS.body })
  drawText(ops, billToX + 220, y, clamp(details.delivery.phone || '', 38), { size: 9, color: COLORS.body })
  y -= 30

  y = tableHeader(ops, y)

  for (const item of items) {
    if (y < 110) newPage()
    const label = item.category ? `${item.name} - ${item.category}` : item.name
    drawText(ops, MARGIN + 10, y, clamp(label, 48), { size: 9.5, color: COLORS.ink })
    drawRightText(ops, 400, y, String(item.quantity), { size: 9.5, color: COLORS.body })
    drawRightText(ops, 470, y, formatMoney(item.unitPrice), { size: 9.5, color: COLORS.body })
    drawRightText(ops, PAGE_WIDTH - MARGIN - 10, y, formatMoney(item.lineTotal), { size: 9.5, bold: true })
    y -= 16
    drawLine(ops, MARGIN, y + 5, PAGE_WIDTH - MARGIN, y + 5)
    y -= 10
  }

  if (y < 190) newPage()

  y -= 4
  drawRect(ops, MARGIN + 250, y - 52, CONTENT_WIDTH - 250, 64, COLORS.cream)
  drawText(ops, MARGIN + 266, y - 6, 'Order total', { size: 9, color: COLORS.muted })
  drawRightText(ops, PAGE_WIDTH - MARGIN - 16, y - 6, formatMoney(total), {
    size: 17,
    bold: true,
    color: COLORS.accentDark,
  })
  drawText(ops, MARGIN + 266, y - 26, `${items.reduce((sum, item) => sum + item.quantity, 0)} item(s) - ${paymentLabel(order, details)}`, {
    size: 8,
    color: COLORS.muted,
  })
  drawRightText(ops, PAGE_WIDTH - MARGIN - 16, y - 26, `Status: ${STATUS_LABELS[order.status] || order.status || 'Pending'}`, {
    size: 8,
    color: COLORS.muted,
  })

  if (details.notes) {
    y -= 82
    drawText(ops, MARGIN, y, 'Order note', { size: 8, bold: true, color: COLORS.muted })
    y -= 14
    drawText(ops, MARGIN, y, clamp(details.notes, 110), { size: 9, color: COLORS.body })
  }

  y -= 46
  drawText(ops, MARGIN, Math.max(y, 84), 'Thank you for shopping with us. Keep this receipt as proof of purchase.', {
    size: 8.5,
    color: COLORS.muted,
  })

  finishPage()

  pageStreams.forEach((stream, index) => {
    const footerOps = []
    footer(footerOps, index + 1, pageStreams.length, order)
    pageStreams[index] = `${stream}\n${footerOps.join('\n')}`
  })

  return serializePdf(pageStreams)
}

export function orderReceiptFilename(order) {
  return `${STORE_NAME.replace(/[^a-z0-9]+/gi, '-')}-receipt-${orderNumber(order) || 'order'}.pdf`
}
