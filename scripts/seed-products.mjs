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

const products = [
  {
    name: 'Classic White Tee',
    description: 'A clean, everyday cotton tee. Relaxed fit with a soft hand-feel that works solo or layered.',
    category: 'T-Shirts',
    price: 999,
    discount: 0,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Black Essential Polo',
    description: 'Minimal polo in premium pique cotton. Ribbed collar, two-button placket, clean hem.',
    category: 'T-Shirts',
    price: 1499,
    discount: 10,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1625910513413-5fc42ffe9cc0?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Heather Grey Crew Neck',
    description: 'Lightweight marl jersey in a crew-neck cut. Pre-shrunk, 180 GSM cotton for all-day comfort.',
    category: 'T-Shirts',
    price: 899,
    discount: 0,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Navy Cotton Kurta',
    description: 'Straight-cut kurta in breathable cotton with side slits and a mandarin collar. Perfect for daily wear.',
    category: 'Kurta',
    price: 1899,
    discount: 15,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Ivory Embroidered Kurta',
    description: 'Hand-embroidered chikankari detailing on soft lawn fabric. A timeless piece for festive occasions.',
    category: 'Kurta',
    price: 2799,
    discount: 0,
    stock_status: 'low stock',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Charcoal Straight Kurta',
    description: 'Dyed cotton kurta with a straight silhouette. Features a pocket and tonal stitching.',
    category: 'Kurta',
    price: 1699,
    discount: 5,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'White Shalwar Kameez',
    description: 'Classic white shalwar kameez set in fine cotton. Clean lines, comfortable fit, versatile for any occasion.',
    category: 'Shalwar Kameez',
    price: 2499,
    discount: 0,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sage Green Shalwar Kameez',
    description: 'Muted sage tone with a relaxed shalwar. Soft lawn fabric that drapes well in warm weather.',
    category: 'Shalwar Kameez',
    price: 2699,
    discount: 10,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Black Shalwar Kameez',
    description: 'Versatile black set in premium cotton. Minimal stitching, maximum impact. A wardrobe staple.',
    category: 'Shalwar Kameez',
    price: 2599,
    discount: 0,
    stock_status: 'out of stock',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Khaki Chino Shorts',
    description: 'Tailored chino shorts with a flat front and mid-rise waist. Perfect for casual summer days.',
    category: 'Shorts',
    price: 1199,
    discount: 0,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Navy Drawstring Shorts',
    description: 'Relaxed-fit jersey shorts with an elasticated drawstring waist. Great for lounging or the gym.',
    category: 'Shorts',
    price: 899,
    discount: 20,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Olive Cargo Shorts',
    description: 'Utility-inspired cargo shorts with side pockets. Durable cotton twill built for everyday use.',
    category: 'Shorts',
    price: 1399,
    discount: 0,
    stock_status: 'low stock',
    image_url: 'https://images.unsplash.com/photo-1599738881275-5d96524c49e6?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Charcoal Slim Trousers',
    description: 'Slim-fit trousers in stretch cotton. A modern silhouette that transitions from office to evening.',
    category: 'Trousers',
    price: 1999,
    discount: 10,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Beige Linen Trousers',
    description: 'Lightweight linen-blend trousers with a relaxed fit. Breathable and perfect for warm-weather dressing.',
    category: 'Trousers',
    price: 2199,
    discount: 0,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Black Formal Trousers',
    description: 'Flat-front formal trousers in a tailored fit. Wrinkle-resistant fabric for a polished look all day.',
    category: 'Trousers',
    price: 2399,
    discount: 5,
    stock_status: 'in stock',
    image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
  },
]

async function seed() {
  console.log(`Seeding ${products.length} products...`)
  const { data, error } = await supabase.from('products').insert(products).select()
  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
  console.log(`Done — inserted ${data.length} products.`)
}

seed()
