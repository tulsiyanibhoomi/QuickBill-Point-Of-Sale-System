import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { invoicesApi } from '../api/services'
import toast from 'react-hot-toast'
import { Printer, ArrowLeft, CheckCircle, XCircle, Sparkles, MessageSquare, Copy, X } from 'lucide-react'

const fmtRs = n => `₹${Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2})}`
const fmtDt = d => new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})

export default function InvoiceView() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingSMS, setGeneratingSMS] = useState(false)
  const [smsModal, setSmsModal] = useState(false)
  const [smsDraft, setSmsDraft] = useState('')
  const printRef = useRef()

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const r = await invoicesApi.getPdfData(id)
      setData(r.data.data)
    } catch { toast.error('Invoice not found'); navigate(-1) }
    finally { setLoading(false) }
  }

  const doPrint = () => window.print()

  const handleGenerateSMS = async () => {
    setGeneratingSMS(true);
    try {
      const res = await invoicesApi.generatePromoSMS(id);
      if (res.data.data?.smsDraft) {
        setSmsDraft(res.data.data.smsDraft);
        setSmsModal(true);
      } else {
        toast.error("AI couldn't generate the SMS");
      }
    } catch {
      toast.error("Failed to generate SMS");
    } finally {
      setGeneratingSMS(false);
    }
  };

  if (loading) return <div className="page-loader" style={{ minHeight:'100vh' }}><div className="spinner spinner-lg"/></div>
  if (!data) return null

  const { store, invoice, customer, cashier, items, payment, totals, order_status, notes } = data

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', padding:'1.5rem' }}>
      {/* Controls — hidden on print */}
      <div className="flex items-center gap-3 mb-6 no-print">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button>
        <span style={{ flex:1 }}/>
        <span className={`badge ${order_status==='completed' ? 'badge-green':'badge-red'}`} style={{ padding:'0.4rem 1rem', fontSize:'0.8rem' }}>
          {order_status==='completed' ? <CheckCircle size={13}/>:<XCircle size={13}/>}
          {order_status}
        </span>
        <button className="btn" style={{ background: '#8b5cf6', color: '#fff', border: 'none' }} onClick={handleGenerateSMS} disabled={generatingSMS}>
          {generatingSMS ? <span className="spinner" style={{ width:12, height:12, borderWidth:2, borderColor:'#fff', borderBottomColor:'transparent' }}/> : <Sparkles size={15}/>} AI Promo SMS
        </button>
        <button className="btn btn-primary" onClick={doPrint}><Printer size={15}/> Print Invoice</button>
      </div>

      {/* Invoice card */}
      <div ref={printRef} style={{ maxWidth:680, margin:'0 auto', background:'var(--bg-card)', border:'1px solid var(--border-solid)', borderRadius:'var(--radius-xl)', overflow:'hidden', boxShadow:'var(--shadow-lg)' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#1d4ed8,#0891b2)', padding:'2rem', color:'#fff' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.02em' }}>⚡ {store.name}</h1>
              <p style={{ fontSize:'0.8rem', opacity:0.8, marginTop:'0.25rem' }}>{store.address}</p>
              <p style={{ fontSize:'0.8rem', opacity:0.8 }}>{store.phone}</p>
              {store.gst && <p style={{ fontSize:'0.75rem', opacity:0.7, marginTop:'0.2rem' }}>GST: {store.gst}</p>}
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'0.7rem', opacity:0.7, letterSpacing:'0.1em', textTransform:'uppercase' }}>Invoice</div>
              <div style={{ fontSize:'1.3rem', fontWeight:800, fontFamily:'var(--font-mono)', letterSpacing:'-0.02em' }}>
                {invoice.invoice_number}
              </div>
              <div style={{ fontSize:'0.75rem', opacity:0.8, marginTop:'0.35rem' }}>{fmtDt(invoice.invoice_date)}</div>
            </div>
          </div>
        </div>

        <div style={{ padding:'1.75rem' }}>
          {/* Customer + cashier */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ background:'var(--bg-base)', borderRadius:'var(--radius)', padding:'1rem' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.4rem' }}>Billed To</div>
              <div style={{ fontWeight:600 }}>{customer.name}</div>
              {customer.phone && <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>{customer.phone}</div>}
            </div>
            <div style={{ background:'var(--bg-base)', borderRadius:'var(--radius)', padding:'1rem' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.4rem' }}>Payment</div>
              <div className="flex items-center gap-2">
                <span className={`badge ${payment.method==='CASH'?'badge-green':payment.method==='UPI'?'badge-blue':'badge-purple'}`} style={{ fontSize:'0.8rem' }}>{payment.method}</span>
                <span className="text-sm">{payment.status}</span>
              </div>
              <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.4rem' }}>Cashier: <strong>{cashier}</strong></div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ border:'1px solid var(--border-solid)', borderRadius:'var(--radius)', overflow:'hidden', marginBottom:'1.5rem' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
              <thead>
                <tr style={{ background:'var(--bg-base)' }}>
                  <th style={{ padding:'0.65rem 1rem', textAlign:'left', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Item</th>
                  <th style={{ padding:'0.65rem 1rem', textAlign:'center', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Qty</th>
                  <th style={{ padding:'0.65rem 1rem', textAlign:'right', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Rate</th>
                  <th style={{ padding:'0.65rem 1rem', textAlign:'right', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>GST</th>
                  <th style={{ padding:'0.65rem 1rem', textAlign:'right', color:'var(--text-muted)', fontWeight:600, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} style={{ borderTop:'1px solid var(--border-solid)' }}>
                    <td style={{ padding:'0.75rem 1rem' }}>
                      <div style={{ fontWeight:500 }}>{item.product_name}</div>
                      {item.product_sku && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{item.product_sku}</div>}
                    </td>
                    <td style={{ padding:'0.75rem 1rem', textAlign:'center' }}>{item.quantity}</td>
                    <td style={{ padding:'0.75rem 1rem', textAlign:'right' }}>{fmtRs(item.unit_price)}</td>
                    <td style={{ padding:'0.75rem 1rem', textAlign:'right', color:'var(--text-secondary)', fontSize:'0.8rem' }}>{item.tax_rate}% ({fmtRs(item.tax_amount)})</td>
                    <td style={{ padding:'0.75rem 1rem', textAlign:'right', fontWeight:600 }}>{fmtRs(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <div style={{ width:280 }}>
              {[
                { label:'Subtotal', value: fmtRs(totals.subtotal), style:{} },
                { label:'GST', value: fmtRs(totals.tax_amount), style:{} },
                totals.discount_amount > 0 && { label:'Discount', value:`-${fmtRs(totals.discount_amount)}`, style:{ color:'var(--green)' } },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', fontSize:'0.875rem', color:'var(--text-secondary)', borderBottom:'1px solid var(--border-solid)' }}>
                  <span>{row.label}</span>
                  <span style={row.style}>{row.value}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'0.75rem 0 0', fontSize:'1.15rem', fontWeight:800, color:'var(--accent-light)' }}>
                <span>Grand Total</span>
                <span>{fmtRs(totals.grand_total)}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div style={{ marginTop:'1.5rem', padding:'0.75rem 1rem', background:'var(--bg-base)', borderRadius:'var(--radius)', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
              <strong>Notes:</strong> {notes}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign:'center', marginTop:'2rem', paddingTop:'1rem', borderTop:'1px dashed var(--border-solid)', fontSize:'0.78rem', color:'var(--text-muted)' }}>
            Thank you for shopping at <strong style={{ color:'var(--text-secondary)' }}>{store.name}</strong>!<br/>
            This is a computer-generated invoice.
          </div>
        </div>
      </div>

      {smsModal && (
        <div className="modal-overlay" onClick={() => setSmsModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
            <div className="modal-header">
              <span className="modal-title flex items-center gap-2" style={{ color: '#8b5cf6' }}><MessageSquare size={18}/> AI Promo SMS Draft</span>
              <button className="btn-icon" onClick={() => setSmsModal(false)}><X size={16}/></button>
            </div>
            <div className="p-4" style={{ padding: '1rem' }}>
               <textarea 
                 value={smsDraft} 
                 onChange={e=>setSmsDraft(e.target.value)} 
                 rows={5} 
                 style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-solid)', fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical' }}
               />
               <p className="text-xs text-muted mt-2">Copy and send this to your customer via WhatsApp or SMS to drive repeat visits!</p>
            </div>
            <div className="modal-footer" style={{ margin:0, padding: '1rem', borderTop: '1px solid var(--border-solid)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSmsModal(false)}>Close</button>
              <button type="button" className="btn btn-primary flex items-center gap-2" onClick={() => { navigator.clipboard.writeText(smsDraft); toast.success('Copied to clipboard'); }}>
                <Copy size={14}/> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
