'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function AdminPanel() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'T-Shirts',
    price: '', discount: '0', stock_status: 'in stock', image_url: ''
  })

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth/login'); return }
      const { data } = await supabase.from('users').select('role').eq('id', session.user.id).single()
      if (data?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)
      fetchProducts()
      setLoading(false)
    }
    init()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'T-Shirts', price: '', discount: '0', stock_status: 'in stock', image_url: '' })
    setEditProduct(null)
    setShowForm(false)
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return alert('Name and price are required!')
    setSaving(true)
    if (editProduct) {
      await supabase.from('products').update({ ...form, price: parseFloat(form.price), discount: parseFloat(form.discount) }).eq('id', editProduct.id)
    } else {
      await supabase.from('products').insert([{ ...form, price: parseFloat(form.price), discount: parseFloat(form.discount) }])
    }
    await fetchProducts()
    resetForm()
    setSaving(false)
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name, description: product.description || '',
      category: product.category, price: product.price,
      discount: product.discount || '0', stock_status: product.stock_status, image_url: product.image_url || ''
    })
    setEditProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const handleStockToggle = async (product) => {
    const next = { 'in stock': 'low stock', 'low stock': 'out of stock', 'out of stock': 'in stock' }
    await supabase.from('products').update({ stock_status: next[product.stock_status] }).eq('id', product.id)
    fetchProducts()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-primary)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
  }

  const labelStyle = { fontSize: '12px', color: 'var(--text-faint)', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }

  if (loading) return <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '100px' }}>Loading...</div>
  if (!authorized) return null

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '40px 24px', flex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>🛠️ Admin Panel</h1>
            <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>{products.length} products total</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} style={{
            background: 'var(--accent)', color: 'var(--bg-primary)',
            padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
          }}>+ Add Product</button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Product Name *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Men's Kurta" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {['T-Shirts', 'Shalwar Kameez', 'Kurta', 'Shorts', 'Trousers'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price (Rs.) *</label>
                <input style={inputStyle} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1299" />
              </div>
              <div>
                <label style={labelStyle}>Discount (%)</label>
                <input style={inputStyle} type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 10" />
              </div>
              <div>
                <label style={labelStyle}>Stock Status</label>
                <select style={inputStyle} value={form.stock_status} onChange={e => setForm({ ...form, stock_status: e.target.value })}>
                  <option value="in stock">In Stock</option>
                  <option value="low stock">Low Stock</option>
                  <option value="out of stock">Out of Stock</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Image URL</label>
                <input style={inputStyle} value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={handleSave} disabled={saving} style={{
                background: 'var(--accent)', color: 'var(--bg-primary)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
              }}>{saving ? 'Saving...' : editProduct ? 'Update Product' : 'Save Product'}</button>
              <button onClick={resetForm} style={{
                background: 'transparent', color: 'var(--text-muted)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--border)', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Product', 'Category', 'Price', 'Discount', 'Stock', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>No products yet. Click "Add Product" to start!</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.image_url && <img src={p.image_url} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />}
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>Rs. {p.price?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.discount > 0 ? `${p.discount}%` : '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span onClick={() => handleStockToggle(p)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      background: p.stock_status === 'in stock' ? 'var(--badge-green)' : p.stock_status === 'low stock' ? '#FAEEDA' : '#FCEBEB',
                      color: p.stock_status === 'in stock' ? 'var(--badge-green-text)' : p.stock_status === 'low stock' ? '#633806' : '#A32D2D'
                    }}>{p.stock_status}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(p)} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer'
                      }}>Edit</button>
                      <button onClick={() => handleDelete(p.id)} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        background: 'transparent', border: '1px solid #E24B4A', color: '#E24B4A', cursor: 'pointer'
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </main>
  )
}