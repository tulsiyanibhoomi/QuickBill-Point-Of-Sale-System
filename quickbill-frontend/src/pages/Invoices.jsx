import { useState, useEffect } from 'react'
import { invoicesApi } from '../api/services'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, Search, RefreshCw } from 'lucide-react'

const fmtRs = n => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const fmtDt = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
const PM_BADGE = { CASH:'badge-green', UPI:'badge-blue', CARD:'badge-purple' }

export default function Invoices() {
  const navigate = useNavigate()
  const [invoices,   setInvoices]   = useState([])
  const [pagination, setPagination] = useState({})
  const [page,       setPage]       = useState(1)
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => { load() }, [page, dateFrom, dateTo])

  const load = async () => {
    setLoading(true)
    try {
      const r = await invoicesApi.getAll({ page, limit:15, date_from:dateFrom||undefined, date_to:dateTo||undefined })
      setInvoices(r.data.data); setPagination(r.data.meta||{})
    } catch { toast.error('Failed to load invoices') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <div className="topbar">
        <span className="topbar-title">Invoices</span>
        <button className="btn btn-secondary" onClick={load}><RefreshCw size={14}/></button>
      </div>
      <div className="page-body">
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{ width:160 }} />
          <span className="flex items-center text-muted text-sm">to</span>
          <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{ width:160 }} />
          {(dateFrom||dateTo) && <button className="btn btn-ghost btn-sm" onClick={()=>{setDateFrom('');setDateTo('');setPage(1)}}>Clear</button>}
        </div>

        <div className="card" style={{ padding:0 }}>
          <div className="table-wrapper">
            {loading ? <div className="page-loader"><div className="spinner"/></div> : (
              <table>
                <thead><tr>
                  <th>Invoice #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Cashier</th><th>Date</th><th></th>
                </tr></thead>
                <tbody>
                  {invoices.length===0 && <tr><td colSpan={8}><div className="empty-state">No invoices found</div></td></tr>}
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td><span className="mono font-semibold" style={{ color:'var(--accent-light)', fontSize:'0.85rem' }}>{inv.invoice_number}</span></td>
                      <td className="text-sm">{inv.customer_name||<span className="text-muted italic">Walk-in</span>}</td>
                      <td className="font-semibold">{fmtRs(inv.grand_total)}</td>
                      <td><span className={`badge ${PM_BADGE[inv.payment_method]||'badge-gray'}`}>{inv.payment_method}</span></td>
                      <td><span className={`badge ${inv.order_status==='completed' ? 'badge-green' : 'badge-red'}`}>{inv.order_status}</span></td>
                      <td className="text-sm">{inv.cashier_name||'—'}</td>
                      <td className="text-xs text-muted">{fmtDt(inv.generated_at)}</td>
                      <td>
                        <button className="btn-icon" onClick={() => navigate(`/invoices/${inv.order_id}`)} title="View"><Eye size={14}/></button>
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
