'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { FiSettings } from 'react-icons/fi'
import Image from 'next/image'


export default function AdminPanel() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkJson, setBulkJson] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: 'T-Shirts',
    price: '', discount: '0', stock_status: 'in stock', image_url: ''
  })
  const [activeTab, setActiveTab] = useState('products')
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function fetchOrders() {
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const response = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
      })
      const result = await response.json().catch(() => ({}))
      if (response.ok) {
        setOrders(result.orders || [])
        setOrdersError('')
      } else {
        setOrdersError(result.error || 'Unable to load orders.')
      }
    } catch {
      setOrdersError('Network error loading orders.')
    }
  }

  async function handleStatusChange(orderId, status) {
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ id: orderId, status }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setOrdersError(result.error || 'Unable to update order.')
        return
      }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    } catch {
      setOrdersError('Network error updating order.')
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      if (session.user.app_metadata?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)
      fetchProducts()
      setLoading(false)
    }
    init()
  }, [router])

  const resetForm = () => {
    setForm({ name: '', description: '', category: 'T-Shirts', price: '', discount: '0', stock_status: 'in stock', image_url: '' })
    setEditProduct(null)
    setShowForm(false)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.name || !form.price) return alert('Name and price are required!')
    setSaving(true)
    setSaveError('')
    const payload = { ...form, price: parseFloat(form.price), discount: parseFloat(form.discount || 0) }
    let error
    if (editProduct) {
      const result = await supabase.from('products').update(payload).eq('id', editProduct.id)
      error = result.error
    } else {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({}))
      error = response.ok ? null : { message: result.error || 'Unable to add product.' }
    }

    if (error) {
      setSaveError(error.message || 'We could not save this product. Please try again.')
      setSaving(false)
      return
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

  const handleBulkImport = async () => {
    setBulkError('')
    setBulkSuccess('')
    let parsed
    try {
      parsed = JSON.parse(bulkJson)
    } catch {
      setBulkError('Invalid JSON. Please paste a valid JSON array.')
      return
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      setBulkError('Please provide a non-empty JSON array of products.')
      return
    }
    const invalid = parsed.find(p => !p.name || !p.price)
    if (invalid) {
      setBulkError('Every product must have at least "name" and "price" fields.')
      return
    }
    setBulkImporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ products: parsed }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setBulkError(result.error || 'Import failed.')
      } else {
        setBulkSuccess(`Successfully imported ${result.imported || parsed.length} product(s).`)
        setBulkJson('')
        fetchProducts()
        setTimeout(() => { setBulkSuccess(''); setShowBulkImport(false) }, 2000)
      }
    } catch {
      setBulkError('Network error. Please try again.')
    }
    setBulkImporting(false)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiSettings size={26} color="var(--accent)" /> Admin Panel
            </h1>
            <p style={{ color: 'var(--text-faint)', fontSize: '14px' }}>
              {activeTab === 'products' ? `${products.length} products total` : `${orders.length} orders total`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
              {['products', 'orders'].map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab)
                    if (tab === 'orders') fetchOrders()
                  }}
                  style={{
                    padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                    border: 'none', cursor: 'pointer',
                    background: activeTab === tab ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab ? 'var(--bg-primary)' : 'var(--text-muted)',
                    textTransform: 'capitalize'
                  }}>
                  {tab}
                </button>
              ))}
            </div>
            {activeTab === 'products' && (
              <>
                <button type="button" onClick={() => { resetForm(); setShowBulkImport(true); setBulkJson(''); setBulkError(''); setBulkSuccess('') }} style={{
                  background: 'transparent', color: 'var(--accent)',
                  padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--accent)', cursor: 'pointer'
                }}>Bulk Import</button>
                <button type="button" onClick={() => { resetForm(); setShowForm(true) }} style={{
                  background: 'var(--accent)', color: 'var(--bg-primary)',
                  padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
                }}>+ Add Product</button>
              </>
            )}
          </div>
        </div>

        {/* ── Products tab ─────────────────────────────────────────────── */}
        {activeTab === 'products' && (
        <>
        {/* Bulk Import */}
        {showBulkImport && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Bulk Import Products
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '16px' }}>
              Paste a JSON array of products. Each object needs at least <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>name</code> and <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>price</code>. Optional: <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>description</code>, <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>category</code>, <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>discount</code>, <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>stock_status</code>, <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: '4px' }}>image_url</code>.
            </p>
            {bulkError && <p role="alert" style={{ marginBottom: '12px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{bulkError}</p>}
            {bulkSuccess && <p style={{ marginBottom: '12px', padding: '10px 12px', color: '#2e7d32', background: 'rgba(46,125,50,.1)', border: '1px solid rgba(46,125,50,.35)', borderRadius: '7px', fontSize: '13px' }}>{bulkSuccess}</p>}
            <textarea
              value={bulkJson}
              onChange={e => setBulkJson(e.target.value)}
              placeholder={`[\n  { "name": "Classic White Tee", "price": 999, "category": "T-Shirts", "stock_status": "in stock" },\n  { "name": "Navy Kurta", "price": 1899, "category": "Kurta", "discount": 10 }\n]`}
              style={{
                width: '100%', minHeight: '200px', padding: '14px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: '1.6'
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="button" onClick={handleBulkImport} disabled={bulkImporting || !bulkJson.trim()} style={{
                background: 'var(--accent)', color: 'var(--bg-primary)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer',
                opacity: bulkImporting || !bulkJson.trim() ? 0.6 : 1
              }}>{bulkImporting ? 'Importing...' : 'Import Products'}</button>
              <button type="button" onClick={() => { setShowBulkImport(false); setBulkJson(''); setBulkError(''); setBulkSuccess('') }} style={{
                background: 'transparent', color: 'var(--text-muted)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--border)', cursor: 'pointer'
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px', marginBottom: '32px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
              {editProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            {saveError && <p role="alert" style={{ marginBottom: '16px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{saveError}</p>}

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
              <button type="button" onClick={handleSave} disabled={saving} style={{
                background: 'var(--accent)', color: 'var(--bg-primary)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
              }}>{saving ? 'Saving...' : editProduct ? 'Update Product' : 'Save Product'}</button>
              <button type="button" onClick={resetForm} style={{
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>No products yet. Click &quot;Add Product&quot; to start!</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.image_url && (
                        <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            sizes="40px"
                            unoptimized
                            onError={(event) => { event.currentTarget.style.display = 'none' }}
                            style={{ objectFit: 'cover', borderRadius: '6px' }}
                          />
                        </div>
                      )}
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>Rs. {p.price?.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.discount > 0 ? `${p.discount}%` : '-'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span onClick={() => handleStockToggle(p)} style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      background: p.stock_status === 'in stock' ? 'var(--badge-green)' : p.stock_status === 'low stock' ? '#FAEEDA' : '#FCEBEB',
                      color: p.stock_status === 'in stock' ? 'var(--badge-green-text)' : p.stock_status === 'low stock' ? '#633806' : '#A32D2D'
                    }}>{p.stock_status}</span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => handleEdit(p)} style={{
                        padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                        background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer'
                      }}>Edit</button>
                      <button type="button" onClick={() => handleDelete(p.id)} style={{
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
        </>
        )}

        {/* ── Orders tab ─────────────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div>
            {ordersError && <p role="alert" style={{ marginBottom: '16px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{ordersError}</p>}

            {orders.length === 0 ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '60px', textAlign: 'center', color: 'var(--text-faint)' }}>
                No orders yet. New customer orders will appear here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => {
                  const items = Array.isArray(order.products) ? order.products : []
                  const totalQty = items.reduce((s, i) => s + (i.qty || 1), 0)
                  return (
                    <div key={order.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>
                              #{order.id?.slice(0, 8)?.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                              {order.created_at ? new Date(order.created_at).toLocaleString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px' }}>
                            {order.customer_name || 'Unknown customer'}
                            {order.customer_city ? ` · ${order.customer_city}` : ''}
                            {order.customer_phone ? ` · ${order.customer_phone}` : ''}
                          </p>
                          {order.customer_address && (
                            <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '3px' }}>{order.customer_address}</p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)' }}>
                            Rs. {order.total?.toLocaleString?.() ?? order.total}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '2px' }}>
                            {totalQty} item{totalQty !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      {order.notes && (
                        <p style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: '14px' }}>&quot;{order.notes}&quot;</p>
                      )}

                      {items.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '16px' }}>
                          {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {item.name} <span style={{ color: 'var(--text-faint)' }}>× {item.qty || 1}</span>
                              </span>
                              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                Rs. {((item.finalPrice ?? item.price) * (item.qty || 1)).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</span>
                        <select
                          value={order.status}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                          style={{ ...inputStyle, width: '160px', cursor: 'pointer' }}>
                          {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                            <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                          ))}
                        </select>
                        {order.status === 'cancelled' && (
                          <span style={{ fontSize: '12px', color: 'var(--text-faint)', marginLeft: 'auto' }}>This order was cancelled</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
