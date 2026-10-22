import { CATEGORIES, STOCK_STATUSES } from './categories'

const HEADER_ALIASES = {
  name: 'name',
  title: 'name',
  product: 'name',
  productname: 'name',
  description: 'description',
  details: 'description',
  category: 'category',
  collection: 'category',
  price: 'price',
  cost: 'price',
  discount: 'discount',
  discountpercent: 'discount',
  stock: 'stock_status',
  stockstatus: 'stock_status',
  availability: 'stock_status',
  image: 'image_url',
  imageurl: 'image_url',
  photo: 'image_url',
  picture: 'image_url',
}

function normaliseHeader(value) {
  return String(value || '').toLowerCase().replace(/[\s_-]+/g, '')
}

export function detectDelimiter(text) {
  const firstLine = String(text || '').split(/\r?\n/)[0] || ''
  const counts = { ',': 0, '\t': 0, ';': 0 }
  let inQuotes = false
  for (const char of firstLine) {
    if (char === '"') inQuotes = !inQuotes
    else if (!inQuotes && char in counts) counts[char] += 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

export function parseDelimited(text) {
  const source = String(text || '').replace(/^\uFEFF/, '')
  const delimiter = detectDelimiter(source)
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter(cells => cells.some(cell => String(cell).trim() !== ''))
}

export function parseProductSheet(text) {
  const rows = parseDelimited(text)
  if (rows.length < 2) {
    return { products: [], errors: ['Add a header row and at least one product row.'] }
  }

  const headers = rows[0].map(header => HEADER_ALIASES[normaliseHeader(header)] || '')
  if (!headers.includes('name') || !headers.includes('price')) {
    return { products: [], errors: ['The sheet needs "name" and "price" columns.'] }
  }

  const products = []
  const errors = []

  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2
    const record = {}
    headers.forEach((key, cellIndex) => {
      if (key) record[key] = String(cells[cellIndex] ?? '').trim()
    })

    const price = Number(record.price)
    if (!record.name) {
      errors.push(`Row ${rowNumber}: product name is required.`)
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Row ${rowNumber}: price must be a valid number.`)
      return
    }

    const category = CATEGORIES.includes(record.category) ? record.category : CATEGORIES[0]
    const stockStatus = STOCK_STATUSES.includes(record.stock_status) ? record.stock_status : STOCK_STATUSES[0]

    products.push({
      name: record.name,
      description: record.description || '',
      category,
      price,
      discount: Math.min(100, Math.max(0, Number(record.discount) || 0)),
      stock_status: stockStatus,
      image_url: record.image_url || '',
    })
  })

  if (products.length === 0 && errors.length === 0) {
    errors.push('No product rows found.')
  }

  return { products, errors }
}

export const CSV_TEMPLATE = [
  'name,description,category,price,discount,stock_status,image_url',
  '"Plastic Dinner Plate Set","Set of 6 BPA-free plastic plates, 10.5 inch",Plastic Crockery,1450,0,in stock,/images/category-plastic.svg',
  '"Amber Drinking Glass Set","Set of 6 amber tumblers, dishwasher safe",Glassware,1890,10,in stock,/images/category-glassware.svg',
  '"Melamine Dinner Set","18-piece melamine dinner set with serving bowls",Melamine,4990,0,in stock,/images/category-melamine.svg',
].join('\n')

export function downloadTextFile(filename, contents) {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
