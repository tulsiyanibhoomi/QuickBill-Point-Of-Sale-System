import { useState, useEffect } from 'react'
import { ordersApi } from '../api/services'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Ban, RefreshCw } from 'lucide-react'

const STATUS_BADGE = { completed:'badge-green', void:'badge-red' }
const PM_BADGE     = { CASH:'badge-green', UPI:'badge-blue', CARD:'badge-purple' }

const fmtRs  = n => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const fmtDt  = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})

export default function Orders() {
  const navigate = useNavigate()
  const [orders,     setOrders]     = useState([])
  const [pagination, setPagination] = useState({})
  const [page,       setPage]       = useState(1)
  const [status,     setStatus]     = useState('')
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { load() }, [page, status, dateFrom, dateTo])

  const load = async () => {
    setLoading(true)
    try {
      const r = await ordersApi.getAll({ page, limit:15, status: status||undefined, date_from: dateFrom||undefined, date_to: dateTo||undefined })
      setOrders(r.data.data); setPagination(r.data.meta||{})
    } catch { toast.error('Failed to load orders') }
    finally { setLoading(false) }
  }

  const voidOrder = async (o) => {
    if (!confirm(`Void order #${o.id}? This cannot be undone.`)) return
    try { await ordersApi.updateStatus(o.id, 'void'); toast.success('Order voided'); load() }
    catch (err) { toast.error(err.response?.data?.message||'Failed') }
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Orders</span>
        <button className="btn btn-secondary" onClick={load}><RefreshCw size={14}/></button>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} style={{ width:160 }}>
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="void">Void</option>
          </select>
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{ width:160 }} />
          <span className="flex items-center text-muted text-sm">to</span>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{ width:160 }} />
          {(status||dateFrom||dateTo) && <button className="btn btn-ghost btn-sm" onClick={()=>{setStatus('');setDateFrom('');setDateTo('');setPage(1)}}>Clear filters</button>}
        </div>

        <div className="card" style={{ padding:0 }}>
          <div className="table-wrapper">
            {loading ? <div className="page-loader"><div className="spinner"/></div> : (
              <table>
                <thead><tr>
                  <th>#</th><th>Invoice</th><th>Customer</th><th>Items</th>
                  <th>Total</th><th>Payment</th><th>Status</th><th>Cashier</th><th>Date</th><th></th>
                </tr></thead>
                <tbody>
                  {orders.length===0 && <tr><td colSpan={10}><div className="empty-state">No orders found</div></td></tr>}
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span className="mono text-sm text-muted">#{o.id}</span></td>
                      <td><span className="mono text-sm" style={{ color:'var(--accent-light)' }}>{o.invoice_number||'—'}</span></td>
                      <td className="text-sm">{o.customer_name||<span className="text-muted italic">Walk-in</span>}</td>
                      <td className="text-sm text-muted">—</td>
                      <td className="font-semibold">{fmtRs(o.grand_total)}</td>
                      <td><span className={`badge ${PM_BADGE[o.payment_method]||'badge-gray'}`}>{o.payment_method}</span></td>
                      <td><span className={`badge ${STATUS_BADGE[o.order_status]||'badge-gray'}`}>{o.order_status}</span></td>
                      <td className="text-sm">{o.cashier_name||'—'}</td>
                      <td className="text-xs text-muted">{fmtDt(o.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-icon" onClick={() => navigate(`/invoices/${o.id}`)} title="View Invoice"><Eye size={14}/></button>
                          {o.order_status==='completed' && <button className="btn-icon" onClick={() => voidOrder(o)} style={{ color:'var(--red)' }} title="Void"><Ban size={14}/></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

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
    </div>
  )
}
