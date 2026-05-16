import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard    from './pages/Dashboard'
import POS          from './pages/POS'
import Products     from './pages/Products'
import Categories   from './pages/Categories'
import Stock        from './pages/Stock'
import Orders       from './pages/Orders'
import Invoices     from './pages/Invoices'
import InvoiceView  from './pages/InvoiceView'
import Settings     from './pages/Settings'

function PrivateRoute({ children, ownerOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (ownerOnly && user.role !== 'owner') return <Navigate to="/pos" replace />
  return children
}

function PublicRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'owner' ? '/dashboard' : '/pos'} replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"  element={<PrivateRoute ownerOnly><Dashboard /></PrivateRoute>} />
            <Route path="pos"        element={<POS />} />
            <Route path="products"   element={<PrivateRoute ownerOnly><Products /></PrivateRoute>} />
            <Route path="categories" element={<PrivateRoute ownerOnly><Categories /></PrivateRoute>} />
            <Route path="stock"      element={<PrivateRoute ownerOnly><Stock /></PrivateRoute>} />
            <Route path="orders"     element={<PrivateRoute ownerOnly><Orders /></PrivateRoute>} />
            <Route path="invoices"   element={<PrivateRoute ownerOnly><Invoices /></PrivateRoute>} />
            <Route path="invoices/:id" element={<InvoiceView />} />
            <Route path="settings"   element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
