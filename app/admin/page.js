'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { FiSettings, FiDownload, FiSearch, FiSave, FiExternalLink } from 'react-icons/fi'
import Image from 'next/image'
import { CATEGORIES, STOCK_STATUSES } from '@/lib/categories'
import { parseProductSheet, CSV_TEMPLATE, downloadTextFile } from '@/lib/productCsv'
import { getOrderDetails, orderItemCount } from '@/lib/orderPayload'
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from '@/lib/siteSettings'


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
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState('csv')
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', category: CATEGORIES[0],
    price: '', discount: '0', stock_status: 'in stock', image_url: ''
  })
  const [activeTab, setActiveTab] = useState('products')
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [siteForm, setSiteForm] = useState(DEFAULT_SITE_SETTINGS)
  const [siteLoading, setSiteLoading] = useState(false)
  const [siteSaving, setSiteSaving] = useState(false)
  const [siteMessage, setSiteMessage] = useState('')
  const [siteError, setSiteError] = useState('')

  async function fetchProducts() {
    if (!supabase) return
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
  }

  async function fetchOrders() {
    if (!supabase) return
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

  async function fetchSiteSettings() {
    setSiteLoading(true)
    setSiteError('')
    try {
      const response = await fetch('/api/site-settings', { cache: 'no-store' })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSiteError(result.error || 'Unable to load site info.')
        return
      }
      setSiteForm(normalizeSiteSettings(result.settings))
    } catch {
      setSiteError('Network error loading site info.')
    } finally {
      setSiteLoading(false)
    }
  }

  function updateSiteField(key, value) {
    setSiteForm(previous => ({ ...previous, [key]: value }))
    setSiteMessage('')
    setSiteError('')
  }

  async function handleSaveSiteSettings() {
    setSiteSaving(true)
    setSiteError('')
    setSiteMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify(siteForm),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSiteError(result.error || 'Unable to save site info.')
        return
      }
      const saved = normalizeSiteSettings(result.settings)
      setSiteForm(saved)
      setSiteMessage('Saved. Your landing page and footer are updated.')
      window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: saved }))
    } catch {
      setSiteError('Network error saving site info.')
    } finally {
      setSiteSaving(false)
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
      if (!supabase) { router.push('/admin/login'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      if (session.user.app_metadata?.role !== 'admin') { router.push('/'); return }
      setAuthorized(true)
      fetchProducts()
      fetchOrders()
      setLoading(false)
    }
    init()
  }, [router])

  const resetForm = () => {
    setForm({ name: '', description: '', category: CATEGORIES[0], price: '', discount: '0', stock_status: 'in stock', image_url: '' })
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
    if (bulkMode === 'csv') {
      const result = parseProductSheet(bulkText)
      if (result.errors.length > 0) {
        setBulkError(result.errors.slice(0, 4).join(' '))
        return
      }
      parsed = result.products
    } else {
      try {
        parsed = JSON.parse(bulkText)
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
    }
    if (parsed.length === 0) {
      setBulkError('No product rows were found in the sheet.')
      return
    }
    if (parsed.length > 100) {
      setBulkError('Maximum 100 products per import. Split the sheet and try again.')
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
        setBulkText('')
        setProductSearch('')
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

  const csvPreview = useMemo(
    () => bulkMode === 'csv' && bulkText.trim() ? parseProductSheet(bulkText) : null,
    [bulkMode, bulkText]
  )

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return products
    return products.filter(product =>
      [product.name, product.category, product.stock_status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    )
  }, [products, productSearch])

  const stats = useMemo(() => {
    const lowStock = products.filter(product => product.stock_status === 'low stock').length
    const outOfStock = products.filter(product => product.stock_status === 'out of stock').length
    const revenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    return { lowStock, outOfStock, revenue }
  }, [products, orders])

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
              {activeTab === 'products'
                ? `${products.length} products total`
                : activeTab === 'orders'
                  ? `${orders.length} orders total`
                  : 'Contact details and landing page messages'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
              {[
                { id: 'products', label: 'Products' },
                { id: 'orders', label: 'Orders' },
                { id: 'settings', label: 'Site Info' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'orders') fetchOrders()
                    if (tab.id === 'settings') fetchSiteSettings()
                  }}
                  style={{
                    padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '700',
                    border: 'none', cursor: 'pointer',
                    background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'products' && (
              <>
                <button type="button" onClick={() => { resetForm(); setShowBulkImport(true); setBulkText(''); setBulkError(''); setBulkSuccess('') }} style={{
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

        {/* ── Store snapshot ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Products', value: products.length, note: 'live in catalogue' },
            { label: 'Low stock', value: stats.lowStock, note: 'need a restock' },
            { label: 'Out of stock', value: stats.outOfStock, note: 'hidden from buyers' },
            { label: 'Orders', value: orders.length, note: 'all time' },
            { label: 'Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, note: 'excluding cancelled' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px 18px'
            }}>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: '700' }}>{card.label}</p>
              <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0 2px' }}>{card.value}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{card.note}</p>
            </div>
          ))}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Bulk Import Products
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                  Upload a spreadsheet exported as CSV/TSV, or paste rows directly. Columns: name, description, category, price, discount, stock_status, image_url.
                </p>
              </div>
              {bulkMode === 'csv' && (
                <button
                  type="button"
                  onClick={() => downloadTextFile('abuzarstore-products-template.csv', CSV_TEMPLATE)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px',
                    color: 'var(--text-muted)', padding: '9px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                  }}>
                  <FiDownload size={13} /> Download template
                </button>
              )}
            </div>

            <div style={{ display: 'inline-flex', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px', gap: '3px', marginBottom: '14px' }}>
              {[{ id: 'csv', label: 'Spreadsheet (CSV)' }, { id: 'json', label: 'JSON' }].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { setBulkMode(tab.id); setBulkError(''); setBulkSuccess('') }}
                  style={{
                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                    padding: '7px 14px', fontSize: '12px', fontWeight: '700',
                    background: bulkMode === tab.id ? 'var(--accent)' : 'transparent',
                    color: bulkMode === tab.id ? 'var(--bg-primary)' : 'var(--text-muted)'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {bulkError && <p role="alert" style={{ marginBottom: '12px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{bulkError}</p>}
            {bulkSuccess && <p style={{ marginBottom: '12px', padding: '10px 12px', color: '#2e7d32', background: 'rgba(46,125,50,.1)', border: '1px solid rgba(46,125,50,.35)', borderRadius: '7px', fontSize: '13px' }}>{bulkSuccess}</p>}

            {bulkMode === 'csv' && (
              <input
                type="file"
                accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
                onChange={async event => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  setBulkText(await file.text())
                  setBulkError('')
                  setBulkSuccess('')
                }}
                style={{
                  display: 'block', width: '100%', marginBottom: '12px', padding: '12px',
                  background: 'var(--bg-primary)', border: '1px dashed var(--border)',
                  borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer'
                }}
              />
            )}

            <textarea
              value={bulkText}
              onChange={e => { setBulkText(e.target.value); setBulkError(''); setBulkSuccess('') }}
              placeholder={bulkMode === 'csv'
                ? `name,description,category,price,discount,stock_status,image_url\n"Plastic Dinner Plate Set","BPA-free, 10.5 inch",Plastic Crockery,1450,0,in stock,/images/category-plastic.svg`
                : `[\n  { "name": "Plastic Dinner Plate Set", "price": 1450, "category": "Plastic Crockery", "stock_status": "in stock" },\n  { "name": "Amber Tumbler Set", "price": 1890, "category": "Glassware", "discount": 10 }\n]`}
              style={{
                width: '100%', minHeight: '190px', padding: '14px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px',
                fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: '1.6'
              }}
            />

            {csvPreview && (
              <p style={{
                marginTop: '10px', fontSize: '12px', fontWeight: '600',
                color: csvPreview.errors.length ? '#E24B4A' : 'var(--badge-green-text)'
              }}>
                {csvPreview.errors.length
                  ? `${csvPreview.errors.length} issue${csvPreview.errors.length > 1 ? 's' : ''}: ${csvPreview.errors[0]}`
                  : `${csvPreview.products.length} product${csvPreview.products.length === 1 ? '' : 's'} ready to import`}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button type="button" onClick={handleBulkImport} disabled={bulkImporting || !bulkText.trim()} style={{
                background: 'var(--accent)', color: 'var(--bg-primary)',
                padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer',
                opacity: bulkImporting || !bulkText.trim() ? 0.6 : 1
              }}>{bulkImporting ? 'Importing...' : 'Import Products'}</button>
              <button type="button" onClick={() => { setShowBulkImport(false); setBulkText(''); setBulkError(''); setBulkSuccess('') }} style={{
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
                <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Handpainted Dinner Plate Set" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ position: 'relative', width: 'min(340px, 100%)' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products, categories, stock..."
              style={{ ...inputStyle, paddingLeft: '34px' }}
            />
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
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
              {filteredProducts.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-faint)' }}>
                  {products.length === 0 ? 'No products yet. Click "Add Product" to start!' : 'No products match your search.'}
                </td></tr>
              ) : filteredProducts.map(p => {
                const lowStock = p.stock_status === 'low stock'
                return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', boxShadow: lowStock ? 'inset 3px 0 0 #EF9F27' : 'none' }}
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
                )
              })}
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
                  const { items, delivery, notes, payment } = getOrderDetails(order)
                  const totalQty = orderItemCount(order)
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
                            {delivery.name || 'Unknown customer'}
                            {delivery.city ? ` · ${delivery.city}` : ''}
                            {delivery.phone ? ` · ${delivery.phone}` : ''}
                          </p>
                          {delivery.address && (
                            <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '3px' }}>{delivery.address}</p>
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

                      {(notes || payment) && (
                        <p style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: '14px' }}>
                          {payment ? `Payment: ${payment}` : ''}{payment && notes ? ' · ' : ''}{notes ? `“${notes}”` : ''}
                        </p>
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

        {activeTab === 'settings' && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Site information
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-faint)', maxWidth: '620px', lineHeight: '1.6' }}>
                  These details appear on the landing page and footer. Save once and the storefront updates automatically — no code changes needed.
                </p>
              </div>
              <a href="/" target="_blank" rel="noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border)',
                color: 'var(--accent)', fontSize: '13px', fontWeight: '700', textDecoration: 'none'
              }}><FiExternalLink size={14} /> View storefront</a>
            </div>

            {siteError && (
              <p role="alert" style={{ marginBottom: '16px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{siteError}</p>
            )}
            {siteMessage && (
              <p role="status" style={{ marginBottom: '16px', padding: '10px 12px', color: '#2F7F75', background: 'rgba(47,127,117,.1)', border: '1px solid rgba(47,127,117,.35)', borderRadius: '7px', fontSize: '13px' }}>{siteMessage}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '18px' }}>
              {[
                { key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+92 300 0000000' },
                { key: 'email', label: 'Support email', type: 'email', placeholder: 'support@abuzarstore.pk' },
                { key: 'address', label: 'Store address', type: 'text', placeholder: 'Karachi, Pakistan' },
                { key: 'announcement', label: 'Delivery announcement', type: 'text', placeholder: 'Free delivery on orders over Rs. 3,000' },
                { key: 'returnsNote', label: 'Returns note', type: 'text', placeholder: 'Easy 7-day returns' },
                { key: 'instagram', label: 'Instagram URL', type: 'url', placeholder: 'https://instagram.com/yourstore' },
                { key: 'facebook', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/yourstore' },
                { key: 'whatsapp', label: 'WhatsApp number', type: 'tel', placeholder: '+92 300 0000000' },
              ].map(field => (
                <label key={field.key} htmlFor={`site-${field.key}`}>
                  <span style={labelStyle}>{field.label}</span>
                  <input
                    id={`site-${field.key}`}
                    type={field.type}
                    value={siteForm[field.key]}
                    placeholder={field.placeholder}
                    onChange={event => updateSiteField(field.key, event.target.value)}
                    style={inputStyle}
                  />
                </label>
              ))}
              <label htmlFor="site-footerNote" style={{ gridColumn: '1 / -1' }}>
                <span style={labelStyle}>Footer description</span>
                <textarea
                  id="site-footerNote"
                  value={siteForm.footerNote}
                  onChange={event => updateSiteField('footerNote', event.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '88px', fontFamily: 'inherit' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={handleSaveSiteSettings}
                disabled={siteSaving || siteLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'var(--accent)', color: 'var(--bg-primary)',
                  padding: '12px 24px', borderRadius: '8px', fontSize: '14px',
                  fontWeight: '700', border: 'none', cursor: siteSaving || siteLoading ? 'wait' : 'pointer',
                  opacity: siteSaving || siteLoading ? 0.7 : 1
                }}>
                <FiSave size={15} /> {siteSaving ? 'Saving...' : 'Save site info'}
              </button>
              <button
                type="button"
                onClick={fetchSiteSettings}
                disabled={siteLoading}
                style={{
                  background: 'transparent', color: 'var(--text-muted)',
                  padding: '12px 20px', borderRadius: '8px', fontSize: '14px',
                  border: '1px solid var(--border)', cursor: siteLoading ? 'wait' : 'pointer'
                }}>
                {siteLoading ? 'Loading...' : 'Reload saved'}
              </button>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                Phone, email and social links are also used in the footer.
              </span>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
