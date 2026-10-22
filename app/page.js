'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { CATEGORIES } from '@/lib/categories'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiHeart, FiRotateCcw, FiTruck } from 'react-icons/fi'
import Navbar from './components/Navbar'
import ProductCardSkeleton from './components/ProductCardSkeleton'
import { useSiteSettings } from './components/SiteSettingsProvider'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const ProductCard = dynamic(() => import('./components/ProductCard'), { ssr: false })
const Footer = dynamic(() => import('./components/Footer'), { ssr: false })

const collections = [
  {
    title: 'Plastic Crockery',
    label: 'Lightweight & durable',
    category: 'Plastic Crockery',
    image: '/images/category-plastic.svg',
  },
  {
    title: 'Glassware',
    label: 'Everyday glass',
    category: 'Glassware',
    image: '/images/category-glassware.svg',
  },
  {
    title: 'Melamine',
    label: 'Colourful & sturdy',
    category: 'Melamine',
    image: '/images/category-melamine.svg',
  },
]

export default function Home() {
  const router = useRouter()
  const siteSettings = useSiteSettings()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(() => Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    supabase.from('products').select('*').in('category', CATEGORIES).limit(24).then(({ data }) => {
      const all = data || []
      const picked = CATEGORIES.map(category => all.find(product => product.category === category)).filter(Boolean)
      all.forEach(product => {
        if (picked.length < 4 && !picked.includes(product)) picked.push(product)
      })
      setProducts(picked.slice(0, 4))
      setLoading(false)
    })
  }, [])

  const shop = (category) => router.push(category ? `/shop?category=${encodeURIComponent(category)}` : '/shop')

  return (
    <main className="fashion-home">
      <Navbar />

      <section className="fashion-hero">
        <Image
          className="fashion-hero__media"
          src="/images/hero-crockery.svg"
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="fashion-hero__shade" />
        <motion.div className="fashion-hero__content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <p className="eyebrow eyebrow--light">Plastic &bull; Glass &bull; Melamine</p>
          <h1>Made for the<br /><em>everyday table.</em></h1>
          <p className="fashion-hero__copy">Plastic, glass and melamine crockery chosen for the way you actually eat, serve and gather. Practical pieces, honest prices, delivered across Pakistan.</p>
          <div className="fashion-hero__actions">
            <button className="button button--cream" onClick={() => shop()}>Shop the collection <FiArrowRight /></button>
            <button className="text-button text-button--light" onClick={() => shop('Glassware')}>Explore glassware</button>
          </div>
        </motion.div>
        <div className="fashion-hero__note">{siteSettings.announcement} <span>&bull;</span> {siteSettings.returnsNote}</div>
      </section>

      <section className="intro-section content-width">
        <div>
          <p className="eyebrow">The Abuzar table edit</p>
          <h2>Pieces that make the <em>everyday table feel considered.</em></h2>
        </div>
        <p className="intro-section__copy">From the dinner plate you reach for every night to the jug that moves from fridge to table. We look for practical shapes, easy-care finishes and the kind of quality that holds up to daily meals.</p>
      </section>

      <section className="category-showcase content-width">
        {collections.map((item, index) => (
          <motion.button className={`category-tile category-tile--${index + 1}`} key={item.title} onClick={() => shop(item.category)} whileHover={{ y: -5 }}>
            <Image src={item.image} alt="" fill sizes="(max-width: 760px) 100vw, 25vw" />
            <span className="category-tile__veil" />
            <span className="category-tile__body"><small>{item.label}</small><strong>{item.title}</strong><span>Shop collection <FiArrowRight /></span></span>
          </motion.button>
        ))}
      </section>

      <section className="products-section content-width">
        <div className="section-heading">
          <div><p className="eyebrow">New in the shop</p><h2>Featured <em>favourites.</em></h2></div>
          <button className="text-button" onClick={() => shop()}>View all pieces <FiArrowRight /></button>
        </div>
        {loading ? <div className="featured-grid">{[0, 1, 2, 3].map(i => <ProductCardSkeleton key={i} index={i} />)}</div>
          : products.length ? <div className="featured-grid">{products.map(product => <ProductCard product={product} key={product.id} />)}</div>
          : <div className="empty-products">
            <p>New crockery pieces are being prepared. Visit the shop to browse everything currently available.</p>
            <button className="text-button" onClick={() => shop()}>Browse the shop <FiArrowRight /></button>
          </div>}
      </section>

      <section className="editorial-band">
        <div className="editorial-band__photo" />
        <div className="editorial-band__content">
          <p className="eyebrow eyebrow--light">Set the table, slowly</p>
          <h2>Small rituals,<br /><em>better everyday.</em></h2>
          <p>Layered plates, a favourite glass, a generous serving bowl. The pieces you use every day should feel good in the hand and easy to live with.</p>
          <button className="button button--cream" onClick={() => shop()}>Shop the collection <FiArrowRight /></button>
        </div>
      </section>

      <section className="promise-section content-width">
        <div className="promise-section__heading"><p className="eyebrow">Our promise</p><h2>Good things for<br /><em>the everyday.</em></h2></div>
        <div className="promise-grid">
          {[
            [FiCheck, 'Chosen to last', 'Durable materials, food-safe finishes and pieces that hold up to daily use.'],
            [FiTruck, 'Packed with care', 'Reliable delivery across Pakistan, with transparent tracking along the way.'],
            [FiRotateCcw, 'Easy returns', 'Changed your mind? Seven days to return unused items, no awkward questions.'],
            [FiHeart, 'Fair prices', 'Direct sourcing and a focused range keep quality high and prices honest.'],
          ].map(([Icon, title, copy]) => <div className="promise-card" key={title}><Icon /><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="newsletter content-width">
        <div><p className="eyebrow">A note from us</p><h2>First look at what&apos;s <em>next.</em></h2><p>New arrivals, table ideas and a little more good stuff, occasionally.</p></div>
        <form onSubmit={(event) => event.preventDefault()}><input aria-label="Email address" placeholder="Your email address" type="email" /><button className="button" type="submit">Keep me posted <FiArrowRight /></button></form>
      </section>
      <Footer />
    </main>
  )
}
