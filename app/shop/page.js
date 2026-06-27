'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiX, FiFilter } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'

const categories = ['All', 'T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers']

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } }
}
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
}

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      if (data) { setProducts(data); setFiltered(data) }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = products
    if (search.length >= 2) {
      result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (category !== 'All') result = result.filter(p => p.category === category)
    if (stockFilter !== 'All') result = result.filter(p => p.stock_status === stockFilter)
    setFiltered(result)
  }, [search, category, stockFilter, products])

  return (
    <>
      <style>{`
        .shop-categories { overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }
        .shop-categories::-webkit-scrollbar { display: none; }
        @media (max-width: 640px) {
          .shop-inner-pad { padding: 20px 16px !important; }
          .shop-heading { font-size: 22px !important; }
          .shop-filters-row { flex-direction: column !important; }
          .shop-stock-select { width: 100% !important; }
          .product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
        }
        @media (max-width: 360px) {
          .product-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />

        {/* Header band */}
        <div style={{
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '36px 24px 28px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <motion.p
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: '11px', color: 'var(--accent)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px' }}>
              AbuzarStore
            </motion.p>
            <motion.h1
              className="shop-heading"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
              Shop All Products
            </motion.h1>
            <AnimatePresence mode="wait">
              <motion.p
                key={filtered.length + '-' + loading}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
                {loading ? 'Loading collection...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="shop-inner-pad" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '28px 24px', flex: 1 }}>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            style={{ position: 'relative', marginBottom: '18px' }}>
            <FiSearch size={16} style={{
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? 'var(--accent)' : 'var(--text-faint)',
              pointerEvents: 'none', transition: 'color 0.2s', zIndex: 1
            }} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%', padding: '12px 44px',
                background: 'var(--bg-surface)',
                border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '10px', color: 'var(--text-primary)',
                fontSize: '14px', outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: searchFocused ? '0 0 0 3px rgba(212,163,115,0.12)' : 'none'
              }}
            />
            <AnimatePresence>
              {search && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-faint)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px'
                  }}>
                  <FiX size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="shop-filters-row"
            style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '28px' }}>

            <div className="shop-categories" style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 0 }}>
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  style={{
                    padding: '8px 16px', borderRadius: '20px',
                    border: '1px solid',
                    borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
                    background: category === cat ? 'var(--accent)' : 'var(--bg-surface)',
                    color: category === cat ? 'var(--bg-primary)' : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: category === cat ? '700' : '400',
                    cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
                    boxShadow: category === cat ? '0 2px 12px rgba(212,163,115,0.25)' : 'none',
                    flexShrink: 0
                  }}>
                  {cat}
                </motion.button>
              ))}
            </div>

            <select
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
              className="shop-stock-select"
              style={{
                padding: '8px 16px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: '20px',
                color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer',
                outline: 'none', flexShrink: 0
              }}>
              <option value="All">All Stock</option>
              <option value="in stock">In Stock</option>
              <option value="low stock">Low Stock</option>
              <option value="out of stock">Out of Stock</option>
            </select>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="product-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ height: '220px' }} />
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-surface)' }}>
                    <div className="skeleton" style={{ height: '11px', width: '55%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '15px', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '13px', width: '40%', borderRadius: '4px' }} />
                    <div className="skeleton" style={{ height: '36px', borderRadius: '8px', marginTop: '4px' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '80px 24px' }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                <FiFilter size={36} color="var(--text-faint)" style={{ marginBottom: '16px', opacity: 0.3 }} />
              </motion.div>
              <p style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: '600' }}>No products found</p>
              <p style={{ fontSize: '14px', color: 'var(--text-faint)', marginBottom: '20px' }}>Try adjusting your filters or search term</p>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setSearch(''); setCategory('All'); setStockFilter('All') }}
                style={{
                  padding: '10px 24px', background: 'var(--gradient-accent)',
                  color: 'var(--bg-primary)', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                }}>
                Clear Filters
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${category}-${stockFilter}-${search}`}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="product-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                {filtered.map(product => (
                  <motion.div key={product.id} variants={cardVariants}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <Footer />
      </main>
    </>
  )
}
