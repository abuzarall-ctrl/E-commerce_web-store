'use client'
import { useState, useEffect, useMemo, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiDownload, FiSearch, FiSave, FiExternalLink, FiGrid, FiBox,
  FiShoppingBag, FiSliders, FiMenu, FiX, FiLogOut, FiPlus, FiUpload,
  FiRefreshCw, FiSun, FiMoon, FiTrendingUp, FiAlertTriangle, FiPackage, FiCheckCircle,
  FiUsers, FiUserPlus, FiTrash2, FiShield
} from 'react-icons/fi'
import Image from 'next/image'
import {
  CATEGORIES,
  LOW_STOCK_THRESHOLD,
  productStockQuantity,
  productStockStatus,
  stockStatusForQuantity
} from '@/lib/categories'
import { parseProductSheet, CSV_TEMPLATE, downloadTextFile } from '@/lib/productCsv'
import { getOrderDetails, orderItemCount } from '@/lib/orderPayload'
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from '@/lib/siteSettings'
import { ADMIN_ROLE, isAdminRole, isSuperAdminRole } from '@/lib/adminRoles'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

const EMPTY_FORM = {
  name: '', description: '', category: CATEGORIES[0],
  price: '', discount: '0', stock_quantity: '25', image_url: '',
  is_fast_selling: false, is_good_reviews: false,
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: FiGrid },
  { id: 'products', label: 'Products', icon: FiBox },
  { id: 'orders', label: 'Orders', icon: FiShoppingBag },
  { id: 'admins', label: 'Admins', icon: FiUsers, superOnly: true },
  { id: 'settings', label: 'Site Info', icon: FiSliders },
]

const TAB_COPY = {
  overview: { title: 'Dashboard', subtitle: 'Stock health, orders and revenue at a glance' },
  products: { title: 'Products', subtitle: 'Manage catalogue, pricing and inventory' },
  orders: { title: 'Orders', subtitle: 'Confirm, fulfil and refund customer orders' },
  admins: { title: 'Admins', subtitle: 'Create and manage store admin accounts' },
  settings: { title: 'Site Info', subtitle: 'Contact details and storefront messages' },
}

const stockColor = {
  'in stock': 'var(--badge-green)',
  'low stock': '#FAEEDA',
  'out of stock': '#FCEBEB'
}
const stockTextColor = {
  'in stock': 'var(--badge-green-text)',
  'low stock': '#633806',
  'out of stock': '#A32D2D'
}

function subscribeTheme(onChange) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function getThemeSnapshot() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function getServerThemeSnapshot() {
  return 'dark'
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`
}

function adminActionStyle(color) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '6px 10px', borderRadius: '6px',
    border: `1px solid ${color}66`, background: `${color}18`,
    color, fontSize: '11px', fontWeight: '700', cursor: 'pointer'
  }
}

function StockBadge({ status }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap',
      background: stockColor[status] || stockColor['in stock'],
      color: stockTextColor[status] || stockTextColor['in stock']
    }}>
      {status}
    </span>
  )
}

function StatCard({ label, value, note, icon: Icon, iconColor = 'var(--accent)', onClick }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={onClick ? { y: -3 } : {}}
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '18px',
        cursor: onClick ? 'pointer' : 'default'
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.7px', fontWeight: '700' }}>{label}</p>
          <p style={{ fontSize: '25px', fontWeight: '800', color: 'var(--text-primary)', margin: '6px 0 2px', lineHeight: 1.1 }}>{value}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{note}</p>
        </div>
        {Icon && (
          <span style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: 'var(--bg-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={18} color={iconColor} />
          </span>
        )}
      </div>
    </motion.div>
  )
}

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
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot)
  const [refreshing, setRefreshing] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersError, setOrdersError] = useState('')
  const [siteForm, setSiteForm] = useState(DEFAULT_SITE_SETTINGS)
  const [siteLoading, setSiteLoading] = useState(false)
  const [siteSaving, setSiteSaving] = useState(false)
  const [siteMessage, setSiteMessage] = useState('')
  const [siteError, setSiteError] = useState('')
  const [currentRole, setCurrentRole] = useState('')
  const [admins, setAdmins] = useState([])
  const [adminsLoading, setAdminsLoading] = useState(false)
  const [adminsError, setAdminsError] = useState('')
  const [adminsMessage, setAdminsMessage] = useState('')
  const [adminForm, setAdminForm] = useState({ fullName: '', email: '', password: '' })
  const [adminSaving, setAdminSaving] = useState(false)

  const isSuperAdmin = isSuperAdminRole(currentRole)

  const toast = (message) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appToast', { detail: { message } }))
    }
  }

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

  async function fetchAdmins() {
    if (!supabase) return
    setAdminsLoading(true)
    setAdminsError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/admins', {
        headers: { Authorization: `Bearer ${session?.access_token || ''}` },
        cache: 'no-store',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAdminsError(result.error || 'Unable to load admins.')
        return
      }
      setAdmins(result.admins || [])
    } catch {
      setAdminsError('Network error loading admins.')
    } finally {
      setAdminsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (!supabase) { router.push('/admin/login'); return }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/admin/login'); return }
      const role = session.user.app_metadata?.role
      if (!isAdminRole(role)) { router.push('/'); return }
      setCurrentRole(role)
      setAuthorized(true)
      await Promise.all([fetchProducts(), fetchOrders()])
      setLoading(false)
    }
    init()
  }, [router])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem('theme', next)
  }

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const openTab = (tabId) => {
    if (tabId === 'admins' && !isSuperAdmin) return
    setActiveTab(tabId)
    setSidebarOpen(false)
    if (tabId === 'orders') fetchOrders()
    if (tabId === 'admins') fetchAdmins()
    if (tabId === 'settings') fetchSiteSettings()
  }

  const refreshAll = async () => {
    setRefreshing(true)
    await Promise.all([fetchProducts(), fetchOrders()])
    setRefreshing(false)
    toast('Admin data refreshed')
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

  async function handleCreateAdmin() {
    if (!adminForm.fullName.trim() || !adminForm.email.trim() || !adminForm.password) {
      setAdminsError('Name, email and password are required.')
      return
    }
    if (adminForm.password.length < 6) {
      setAdminsError('Password must be at least 6 characters.')
      return
    }
    setAdminSaving(true)
    setAdminsError('')
    setAdminsMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify(adminForm),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAdminsError(result.error || 'Unable to create admin.')
        return
      }
      setAdminForm({ fullName: '', email: '', password: '' })
      setAdminsMessage(`${result.admin?.email || 'Admin'} can now sign in at /admin/login.`)
      await fetchAdmins()
    } catch {
      setAdminsError('Network error creating admin.')
    } finally {
      setAdminSaving(false)
    }
  }

  async function handleRevokeAdmin(admin) {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return
    setAdminsError('')
    setAdminsMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ id: admin.id }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setAdminsError(result.error || 'Unable to remove admin.')
        return
      }
      setAdminsMessage(`${admin.email} no longer has admin access.`)
      await fetchAdmins()
    } catch {
      setAdminsError('Network error removing admin.')
    }
  }

  async function handleStatusChange(orderId, status) {
    const previousOrder = orders.find(order => order.id === orderId)
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
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...(result.order || { status }) } : o))
      setOrdersError('')
      await fetchProducts()

      const adjusted = Number(result.stockAdjusted) || 0
      if (status === 'confirmed' && adjusted) toast('Order confirmed · stock deducted')
      else if (status === 'refunded' && adjusted) toast('Refund processed · stock restored')
      else if (status === 'cancelled' && adjusted) toast('Order cancelled · stock restored')
      else if (previousOrder?.status !== status) toast(`Order marked ${status}`)
    } catch {
      setOrdersError('Network error updating order.')
    }
  }

  async function handleOrderAction(orderId, action) {
    let note = ''
    if (action === 'reject-payment' || action === 'reject-refund') {
      const input = window.prompt('Optional note for the customer:')
      if (input === null) return
      note = input
    }
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ id: orderId, action, note }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setOrdersError(result.error || 'Unable to update order.')
        return
      }
      setOrders(prev => prev.map(order => order.id === orderId ? { ...order, ...(result.order || {}) } : order))
      setOrdersError('')
      if (action === 'approve-refund') {
        await fetchProducts()
        toast(`Refund approved${Number(result.stockAdjusted) ? ' — stock restored' : ''}`)
      } else if (action === 'verify-payment') {
        toast('Payment verified — order can now be confirmed')
      } else if (action === 'reject-payment') {
        toast('Payment receipt rejected')
      } else if (action === 'reject-refund') {
        toast('Refund request rejected')
      }
    } catch {
      setOrdersError('Network error updating order.')
    }
  }

  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setEditProduct(null)
    setShowForm(false)
    setSaveError('')
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      setSaveError('Product name and price are required.')
      return
    }
    const quantity = Number(form.stock_quantity)
    if (!Number.isFinite(quantity) || quantity < 0) {
      setSaveError('Enter a valid stock quantity (0 or more).')
      return
    }

    setSaving(true)
    setSaveError('')
    const payload = {
      ...form,
      name: form.name.trim(),
      price: parseFloat(form.price),
      discount: parseFloat(form.discount || 0),
      stock_quantity: Math.floor(quantity),
      stock_status: stockStatusForQuantity(quantity),
    }

    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/admin/products', {
      method: editProduct ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify(editProduct ? { ...payload, id: editProduct.id } : payload),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      setSaveError(result.error || 'We could not save this product. Please try again.')
      setSaving(false)
      return
    }
    await fetchProducts()
    toast(editProduct ? 'Product updated' : 'Product added')
    resetForm()
    setSaving(false)
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      discount: product.discount || '0',
      stock_quantity: String(productStockQuantity(product)),
      image_url: product.image_url || '',
      is_fast_selling: Boolean(product.is_fast_selling),
      is_good_reviews: Boolean(product.is_good_reviews),
    })
    setEditProduct(product)
    setShowForm(true)
    setActiveTab('products')
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ id }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast(result.error || 'Could not delete product')
      return
    }
    await fetchProducts()
    toast('Product deleted')
  }

  const adjustProductStock = async (product, delta) => {
    const current = productStockQuantity(product)
    const next = Math.max(0, current + delta)
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({
        id: product.id,
        stock_quantity: next,
        stock_status: stockStatusForQuantity(next),
      }),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      toast(result.error || 'Could not update stock')
      return
    }
    await fetchProducts()
    toast(`${product.name}: ${next} in stock`)
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
        await fetchProducts()
        setTimeout(() => { setBulkSuccess(''); setShowBulkImport(false) }, 2000)
      }
    } catch {
      setBulkError('Network error. Please try again.')
    }
    setBulkImporting(false)
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
      [
        product.name,
        product.category,
        product.stock_status,
        String(productStockQuantity(product)),
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    )
  }, [products, productSearch])

  const stats = useMemo(() => {
    const lowProducts = products
      .filter(product => productStockStatus(product) === 'low stock')
      .sort((a, b) => productStockQuantity(a) - productStockQuantity(b))
    const outProducts = products.filter(product => productStockStatus(product) === 'out of stock')
    const units = products.reduce((sum, product) => sum + productStockQuantity(product), 0)
    const revenue = orders
      .filter(order => !['cancelled', 'refunded'].includes(order.status))
      .reduce((sum, order) => sum + (Number(order.total) || 0), 0)
    const pendingOrders = orders.filter(order => order.status === 'pending').length
    return { lowProducts, outProducts, units, revenue, pendingOrders }
  }, [products, orders])

  const currentTab = TAB_COPY[activeTab] || TAB_COPY.overview

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', gap: '10px' }}>
        <FiRefreshCw size={18} className="admin-spin" /> Loading admin workspace...
      </div>
    )
  }
  if (!authorized) return null

  return (
    <div className="admin-shell">
      <style>{`
        .admin-shell { display: flex; min-height: 100vh; background: var(--bg-primary); }
        .admin-sidebar {
          width: 252px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
          display: flex; flex-direction: column; gap: 18px; padding: 22px 14px;
          background: var(--bg-surface); border-right: 1px solid var(--border); z-index: 50;
        }
        .admin-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .admin-topbar {
          position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 12px;
          padding: 14px 24px; border-bottom: 1px solid var(--border);
          background: var(--glass-bg); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        }
        .admin-content { width: 100%; max-width: 1400px; margin: 0 auto; padding: 24px; flex: 1; }
        .admin-nav-btn {
          display: flex; align-items: center; gap: 11px; width: 100%;
          padding: 11px 13px; border-radius: 9px; border: 1px solid transparent;
          background: transparent; color: var(--text-muted); font-size: 14px;
          font-weight: 600; cursor: pointer; text-align: left; transition: background 0.18s, color 0.18s;
        }
        .admin-nav-btn:hover { background: var(--bg-surface2); color: var(--text-primary); }
        .admin-nav-btn.active { background: var(--accent); color: var(--bg-primary); font-weight: 800; }
        .admin-nav-count {
          margin-left: auto; min-width: 22px; height: 20px; padding: 0 6px;
          border-radius: 10px; font-size: 11px; font-weight: 800;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--bg-primary); color: var(--text-muted);
        }
        .admin-nav-btn.active .admin-nav-count { background: rgba(0,0,0,.14); color: var(--bg-primary); }
        .admin-icon-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          height: 38px; padding: 0 12px; border-radius: 9px;
          border: 1px solid var(--border); background: var(--bg-surface);
          color: var(--text-muted); font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .admin-icon-btn:hover { color: var(--accent); border-color: var(--accent); }
        .admin-menu-btn, .admin-sidebar-close { display: none; }
        .admin-backdrop { display: none; }
        .admin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .admin-split { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 18px; }
        .admin-table-wrap { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 12px; overflow-x: auto; }
        .admin-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .admin-order-items { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border); padding-top: 14px; margin-bottom: 16px; }
        .admin-spin { animation: adminSpin 1s linear infinite; }
        @keyframes adminSpin { to { transform: rotate(360deg); } }
        @media (max-width: 960px) {
          .admin-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .admin-sidebar {
            position: fixed; left: 0; top: 0; height: 100vh; transform: translateX(-100%);
            transition: transform 0.24s ease; box-shadow: 0 0 40px rgba(0,0,0,.35);
          }
          .admin-sidebar.open { transform: translateX(0); }
          .admin-sidebar-close { display: inline-flex; }
          .admin-menu-btn { display: inline-flex; }
          .admin-backdrop.open {
            display: block; position: fixed; inset: 0; z-index: 45; background: rgba(0,0,0,.48);
          }
          .admin-content { padding: 18px 16px; }
          .admin-topbar { padding: 12px 16px; }
          .admin-topbar-label { display: none; }
          .admin-form-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .admin-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div
        className={`admin-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', padding: '0 4px' }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
              Abuzar<span style={{ color: 'var(--accent)' }}>Store</span>
            </div>
            <div style={{ fontSize: '10px', letterSpacing: '1.8px', textTransform: 'uppercase', color: 'var(--text-faint)', fontWeight: '800', marginTop: '3px' }}>
              {isSuperAdmin ? 'Super admin' : 'Admin workspace'}
            </div>
          </div>
          <button type="button" className="admin-icon-btn admin-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu" style={{ padding: 0, width: '34px', height: '34px' }}>
            <FiX size={17} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
          {NAV_ITEMS.filter(item => !item.superOnly || isSuperAdmin).map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            const count = item.id === 'products'
              ? products.length
              : item.id === 'orders'
                ? stats.pendingOrders
                : null
            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ x: isActive ? 0 : 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openTab(item.id)}
                className={`admin-nav-btn ${isActive ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{item.label}</span>
                {count !== null && <span className="admin-nav-count">{count}</span>}
              </motion.button>
            )
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '12px'
          }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: 'var(--text-faint)' }}>Inventory units</p>
            <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '2px' }}>{stats.units.toLocaleString()}</p>
            <p style={{ fontSize: '11px', color: stats.lowProducts.length + stats.outProducts.length > 0 ? '#EF9F27' : 'var(--text-faint)' }}>
              {stats.lowProducts.length + stats.outProducts.length} product(s) need attention
            </p>
          </div>
          <button type="button" className="admin-icon-btn" onClick={() => router.push('/')} style={{ width: '100%', justifyContent: 'flex-start' }}>
            <FiExternalLink size={15} /> View storefront
          </button>
          <button type="button" className="admin-icon-btn" onClick={handleLogout} style={{ width: '100%', justifyContent: 'flex-start', color: '#E24B4A' }}>
            <FiLogOut size={15} /> Log out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-icon-btn admin-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu" style={{ padding: 0, width: '38px' }}>
            <FiMenu size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentTab.title}</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTab.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" className="admin-icon-btn" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: 0, width: '38px' }}>
              {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />}
            </button>
            <button type="button" className="admin-icon-btn" onClick={refreshAll} aria-label="Refresh data" style={{ padding: 0, width: '38px' }}>
              <FiRefreshCw size={16} className={refreshing ? 'admin-spin' : ''} />
            </button>
            <button type="button" className="admin-icon-btn" onClick={handleLogout} aria-label="Log out" style={{ padding: 0, width: '38px' }}>
              <FiLogOut size={16} />
            </button>
          </div>
        </header>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <motion.div className="admin-grid" variants={stagger} initial="hidden" animate="visible" style={{ marginBottom: '20px' }}>
                  <StatCard label="Products" value={products.length} note="live in catalogue" icon={FiBox} onClick={() => openTab('products')} />
                  <StatCard label="Units in stock" value={stats.units.toLocaleString()} note="across all products" icon={FiPackage} onClick={() => openTab('products')} />
                  <StatCard label="Low stock" value={stats.lowProducts.length} note={`at or below ${LOW_STOCK_THRESHOLD} units`} icon={FiAlertTriangle} iconColor="#EF9F27" onClick={() => openTab('products')} />
                  <StatCard label="Out of stock" value={stats.outProducts.length} note="hidden from buyers" icon={FiAlertTriangle} iconColor="#E24B4A" onClick={() => openTab('products')} />
                  <StatCard label="Pending orders" value={stats.pendingOrders} note="waiting to be confirmed" icon={FiShoppingBag} onClick={() => openTab('orders')} />
                  <StatCard label="Revenue" value={money(stats.revenue)} note="excluding cancelled & refunded" icon={FiTrendingUp} />
                </motion.div>

                <div className="admin-split">
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Needs attention</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Restock these before they sell out</p>
                      </div>
                      <button type="button" className="admin-icon-btn" onClick={() => openTab('products')} style={{ height: '32px' }}>
                        Manage
                      </button>
                    </div>

                    {stats.lowProducts.length === 0 && stats.outProducts.length === 0 ? (
                      <div style={{ padding: '26px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
                        All products are healthy. No restock needed.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {[...stats.outProducts, ...stats.lowProducts].slice(0, 7).map(product => {
                          const quantity = productStockQuantity(product)
                          const status = productStockStatus(product)
                          return (
                            <div key={product.id} style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '10px 12px', borderRadius: '10px',
                              background: 'var(--bg-primary)', border: '1px solid var(--border)'
                            }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{product.category} · {quantity} unit{quantity === 1 ? '' : 's'} left</p>
                              </div>
                              <StockBadge status={status} />
                              <button type="button" className="admin-icon-btn" onClick={() => adjustProductStock(product, 10)} style={{ height: '30px', padding: '0 9px', fontSize: '11px' }}>
                                <FiPlus size={12} /> 10
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Recent orders</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Latest activity from customers</p>
                      </div>
                      <button type="button" className="admin-icon-btn" onClick={() => openTab('orders')} style={{ height: '32px' }}>
                        View all
                      </button>
                    </div>

                    {orders.length === 0 ? (
                      <div style={{ padding: '26px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
                        No orders yet. New orders will appear here.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                        {orders.slice(0, 6).map(order => {
                          const { delivery } = getOrderDetails(order)
                          return (
                            <div key={order.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 12px', borderRadius: '10px',
                              background: 'var(--bg-primary)', border: '1px solid var(--border)'
                            }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FiShoppingBag size={14} color="var(--accent)" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace' }}>#{order.id?.slice(0, 8)?.toUpperCase()}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {delivery.name || 'Unknown customer'} · {money(order.total)}
                                </p>
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{order.status}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: 'min(320px, 100%)' }}>
                      <FiSearch size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
                      <input
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Search products, categories, stock..."
                        style={{ ...inputStyle, paddingLeft: '34px' }}
                      />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                      Showing {filteredProducts.length} of {products.length}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="button" onClick={() => { resetForm(); setShowBulkImport(true); setBulkText(''); setBulkError(''); setBulkSuccess('') }} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      background: 'transparent', color: 'var(--accent)',
                      padding: '11px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--accent)', cursor: 'pointer'
                    }}><FiUpload size={15} /> Bulk Import</motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} type="button" onClick={() => { resetForm(); setShowForm(true) }} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '7px',
                      background: 'var(--accent)', color: 'var(--bg-primary)',
                      padding: '11px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
                    }}><FiPlus size={15} /> Add Product</motion.button>
                  </div>
                </div>

                <AnimatePresence>
                  {showBulkImport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <div>
                            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>Bulk Import Products</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                              Columns: name, description, category, price, discount, stock_quantity, image_url. Stock status is calculated from the quantity.
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
                            ? `name,description,category,price,discount,stock_quantity,image_url\n"Plastic Dinner Plate Set","BPA-free, 10.5 inch",Plastic Crockery,1450,0,25,/images/category-plastic.svg`
                            : `[\n  { "name": "Plastic Dinner Plate Set", "price": 1450, "category": "Plastic Crockery", "stock_quantity": 25 },\n  { "name": "Amber Tumbler Set", "price": 1890, "category": "Glassware", "discount": 10, "stock_quantity": 18 }\n]`}
                          style={{
                            width: '100%', minHeight: '180px', padding: '14px',
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

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
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
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '22px' }}>
                        <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>
                          {editProduct ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        {saveError && <p role="alert" style={{ marginBottom: '16px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{saveError}</p>}

                        <div className="admin-form-grid">
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
                            <input style={inputStyle} type="number" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1299" />
                          </div>
                          <div>
                            <label style={labelStyle}>Discount (%)</label>
                            <input style={inputStyle} type="number" min="0" max="100" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="e.g. 10" />
                          </div>
                          <div>
                            <label style={labelStyle}>Stock Quantity *</label>
                            <input
                              style={inputStyle}
                              type="number"
                              min="0"
                              step="1"
                              value={form.stock_quantity}
                              onChange={e => setForm({ ...form, stock_quantity: e.target.value })}
                              placeholder="e.g. 25"
                            />
                            <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-faint)' }}>
                              0 = out of stock · 1–{LOW_STOCK_THRESHOLD} = low stock · status updates automatically
                            </p>
                          </div>
                          <div>
                            <label style={labelStyle}>Current Stock Status</label>
                            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', minHeight: '42px' }}>
                              <StockBadge status={stockStatusForQuantity(form.stock_quantity === '' ? 0 : Number(form.stock_quantity))} />
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>Home Collection Tags</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(form.is_fast_selling)}
                                  onChange={e => setForm({ ...form, is_fast_selling: e.target.checked })}
                                />
                                Show in Fast Selling
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(form.is_good_reviews)}
                                  onChange={e => setForm({ ...form, is_good_reviews: e.target.checked })}
                                />
                                Show in Great Reviews
                              </label>
                            </div>
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

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="button" onClick={handleSave} disabled={saving} style={{
                            background: 'var(--accent)', color: 'var(--bg-primary)',
                            padding: '12px 28px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer'
                          }}>{saving ? 'Saving...' : editProduct ? 'Update Product' : 'Save Product'}</motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="button" onClick={resetForm} style={{
                            background: 'transparent', color: 'var(--text-muted)',
                            padding: '12px 28px', borderRadius: '8px', fontSize: '14px', border: '1px solid var(--border)', cursor: 'pointer'
                          }}>Cancel</motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="admin-table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
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
                      ) : filteredProducts.map((p, index) => {
                        const quantity = productStockQuantity(p)
                        const status = productStockStatus(p)
                        return (
                          <motion.tr key={p.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.02 }}
                            style={{ borderBottom: '1px solid var(--border)', boxShadow: status === 'low stock' ? 'inset 3px 0 0 #EF9F27' : 'none', transition: 'background-color 0.2s' }}
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
                                <div>
                                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{p.name}</span>
                                  {(p.is_fast_selling || p.is_good_reviews) && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                                      {p.is_fast_selling && (
                                        <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1px 6px' }}>
                                          Fast selling
                                        </span>
                                      )}
                                      {p.is_good_reviews && (
                                        <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1px 6px' }}>
                                          Great reviews
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.category}</td>
                            <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>{money(p.price)}</td>
                            <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.discount > 0 ? `${p.discount}%` : '-'}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{quantity} units</span>
                                  <StockBadge status={status} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <button type="button" onClick={() => adjustProductStock(p, -1)} aria-label={`Remove one ${p.name}`} style={{
                                    width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border)',
                                    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1
                                  }}>−</button>
                                  <button type="button" onClick={() => adjustProductStock(p, 1)} aria-label={`Add one ${p.name}`} style={{
                                    width: '24px', height: '24px', borderRadius: '6px', border: '1px solid var(--border)',
                                    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1
                                  }}>+</button>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => handleEdit(p)} style={{
                                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer'
                                }}>Edit</motion.button>
                                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" onClick={() => handleDelete(p.id)} style={{
                                  padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                  background: 'transparent', border: '1px solid #E24B4A', color: '#E24B4A', cursor: 'pointer'
                                }}>Delete</motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div key="orders" variants={fadeUp} initial="hidden" animate="visible" exit="exit">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                    {orders.length} order{orders.length === 1 ? '' : 's'} · {stats.pendingOrders} pending · stock is deducted on confirmation and restored on cancellation or refund
                  </p>
                  <button type="button" className="admin-icon-btn" onClick={fetchOrders}>
                    <FiRefreshCw size={14} /> Refresh
                  </button>
                </div>

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
                      const stockIsDeducted = typeof order.stock_deducted === 'boolean'
                        ? order.stock_deducted
                        : ['confirmed', 'shipped', 'delivered'].includes(order.status)
                      const stockNote = stockIsDeducted
                        ? 'Stock deducted for this order'
                        : ['cancelled', 'refunded'].includes(order.status)
                          ? 'Stock restored to inventory'
                          : 'Stock will be deducted when confirmed'
                      const isOnlinePayment = Boolean(order.payment_method && order.payment_method !== 'cod')
                      const paymentStatus = order.payment_status || (isOnlinePayment ? 'awaiting_verification' : 'cod')
                      const paymentStatusLabel = {
                        cod: 'Cash on Delivery',
                        awaiting_verification: 'Awaiting verification',
                        verified: 'Payment verified',
                        rejected: 'Payment rejected',
                      }[paymentStatus] || paymentStatus
                      const paymentStatusColor = {
                        cod: 'var(--text-muted)',
                        awaiting_verification: '#FAEDCD',
                        verified: '#86EFAC',
                        rejected: '#E24B4A',
                      }[paymentStatus] || 'var(--text-muted)'
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
                                {money(order.total)}
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

                          <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: '12px', flexWrap: 'wrap', marginBottom: '14px',
                            padding: '12px 14px', borderRadius: '10px',
                            background: 'var(--bg-primary)', border: '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>
                                Payment
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                                {order.payment_method || 'cod'}
                              </span>
                              <span style={{
                                fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px',
                                color: paymentStatusColor, border: `1px solid ${paymentStatusColor}55`
                              }}>
                                {paymentStatusLabel}
                              </span>
                              {order.payment_verified_at && (
                                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                                  verified {new Date(order.payment_verified_at).toLocaleDateString()}
                                </span>
                              )}
                              {delivery.email && (
                                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{delivery.email}</span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {order.payment_receipt_url ? (
                                <a
                                  href={order.payment_receipt_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textDecoration: 'none' }}>
                                  <FiExternalLink size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                                  View receipt
                                </a>
                              ) : isOnlinePayment ? (
                                <span style={{ fontSize: '11px', color: '#E24B4A' }}>No receipt uploaded</span>
                              ) : null}

                              {isOnlinePayment && paymentStatus !== 'verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleOrderAction(order.id, 'verify-payment')}
                                  style={adminActionStyle('#2F7F75')}>
                                  <FiCheckCircle size={12} /> Verify payment
                                </button>
                              )}
                              {isOnlinePayment && paymentStatus === 'awaiting_verification' && (
                                <button
                                  type="button"
                                  onClick={() => handleOrderAction(order.id, 'reject-payment')}
                                  style={adminActionStyle('#E24B4A')}>
                                  Reject receipt
                                </button>
                              )}
                            </div>
                          </div>

                          {order.payment_note && (
                            <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '14px' }}>
                              Payment note: {order.payment_note}
                            </p>
                          )}

                          {items.length > 0 && (
                            <div className="admin-order-items">
                              {items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', gap: '12px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {item.name} <span style={{ color: 'var(--text-faint)' }}>× {item.qty || 1}</span>
                                  </span>
                                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                                    {money((item.finalPrice ?? item.price) * (item.qty || 1))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '14px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Status</span>
                            <select
                              value={order.status}
                              onChange={e => handleStatusChange(order.id, e.target.value)}
                              style={{ ...inputStyle, width: '160px', cursor: 'pointer', textTransform: 'capitalize' }}>
                              {ORDER_STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: 'auto' }}>{stockNote}</span>
                          </div>

                          {order.refund_status && order.refund_status !== 'none' && (
                            <div style={{
                              marginTop: '14px', padding: '12px 14px', borderRadius: '10px',
                              background: order.refund_status === 'requested' ? 'rgba(250,237,205,0.08)' : 'var(--bg-primary)',
                              border: '1px solid var(--border)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                  Refund {order.refund_status}
                                </strong>
                                {order.refund_requested_at && (
                                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                                    requested {new Date(order.refund_requested_at).toLocaleString()}
                                  </span>
                                )}
                                {order.refund_status === 'requested' && (
                                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                                    <button type="button" onClick={() => handleOrderAction(order.id, 'approve-refund')} style={adminActionStyle('#2F7F75')}>
                                      <FiCheckCircle size={12} /> Approve refund
                                    </button>
                                    <button type="button" onClick={() => handleOrderAction(order.id, 'reject-refund')} style={adminActionStyle('#E24B4A')}>
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                              {order.refund_reason && (
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                  Customer: “{order.refund_reason}”
                                </p>
                              )}
                              {order.refund_note && (
                                <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '4px' }}>
                                  Note: {order.refund_note}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'admins' && isSuperAdmin && (
              <motion.div key="admins" variants={fadeUp} initial="hidden" animate="visible" exit="exit" style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiShield size={17} color="var(--accent)" /> Admin accounts
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-faint)', maxWidth: '620px', lineHeight: '1.6' }}>
                      Only super admins can create or remove admin accounts. New admins can sign in at <strong style={{ color: 'var(--text-muted)' }}>/admin/login</strong>.
                    </p>
                  </div>
                  <button type="button" className="admin-icon-btn" onClick={fetchAdmins} disabled={adminsLoading}>
                    <FiRefreshCw size={14} className={adminsLoading ? 'admin-spin' : ''} /> Refresh
                  </button>
                </div>

                {adminsError && (
                  <p role="alert" style={{ marginBottom: '16px', padding: '10px 12px', color: '#ffaaa2', background: 'rgba(226,75,74,.13)', border: '1px solid rgba(226,75,74,.45)', borderRadius: '7px', fontSize: '13px' }}>{adminsError}</p>
                )}
                {adminsMessage && (
                  <p role="status" style={{ marginBottom: '16px', padding: '10px 12px', color: '#2F7F75', background: 'rgba(47,127,117,.1)', border: '1px solid rgba(47,127,117,.35)', borderRadius: '7px', fontSize: '13px' }}>{adminsMessage}</p>
                )}

                <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '18px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <FiUserPlus size={15} /> Create a new admin
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                    <label htmlFor="admin-full-name">
                      <span style={labelStyle}>Full name</span>
                      <input id="admin-full-name" type="text" value={adminForm.fullName} placeholder="e.g. Ahmed Khan"
                        onChange={event => { setAdminForm(prev => ({ ...prev, fullName: event.target.value })); setAdminsError(''); setAdminsMessage('') }}
                        style={inputStyle} />
                    </label>
                    <label htmlFor="admin-email">
                      <span style={labelStyle}>Email</span>
                      <input id="admin-email" type="email" value={adminForm.email} placeholder="admin@example.com"
                        onChange={event => { setAdminForm(prev => ({ ...prev, email: event.target.value })); setAdminsError(''); setAdminsMessage('') }}
                        style={inputStyle} />
                    </label>
                    <label htmlFor="admin-password">
                      <span style={labelStyle}>Temporary password</span>
                      <input id="admin-password" type="password" value={adminForm.password} placeholder="Min. 6 characters"
                        onChange={event => { setAdminForm(prev => ({ ...prev, password: event.target.value })); setAdminsError(''); setAdminsMessage('') }}
                        style={inputStyle} />
                    </label>
                  </div>
                  <button type="button" onClick={handleCreateAdmin} disabled={adminSaving}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      background: 'var(--accent)', color: 'var(--bg-primary)',
                      padding: '11px 20px', borderRadius: '8px', fontSize: '13px',
                      fontWeight: '800', border: 'none', marginTop: '16px',
                      cursor: adminSaving ? 'wait' : 'pointer', opacity: adminSaving ? 0.7 : 1
                    }}>
                    <FiUserPlus size={14} /> {adminSaving ? 'Creating...' : 'Create admin'}
                  </button>
                </div>

                <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Current admins
                </h3>
                {admins.length === 0 ? (
                  <div style={{ padding: '22px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '9px' }}>
                    No admin accounts found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {admins.map(admin => (
                      <div key={admin.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                        padding: '12px 14px', borderRadius: '10px',
                        background: 'var(--bg-primary)', border: '1px solid var(--border)'
                      }}>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            {admin.fullName || admin.email}
                          </p>
                          <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{admin.email}</p>
                        </div>
                        <span style={{
                          padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: '800',
                          textTransform: 'uppercase', letterSpacing: '0.5px',
                          background: admin.role === 'super_admin' ? 'rgba(47,127,117,.15)' : 'var(--bg-surface2)',
                          color: admin.role === 'super_admin' ? 'var(--accent)' : 'var(--text-muted)'
                        }}>
                          {admin.role === 'super_admin' ? 'Super admin' : 'Admin'}
                        </span>
                        {admin.role === ADMIN_ROLE && (
                          <button type="button" onClick={() => handleRevokeAdmin(admin)} style={adminActionStyle('#E24B4A')}>
                            <FiTrash2 size={12} /> Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div key="settings" variants={fadeUp} initial="hidden" animate="visible" exit="exit" style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Site information
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-faint)', maxWidth: '620px', lineHeight: '1.6' }}>
                      These details appear on the landing page and footer. Save once and the storefront updates automatically.
                    </p>
                  </div>
                  <a href="/" target="_blank" rel="noreferrer" className="admin-icon-btn" style={{ textDecoration: 'none' }}>
                    <FiExternalLink size={14} /> View storefront
                  </a>
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
                    { key: 'lowStockThreshold', label: 'Low-stock home section threshold (units)', type: 'number', placeholder: '5', min: 1, max: 50 },
                  ].map(field => (
                    <label key={field.key} htmlFor={`site-${field.key}`}>
                      <span style={labelStyle}>{field.label}</span>
                      <input
                        id={`site-${field.key}`}
                        type={field.type}
                        value={siteForm[field.key]}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        onChange={event => updateSiteField(field.key, event.target.value)}
                        style={inputStyle}
                      />
                      {field.key === 'lowStockThreshold' && (
                        <span style={{ display: 'block', marginTop: '6px', fontSize: '11px', color: 'var(--text-faint)' }}>
                          Products with 1–{siteForm.lowStockThreshold || 5} units appear in the “Almost gone” section.
                        </span>
                      )}
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
                  <motion.button
                    whileHover={{ scale: siteSaving || siteLoading ? 1 : 1.02 }}
                    whileTap={{ scale: siteSaving || siteLoading ? 1 : 0.97 }}
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
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: siteLoading ? 1 : 1.02 }}
                    whileTap={{ scale: siteLoading ? 1 : 0.97 }}
                    type="button"
                    onClick={fetchSiteSettings}
                    disabled={siteLoading}
                    style={{
                      background: 'transparent', color: 'var(--text-muted)',
                      padding: '12px 20px', borderRadius: '8px', fontSize: '14px',
                      border: '1px solid var(--border)', cursor: siteLoading ? 'wait' : 'pointer'
                    }}>
                    {siteLoading ? 'Loading...' : 'Reload saved'}
                  </motion.button>
                  <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                    Phone, email and social links are also used in the footer.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
