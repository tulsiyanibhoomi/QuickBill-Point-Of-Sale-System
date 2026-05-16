import { useState, useEffect } from 'react'
import { stockApi, productsApi } from '../api/services'
import toast from 'react-hot-toast'
import { AlertTriangle, ArrowUpCircle, ArrowDownCircle, X, RefreshCw } from 'lucide-react'

const TYPE_COLORS = { purchase:'badge-green', sale:'badge-blue', adjustment:'badge-yellow', damage:'badge-red', return:'badge-purple' }

export default function Stock() {
  const [tab,      setTab]      = useState('movements')
  const [movements,setMovements]= useState([])
  const [lowStock, setLowStock] = useState([])
  const [products, setProducts] = useState([])
  const [pagination,setPagination]= useState({})
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [form,     setForm]     = useState({ product_id:'', type:'purchase', quantity_change:'', note:'' })
  const [saving,   setSaving]   = useState(false)

  const loadMovements = async () => {
    setLoading(true)
    try { const r = await stockApi.getMovements({ page, limit:20 }); setMovements(r.data.data); setPagination(r.data.meta||{}) }
    catch { toast.error('Failed') } finally { setLoading(false) }
  }
  const loadLow  = async () => { setLoading(true); try { const r = await stockApi.getLowStock(); setLowStock(r.data.data) } catch (e) { console.error(e) } finally { setLoading(false) } }
  const loadProds = async () => { try { const r = await productsApi.getAll({ limit:200 }); setProducts(r.data.data) } catch (e) { console.error(e) } }

  useEffect(() => { loadProds() }, [])
  useEffect(() => { tab==='movements' ? loadMovements() : loadLow() }, [tab, page])

  const adjust = async e => {
    e.preventDefault()
    if (!form.product_id || !form.quantity_change || form.quantity_change == 0) return toast.error('Fill all required fields')
    setSaving(true)
    try {
      await stockApi.adjust({ ...form, quantity_change: parseInt(form.quantity_change, 10) })
      toast.success('Stock adjusted'); setModal(false); setForm({ product_id:'', type:'purchase', quantity_change:'', note:'' })
      if (tab==='movements') loadMovements(); else loadLow()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const fmt = d => new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Stock Management</span>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => tab==='movements' ? loadMovements() : loadLow()}><RefreshCw size={14}/></button>
          <button className="btn btn-primary" onClick={() => setModal(true)}><ArrowUpCircle size={15}/> Adjust Stock</button>
        </div>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['movements','low-stock'].map(t => (
            <button key={t} onClick={() => { setTab(t); setPage(1) }}
              className={`btn ${tab===t ? 'btn-primary' : 'btn-secondary'}`}>
              {t==='movements' ? 'Movement Log' : <><AlertTriangle size={14}/> Low Stock ({lowStock.length || '…'})</>}
            </button>
          ))}
        </div>

        {tab === 'movements' && (
          <div className="card" style={{ padding:0 }}>
            <div className="table-wrapper">
              {loading ? <div className="page-loader"><div className="spinner"/></div> : (
                <table>
                  <thead><tr>
                    <th>Product</th><th>Type</th><th>Change</th><th>Before</th><th>After</th><th>Note</th><th>By</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id}>
                        <td><div className="font-medium text-sm">{m.product_name}</div><div className="text-xs text-muted mono">{m.product_sku||''}</div></td>
                        <td><span className={`badge ${TYPE_COLORS[m.type]||'badge-gray'}`}>{m.type}</span></td>
                        <td>
                          <span className={`font-semibold ${m.quantity_change > 0 ? 'text-green' : 'text-red'}`} style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {m.quantity_change > 0 ? <ArrowUpCircle size={14}/> : <ArrowDownCircle size={14}/>}
                            {m.quantity_change > 0 ? '+':''}{m.quantity_change}
                          </span>
                        </td>
                        <td className="text-muted">{m.quantity_before}</td>
                        <td className="font-medium">{m.quantity_after}</td>
                        <td className="text-sm text-muted">{m.note||'—'}</td>
                        <td className="text-sm">{m.created_by_name||'—'}</td>
                        <td className="text-xs text-muted">{fmt(m.created_at)}</td>
                      </tr>
                    ))}
                    {!loading && movements.length===0 && <tr><td colSpan={8}><div className="empty-state">No movements yet</div></td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === 'low-stock' && (
          <div>
            {loading ? <div className="page-loader"><div className="spinner"/></div> : (
              lowStock.length === 0 ? (
                <div className="empty-state card"><h3>✅ All products are well-stocked!</h3></div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:'1rem' }}>
                  {lowStock.map(p => (
                    <div key={p.id} className="card" style={{ borderColor: p.quantity_in_stock <= 0 ? 'var(--red)' : 'var(--yellow)', padding:'1.1rem' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{p.name}</span>
                        <span className={`badge ${p.quantity_in_stock <= 0 ? 'badge-red' : 'badge-yellow'}`}>
                          {p.quantity_in_stock <= 0 ? 'Out of Stock' : 'Low'}
                        </span>
                      </div>
                      <div className="text-xs text-muted mb-1">{p.category_name || 'Uncategorised'}</div>
                      <div className="flex justify-between text-sm">
                        <span>Current: <strong style={{ color: p.quantity_in_stock<=0 ? 'var(--red)':'var(--yellow)' }}>{p.quantity_in_stock}</strong></span>
                        <span className="text-muted">Min: {p.min_stock_level}</span>
                      </div>
                      <button className="btn btn-sm btn-success w-full mt-2" style={{ justifyContent:'center' }}
                        onClick={() => { setForm(f=>({...f,product_id:String(p.id),type:'purchase'})); setModal(true) }}>
                        <ArrowUpCircle size={13}/> Restock
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {tab==='movements' && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted">
            <span>Page {pagination.page} of {pagination.total_pages}</span>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
              <button className="btn btn-secondary btn-sm" disabled={page>=pagination.total_pages} onClick={()=>setPage(p=>p+1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Stock Adjustment</span>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={16}/></button>
            </div>
            <form onSubmit={adjust} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Product *</label>
                <select value={form.product_id} onChange={e => setForm(f=>({...f,product_id:e.target.value}))} required>
                  <option value="">Select product…</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} (stock: {p.quantity_in_stock})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                  <option value="purchase">Purchase (add stock)</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="damage">Damage (remove)</option>
                  <option value="return">Return (add back)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity Change * <span className="text-muted">(positive = add, negative = remove)</span></label>
                <input type="number" value={form.quantity_change} onChange={e => setForm(f=>({...f,quantity_change:e.target.value}))} placeholder="+10 or -5" required />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input value={form.note} onChange={e => setForm(f=>({...f,note:e.target.value}))} placeholder="e.g. New shipment received" />
              </div>
              <div className="modal-footer" style={{ margin:0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<span className="spinner"/>:'Apply Adjustment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
