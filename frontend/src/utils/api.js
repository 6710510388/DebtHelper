import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE || '/api'

const api = axios.create({ baseURL: BASE })

// Auth
export const authLogin    = (data)               => api.post('/auth?action=login', data)
export const authRegister = (data)               => api.post('/auth?action=register', data)

// Dashboard
export const getDashboard  = (userId = 1)        => api.get(`/dashboard?userId=${userId}`)

// Debts
export const getDebts      = (userId = 1)        => api.get(`/debts?userId=${userId}`)
export const createDebt    = (data)              => api.post('/debts', data)
export const updateDebt    = (id, data)          => api.put(`/debts?id=${id}`, data)
export const deleteDebt    = (id)                => api.delete(`/debts?id=${id}`)

// Payments
export const getPayments   = (userId, debtId)    => api.get(`/payments?userId=${userId}${debtId ? `&debtId=${debtId}` : ''}`)
export const createPayment = (data)              => api.post('/payments', data)

// Strategy
export const calcStrategy  = (data)              => api.post('/strategy', data)

// Transactions (รายรับ-รายจ่าย)
export const getTransactions   = (userId, month) => api.get(`/transactions?userId=${userId}${month ? `&month=${month}` : ''}`)
export const createTransaction = (data)          => api.post('/transactions', data)
export const deleteTransaction = (id)            => api.delete(`/transactions?id=${id}`)

// Assets (สินทรัพย์)
export const getAssets    = (userId = 1)         => api.get(`/assets?userId=${userId}`)
export const createAsset  = (data)               => api.post('/assets', data)
export const updateAsset  = (id, data)           => api.put(`/assets?id=${id}`, data)
export const deleteAsset  = (id)                 => api.delete(`/assets?id=${id}`)

// Goals (เป้าหมาย)
export const getGoals     = (userId = 1)         => api.get(`/goals?userId=${userId}`)
export const createGoal   = (data)               => api.post('/goals', data)
export const updateGoal   = (id, data)           => api.put(`/goals?id=${id}`, data)
export const deleteGoal   = (id)                 => api.delete(`/goals?id=${id}`)

// Alerts
export const getAlerts    = (userId = 1)         => api.get(`/alerts?userId=${userId}`)
export const markAlertRead = (id)                => api.put(`/alerts?id=${id}`, { is_read: 1 })
export const markAllAlertsRead = (userId)        => api.put(`/alerts?action=readAll&userId=${userId}`, {})
