import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')

const env = {}
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
})

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const images = {
  'Plastic Crockery': '/images/category-plastic.svg',
  Glassware: '/images/category-glassware.svg',
  Melamine: '/images/category-melamine.svg',
}

const products = [
  {
    name: 'Plastic Dinner Plate Set',
    description: 'Set of six BPA-free plastic plates with a clean rim. Lightweight, stackable and dishwasher safe, 10.5 inch.',
    category: 'Plastic Crockery',
    price: 1490,
    discount: 10,
    stock_status: 'in stock',
    is_fast_selling: true,
    is_good_reviews: true,
    image_url: images['Plastic Crockery'],
  },
  {
    name: 'Plastic Serving Bowl Set',
    description: 'Three nesting bowls for salads, sides and snacks. BPA-free, easy to carry and dishwasher safe.',
    category: 'Plastic Crockery',
    price: 1890,
    discount: 0,
    stock_status: 'in stock',
    image_url: images['Plastic Crockery'],
  },
  {
    name: 'Plastic Water Jug with Lid',
    description: '1.8-litre BPA-free jug with a snug lid and comfortable handle. Ideal for water, juice and iced tea.',
    category: 'Plastic Crockery',
    price: 990,
    discount: 0,
    stock_status: 'low stock',
    is_fast_selling: true,
    image_url: images['Plastic Crockery'],
  },
  {
    name: 'Plastic Storage Container Set',
    description: 'Four airtight BPA-free containers for leftovers, dry goods and meal prep. Stackable and dishwasher safe.',
    category: 'Plastic Crockery',
    price: 1690,
    discount: 0,
    stock_status: 'in stock',
    image_url: images['Plastic Crockery'],
  },
  {
    name: 'Plastic Tumbler Set',
    description: 'Set of six reusable plastic tumblers for everyday drinks. BPA-free, stackable and easy to clean.',
    category: 'Plastic Crockery',
    price: 1190,
    discount: 0,
    stock_status: 'in stock',
    image_url: images['Plastic Crockery'],
  },
  {
    name: 'Amber Tumbler Set',
    description: 'Set of six amber glass tumblers with a subtle ribbed texture. Dishwasher safe.',
    category: 'Glassware',
    price: 2890,
    discount: 15,
    stock_status: 'in stock',
    is_fast_selling: true,
    is_good_reviews: true,
    image_url: images.Glassware,
  },
  {
    name: 'Everyday Water Glass Set',
    description: 'Six clear glasses with a slim profile and weighted base. Designed for daily use.',
    category: 'Glassware',
    price: 1990,
    discount: 0,
    stock_status: 'in stock',
    image_url: images.Glassware,
  },
  {
    name: 'Glass Carafe with Lid',
    description: 'One-litre carafe for water, iced tea or lemonade. Includes a snug glass lid.',
    category: 'Glassware',
    price: 2450,
    discount: 0,
    stock_status: 'in stock',
    image_url: images.Glassware,
  },
  {
    name: 'Glass Serving Bowl',
    description: 'Generous 1.5-litre glass bowl for salads, fruit and shared sides. Clear walls show off the table.',
    category: 'Glassware',
    price: 1750,
    discount: 0,
    stock_status: 'in stock',
    image_url: images.Glassware,
  },
  {
    name: 'Melamine Dinner Set',
    description: '18-piece melamine dinner set with dinner plates, side plates and serving bowls. Chip-resistant and easy to clean.',
    category: 'Melamine',
    price: 5990,
    discount: 10,
    stock_status: 'in stock',
    is_good_reviews: true,
    image_url: images.Melamine,
  },
  {
    name: 'Melamine Tea Set',
    description: 'Twelve-piece melamine tea set with cups, saucers and a serving tray. Colourful, sturdy and lightweight.',
    category: 'Melamine',
    price: 3290,
    discount: 0,
    stock_status: 'in stock',
    image_url: images.Melamine,
  },
  {
    name: 'Melamine Serving Tray',
    description: 'Set of two rectangular melamine trays for tea, snacks and everyday serving. Wipe-clean finish.',
    category: 'Melamine',
    price: 1290,
    discount: 0,
    stock_status: 'in stock',
    image_url: images.Melamine,
  },
  {
    name: 'Melamine Bowl Set',
    description: 'Set of six melamine bowls for cereal, soup and snacks. Lightweight with a durable glossy finish.',
    category: 'Melamine',
    price: 2190,
    discount: 5,
    stock_status: 'low stock',
    image_url: images.Melamine,
  },
]

products.forEach(product => {
  if (product.stock_quantity == null) {
    product.stock_quantity = product.stock_status === 'out of stock'
      ? 0
      : product.stock_status === 'low stock'
        ? 4
        : 25
  }
})

async function seed() {
  const { data: existing, error: readError } = await supabase.from('products').select('name')
  if (readError) {
    console.error('Could not read existing products:', readError.message)
    process.exit(1)
  }

  const existingNames = new Set((existing || []).map(product => product.name))
  const missing = products.filter(product => !existingNames.has(product.name))

  if (!missing.length) {
    console.log('All seed products already exist — nothing to insert.')
    return
  }

  console.log(`Seeding ${missing.length} of ${products.length} products...`)
  const { data, error } = await supabase.from('products').insert(missing).select()
  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
  console.log(`Done — inserted ${data.length} products.`)
}

seed()
