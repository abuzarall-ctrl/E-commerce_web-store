'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { FiArrowRight, FiCheck, FiHeart, FiRotateCcw, FiTruck } from 'react-icons/fi'
import Navbar from './components/Navbar'
import ProductCardSkeleton from './components/ProductCardSkeleton'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const ProductCard = dynamic(() => import('./components/ProductCard'), { ssr: false })
const Footer = dynamic(() => import('./components/Footer'), { ssr: false })

const categories = [
  { title: 'Everyday Essentials', label: 'T-Shirts & polos', category: 'T-Shirts', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85' },
  { title: 'Modern Tradition', label: 'Kurta collection', category: 'Kurta', image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=900&q=85' },
  { title: 'Tailored Comfort', label: 'Trousers & more', category: 'Trousers', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85' },
]

export default function Home() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.from('products').select('*').limit(4).then(({ data }) => {
      setProducts(data || [])
      setLoading(false)
    })
  }, [])

  const shop = (category) => router.push(category ? `/shop?category=${encodeURIComponent(category)}` : '/shop')

  return (
    <main className="fashion-home">
      <Navbar />

      <section className="fashion-hero">
        <video className="fashion-hero__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/videos/clothes-loop.mp4" type="video/mp4" />
        </video>
        <div className="fashion-hero__shade" />
        <motion.div className="fashion-hero__content" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <p className="eyebrow eyebrow--light">New season / 2026</p>
          <h1>Style that feels<br /><em>like you.</em></h1>
          <p className="fashion-hero__copy">Thoughtful everyday clothing, designed for comfortable confidence and made to go wherever life takes you.</p>
          <div className="fashion-hero__actions">
            <button className="button button--cream" onClick={() => shop()}>Shop new arrivals <FiArrowRight /></button>
            <button className="text-button text-button--light" onClick={() => shop('Kurta')}>Explore the edit</button>
          </div>
        </motion.div>
        <div className="fashion-hero__note">Free delivery on orders over Rs. 3,000 <span>&bull;</span> Easy 7-day returns</div>
      </section>

      <section className="intro-section content-width">
        <div>
          <p className="eyebrow">The Abuzar edit</p>
          <h2>Pieces for the <em>everyday.</em></h2>
        </div>
        <p className="intro-section__copy">A refined wardrobe of familiar essentials. Good fabric, considered cuts and the kind of quality you can feel from the first wear.</p>
      </section>

      <section className="category-showcase content-width">
        {categories.map((item, index) => (
          <motion.button className={`category-tile category-tile--${index + 1}`} key={item.title} onClick={() => shop(item.category)} whileHover={{ y: -5 }}>
            <Image src={item.image} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" />
            <span className="category-tile__veil" />
            <span className="category-tile__body"><small>{item.label}</small><strong>{item.title}</strong><span>Shop collection <FiArrowRight /></span></span>
          </motion.button>
        ))}
      </section>

      <section className="products-section content-width">
        <div className="section-heading">
          <div><p className="eyebrow">Made to be worn</p><h2>Featured <em>favourites.</em></h2></div>
          <button className="text-button" onClick={() => shop()}>View all pieces <FiArrowRight /></button>
        </div>
        {loading ? <div className="featured-grid">{[0, 1, 2, 3].map(i => <ProductCardSkeleton key={i} index={i} />)}</div>
          : products.length ? <div className="featured-grid">{products.map(product => <ProductCard product={product} key={product.id} />)}</div>
          : <p className="empty-products">The new collection is on its way. Visit the shop to browse what is available.</p>}
      </section>

      <section className="editorial-band">
        <div className="editorial-band__photo" />
        <div className="editorial-band__content">
          <p className="eyebrow eyebrow--light">Wear it your way</p>
          <h2>Comfort, without<br /><em>compromise.</em></h2>
          <p>From a relaxed morning to a full day out, the best clothes are the ones you never have to think twice about.</p>
          <button className="button button--cream" onClick={() => shop('Shalwar Kameez')}>Discover traditional wear <FiArrowRight /></button>
        </div>
      </section>

      <section className="promise-section content-width">
        <div className="promise-section__heading"><p className="eyebrow">Our promise</p><h2>Good clothing is<br /><em>simple.</em></h2></div>
        <div className="promise-grid">
          {[
            [FiCheck, 'Made for real life', 'Comfortable fits and durable fabrics that earn their place in your wardrobe.'],
            [FiTruck, 'Delivered with care', 'Reliable delivery across Pakistan, with transparent tracking along the way.'],
            [FiRotateCcw, 'Easy returns', 'Take your time. If it is not the right fit, we make returns straightforward.'],
            [FiHeart, 'Honest quality', 'Thoughtfully sourced pieces, offered at a price that makes sense.'],
          ].map(([Icon, title, copy]) => <div className="promise-card" key={title}><Icon /><h3>{title}</h3><p>{copy}</p></div>)}
        </div>
      </section>

      <section className="newsletter content-width">
        <div><p className="eyebrow">A note from us</p><h2>First look at what&apos;s <em>next.</em></h2><p>New drops, styling notes and a little more good stuff, occasionally.</p></div>
        <form onSubmit={(event) => event.preventDefault()}><input aria-label="Email address" placeholder="Your email address" type="email" /><button className="button" type="submit">Keep me posted <FiArrowRight /></button></form>
      </section>
      <Footer />
    </main>
  )
}
