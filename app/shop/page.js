'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [stockFilter, setStockFilter] = useState('All')

  const categories = ['All', 'T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers']

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*')
      if (data) {
        setProducts(data)
        setFiltered(data)
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  useEffect(() => {
    let result = products
    if (search.length >= 2) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (category !== 'All') {
      result = result.filter(p => p.category === category)
    }
    if (stockFilter !== 'All') {
      result = result.filter(p => p.stock_status === stockFilter)
    }
    setFiltered(result)
  }, [search, category, stockFilter, products])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '40px 24px', flex: 1 }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Shop All Products
          </h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>
            {filtered.length} products found
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            marginBottom: '20px',
            outline: 'none'
          }}
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: category === cat ? 'var(--accent)' : 'var(--border)',
                  background: category === cat ? 'var(--accent)' : 'var(--bg-surface)',
                  color: category === cat ? 'var(--bg-primary)' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: category === cat ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={e => setStockFilter(e.target.value)}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              color: 'var(--text-muted)',
              fontSize: '13px',
              cursor: 'pointer',
              outline: 'none'
            }}>
            <option value="All">All Stock</option>
            <option value="in stock">In Stock</option>
            <option value="low stock">Low Stock</option>
            <option value="out of stock">Out of Stock</option>
          </select>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-faint)' }}>
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-faint)' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No products found</p>
            <p style={{ fontSize: '14px' }}>Try changing your filters</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}