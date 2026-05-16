import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, ShoppingCart, Package, Tag, BarChart2,
  ClipboardList, FileText, Settings, LogOut, Zap
} from 'lucide-react'

const ownerNav = [
  { label: 'Overview',    icon: LayoutDashboard, to: '/dashboard' },
  { label: 'POS / Billing', icon: ShoppingCart,  to: '/pos' },
]
const ownerMgmt = [
  { label: 'Products',   icon: Package,      to: '/products' },
  { label: 'Categories', icon: Tag,          to: '/categories' },
  { label: 'Stock',      icon: BarChart2,    to: '/stock' },
  { label: 'Orders',     icon: ClipboardList, to: '/orders' },
  { label: 'Invoices',   icon: FileText,     to: '/invoices' },
]
const workerNav = [
  { label: 'POS / Billing', icon: ShoppingCart, to: '/pos' },
]

export default function Layout() {
  const { user, logout, isOwner } = useAuth()
  const navigate = useNavigate()

  const doLogout = () => { logout(); navigate('/login') }
  const nav  = isOwner ? ownerNav  : workerNav
  const mgmt = isOwner ? ownerMgmt : []

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="flex items-center gap-2">
            <div style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius: 8, padding: '5px 7px', display:'flex' }}>
              <Zap size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <div className="logo-mark">QuickBill</div>
              <div className="logo-sub">{isOwner ? 'Owner Panel' : 'Cashier POS'}</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive?' active':''}`}>
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}

          {mgmt.length > 0 && (
            <>
              <div className="nav-section-label">Management</div>
              {mgmt.map(item => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive?' active':''}`}>
                  <item.icon size={16} /> {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="nav-section-label">Account</div>
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive?' active':''}`}>
            <Settings size={16} /> Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar" style={{ background: isOwner ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs" style={{ color: isOwner ? 'var(--accent-light)' : 'var(--green)' }}>
                {isOwner ? 'Owner' : 'Worker'}
              </div>
            </div>
            <button onClick={doLogout} className="btn-icon" title="Logout" style={{ border: 'none', background: 'transparent' }}>
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
