import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5454'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('deltaedge_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('deltaedge_token')
      localStorage.removeItem('deltaedge_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── AUTH ──
export const authAPI = {
  login:    (data)  => api.post('/auth/signin', data),
  register: (data)  => api.post('/auth/signup', data),
  logout:   ()      => api.post('/auth/logout'),
  sendOtp:  (email) => api.post(`/auth/send-otp?email=${email}`),
  verifyOtp:(email, otp) => api.post(`/auth/verify-otp?email=${email}&otp=${otp}`),
}

// ── USER ──
export const userAPI = {
  getProfile:    ()     => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  enable2FA:     ()     => api.post('/api/users/enable-two-factor-auth'),
  changePassword:(data) => api.patch('/api/users/change-password', data),
}

// ── COINS / MARKET (FIXED ROUTES) ──
export const coinAPI = {
  getAll:     (page = 1) => api.get(`/api/coins?page=${page}`),
  getById:    (id)       => api.get(`/api/coins/${id}`),
  getTop50:   ()         => api.get('/api/coins/top50'),
  getTrending:()         => api.get('/api/coins/trending'),
  search:     (q)        => api.get(`/api/coins/search?q=${q}`),
  getDetails: (id)       => api.get(`/api/coins/${id}/coin-details`),
  getChart:   (id, days) => api.get(`/api/coins/${id}/chart?days=${days}`),
}

// ── WATCHLIST ──
export const watchlistAPI = {
  get:    ()   => api.get('/api/watchlist'),
  add:    (id) => api.patch(`/api/watchlist/add/coin/${id}`),
  remove: (id) => api.delete(`/api/watchlist/remove/coin/${id}`),
}

// ── WALLET ──
export const walletAPI = {
  getWallet:       ()           => api.get('/api/wallet'),
  getTransactions: ()           => api.get('/api/wallet/transactions'),
  deposit:         (amount, key) => api.put('/api/wallet/deposit', { amount }, { headers: { 'X-Idempotency-Key': key } }),
  withdraw:        (data, key)   => api.post('/api/withdrawal', data, { headers: { 'X-Idempotency-Key': key } }),
  transfer:        (id, amount, key) => api.put(`/api/wallet/${id}/transfer`, { amount }, { headers: { 'X-Idempotency-Key': key } }),
}

// ── ORDERS ──
export const orderAPI = {
  getAll:   ()     => api.get('/api/orders'),
  getById:  (id)   => api.get(`/api/orders/${id}`),
  create:   (data, key) => api.post('/api/orders/pay', data, { headers: { 'X-Idempotency-Key': key } }),
  cancel:   (id)   => api.delete(`/api/orders/${id}`),
}

// ── PAYMENT ──
export const paymentAPI = {
  createOrder: (amount)    => api.post('/api/payment/create-order', { amount }),
  saveDetails: (data)      => api.post('/api/payment/details', data),
  getDetails:  ()          => api.get('/api/payment/details'),
  addMoney:    (orderId, paymentId, amount) =>
    api.put(`/api/wallet/deposit?order_id=${orderId}&payment_id=${paymentId}&amount=${amount}`),
}

// ── ASSETS ──
export const assetAPI = {
  getAll:    ()    => api.get('/api/assets'),
  getById:   (id)  => api.get(`/api/assets/${id}`),
  getCoinAsset: (coinId) => api.get(`/api/assets/coin/${coinId}`),
}

// ── GRAPH / RISK ──
export const graphAPI = {
  getContagion:   (coinId) => api.get(`/api/graph/contagion/${coinId}`),
  getRiskScore:   (coinId) => api.get(`/api/graph/risk-score/${coinId}`),
  getEdges:       ()       => api.get('/api/graph/edges'),
  syncData:       ()       => api.post('/api/graph/sync'),
  getCorrelation: (coinId) => api.get(`/api/graph/correlation/${coinId}`),
}

// ── AUDIT LOG ──
export const auditAPI = {
  getLogs: (page = 0, size = 20) => api.get(`/api/audit?page=${page}&size=${size}`),
  export:  ()                    => api.get('/api/audit/export', { responseType: 'blob' }),
}

// ── WITHDRAWAL ──
export const withdrawalAPI = {
  request:  (data) => api.post('/api/withdrawal', data),
  getAll:   ()     => api.get('/api/withdrawal'),
  getProceed: (id) => api.patch(`/api/withdrawal/${id}/proceed`),
  cancel:   (id)   => api.delete(`/api/withdrawal/${id}`),
}

export default api