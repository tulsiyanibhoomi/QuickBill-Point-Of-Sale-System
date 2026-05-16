import { useState, useEffect } from 'react'
import { productsApi, categoriesApi } from '../api/services'
import toast from 'react-hot-toast'
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle } from 'lucide-react'

const EMPTY = { name:'', sku:'', barcode:'', category_id:'', description:'', unit:'piece', selling_price:'', cost_price:'', tax_rate:18, quantity_in_stock:0, min_stock_level:5 }

export default function Products() {
  const [products,   setProducts]   = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({})
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCat]        = useState('')
  const [page,       setPage]       = useState(1)
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll({ search, category_id: catFilter, page, limit:15 })
      setProducts(res.data.data); setPagination(res.data.meta || {})
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }
  const loadCategories = async () => {
    try { const r = await categoriesApi.getAll(); setCategories(r.data.data) } catch (e) { console.error(e) }
  }

  useEffect(() => { loadCategories() }, [])
  useEffect(() => { loadProducts() }, [search, catFilter, page])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (p)  => { setEditing(p); setForm({ ...p, category_id: p.category_id || '', cost_price: p.cost_price || '', sku: p.sku||'', barcode: p.barcode||'' }); setModal(true) }
  const closeModal = ()   => { setModal(false); setEditing(null) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name || !form.selling_price) return toast.error('Name and price are required')
    setSaving(true)
    try {
      const payload = { ...form, category_id: form.category_id || undefined, sku: form.sku||undefined, barcode: form.barcode||undefined, cost_price: form.cost_price||undefined }
      if (editing) { await productsApi.update(editing.id, payload) } else { await productsApi.create(payload) }
      toast.success(editing ? 'Product updated' : 'Product created')
      closeModal(); loadProducts()
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const remove = async (p) => {
    if (!confirm(`Deactivate "${p.name}"?`)) return
    try { await productsApi.remove(p.id); toast.success('Product deactivated'); loadProducts() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Products</span>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15}/> Add Product</button>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="search-wrap" style={{ flex:1 }}>
            <Search size={15}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search products…" />
          </div>
          <select value={catFilter} onChange={e=>{setCat(e.target.value);setPage(1)}} style={{ width:180 }}>
            <option value="">All Categories</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="card" style={{ padding:0 }}>
          <div className="table-wrapper">
            {loading ? <div className="page-loader"><div className="spinner"/></div> : (
              <table>
                <thead><tr>
                  <th>Product</th><th>SKU</th><th>Category</th>
                  <th>Price (excl.)</th><th>Tax</th><th>Stock</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {products.length === 0 && <tr><td colSpan={8}><div className="empty-state"><Package size={40}/><h3>No products yet</h3></div></td></tr>}
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium">{p.name}</div>
                        {p.barcode && <div className="text-xs text-muted mono">{p.barcode}</div>}
                      </td>
                      <td><span className="mono text-sm">{p.sku || '—'}</span></td>
                      <td>{p.category_name ? <span className="badge badge-blue">{p.category_name}</span> : '—'}</td>
                      <td className="font-semibold">₹{Number(p.selling_price).toLocaleString('en-IN')}</td>
                      <td>{p.tax_rate}%</td>
                      <td>
                        <span className={p.quantity_in_stock <= 0 ? 'text-red font-semibold' : p.quantity_in_stock <= p.min_stock_level ? 'text-yellow' : ''}>
                          {p.quantity_in_stock} {p.quantity_in_stock <= p.min_stock_level && p.quantity_in_stock > 0 && <AlertTriangle size={12} style={{ display:'inline' }}/>}
                        </span>
                      </td>
                      <td><span className={`badge ${p.is_active ? 'badge-green' : 'badge-red'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-icon" onClick={() => openEdit(p)} title="Edit"><Edit2 size={14}/></button>
                          <button className="btn-icon" onClick={() => remove(p)} title="Deactivate" style={{ color:'var(--red)' }}><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted">
            <span>Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page>=pagination.total_pages} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Product' : 'Add Product'}</span>
              <button className="btn-icon" onClick={closeModal}><X size={16}/></button>
            </div>
            <form onSubmit={save}>
              <div className="grid-2">
                <div className="form-group" style={{ gridColumn:'1/-1' }}>
                  <label className="form-label">Product Name *</label>
                  <input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="e.g. Classmate Notebook" />
                </div>
                <div className="form-group"><label className="form-label">SKU</label><input value={form.sku} onChange={e=>f('sku',e.target.value)} placeholder="e.g. NB-001" /></div>
                <div className="form-group"><label className="form-label">Barcode</label><input value={form.barcode} onChange={e=>f('barcode',e.target.value)} placeholder="e.g. 8901234567890" /></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select value={form.category_id} onChange={e=>f('category_id',e.target.value)}>
                    <option value="">No Category</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Unit</label>
                  <select value={form.unit} onChange={e=>f('unit',e.target.value)}>
                    {['piece','pack','box','kg','litre','pair','set','dozen'].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Selling Price (₹) *</label><input type="number" step="0.01" value={form.selling_price} onChange={e=>f('selling_price',e.target.value)} placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">Cost Price (₹)</label><input type="number" step="0.01" value={form.cost_price} onChange={e=>f('cost_price',e.target.value)} placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">GST Rate (%)</label><input type="number" step="0.01" value={form.tax_rate} onChange={e=>f('tax_rate',e.target.value)} /></div>
                {!editing && <div className="form-group"><label className="form-label">Opening Stock</label><input type="number" value={form.quantity_in_stock} onChange={e=>f('quantity_in_stock',e.target.value)} /></div>}
                <div className="form-group"><label className="form-label">Min Stock Level</label><input type="number" value={form.min_stock_level} onChange={e=>f('min_stock_level',e.target.value)} /></div>
                <div className="form-group" style={{ gridColumn:'1/-1' }}><label className="form-label">Description</label><textarea rows={2} value={form.description} onChange={e=>f('description',e.target.value)} placeholder="Optional description" style={{ resize:'vertical' }} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<span className="spinner"/>:(editing?'Update':'Create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
