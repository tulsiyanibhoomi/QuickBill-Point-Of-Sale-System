import api from './axios'

export const authApi = {
  login:          (d) => api.post('/auth/login', d),
  me:             ()  => api.get('/auth/me'),
  changePassword: (d) => api.put('/auth/change-password', d),
}

export const categoriesApi = {
  getAll:   ()       => api.get('/categories'),
  create:   (d)      => api.post('/categories', d),
  update:   (id, d)  => api.put(`/categories/${id}`, d),
  remove:   (id)     => api.delete(`/categories/${id}`),
}

export const productsApi = {
  getAll:  (params) => api.get('/products', { params }),
  getById: (id)     => api.get(`/products/${id}`),
  create:  (d)      => api.post('/products', d),
  update:  (id, d)  => api.put(`/products/${id}`, d),
  remove:  (id)     => api.delete(`/products/${id}`),
}

export const stockApi = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  getLowStock:  ()       => api.get('/stock/low-stock'),
  adjust:       (d)      => api.post('/stock/adjust', d),
}

export const ordersApi = {
  getAll:       (params) => api.get('/orders', { params }),
  getById:      (id)     => api.get(`/orders/${id}`),
  create:       (d)      => api.post('/orders', d),
  updateStatus: (id, s)  => api.put(`/orders/${id}/status`, { status: s }),
}

export const invoicesApi = {
  getAll:    (params) => api.get('/invoices', { params }),
  getById:   (id)     => api.get(`/invoices/${id}`),
  getPdfData:(id)     => api.get(`/invoices/${id}/pdf-data`),
  getByNumber:(n)     => api.get(`/invoices/number/${n}`),
}

export const dashboardApi = {
  getSummary:        ()       => api.get('/dashboard/summary'),
  getRevenue:        (params) => api.get('/dashboard/revenue', { params }),
  getTopProducts:    (params) => api.get('/dashboard/top-products', { params }),
  getCategoryRevenue:()       => api.get('/dashboard/category-revenue'),
}
