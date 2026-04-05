import { useState, useEffect } from 'react'
import { getTransactions, createTransaction, deleteTransaction } from '../utils/api'
import { fmt } from '../utils/format'
import { Plus, Trash2, TrendingUp, TrendingDown, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const INCOME_CATS  = ['salary','freelance','bonus','interest','other']
const EXPENSE_CATS = ['food','transport','utilities','entertainment','healthcare','education','debt','shopping','other']
const CAT_LABEL = {
  salary:'เงินเดือน', freelance:'ฟรีแลนซ์', bonus:'โบนัส', interest:'ดอกเบี้ย',
  food:'อาหาร', transport:'เดินทาง', utilities:'สาธารณูปโภค', entertainment:'บันเทิง',
  healthcare:'สุขภาพ', education:'การศึกษา', debt:'จ่ายหนี้', shopping:'ช้อปปิ้ง',
  other:'อื่นๆ'
}

function AddModal({ onClose, onAdded }) {
  const { userId } = useAuth()
  const [form, setForm] = useState({ type: 'expense', category: 'food', amount: '', date: new Date().toISOString().split('T')[0], note: '', is_recurring: false })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  const handleSubmit = async () => {
    if (!form.amount || !form.date) return
    setSaving(true)
    try {
      await createTransaction({ ...form, userId, amount: parseFloat(form.amount) })
      onAdded(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">บันทึกรายการ</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg"><X size={18}/></button>
        </div>
        <div className="flex gap-2">
          {['expense','income'].map(t => (
            <button key={t} onClick={() => { set('type', t); set('category', t === 'income' ? 'salary' : 'food') }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${form.type === t ? (t === 'income' ? 'bg-green-500 text-white' : 'bg-brand-500 text-white') : 'bg-surface-700 text-gray-400'}`}>
              {t === 'income' ? '💰 รายรับ' : '💸 รายจ่าย'}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">หมวดหมู่</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              {cats.map(c => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">จำนวน (฿) *</label>
              <input className="input" type="number" placeholder="0" value={form.amount} onChange={e => set('amount', e.target.value)} />
            </div>
            <div>
              <label className="label">วันที่ *</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">หมายเหตุ</label>
            <input className="input" placeholder="รายละเอียด..." value={form.note} onChange={e => set('note', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} className="w-4 h-4 rounded accent-brand-500"/>
            <span className="text-sm text-gray-300">รายการประจำ (ทำซ้ำทุกเดือน)</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">{saving ? 'กำลังบันทึก...' : '+ บันทึก'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Transactions() {
  const { userId } = useAuth()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 })
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await getTransactions(userId, month)
      const d = r.data.data
      setRows(d.transactions || [])
      setSummary(d.summary || { income: 0, expense: 0, net: 0 })
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId, month])

  const handleDelete = async (id) => {
    if (!confirm('ลบรายการนี้?')) return
    await deleteTransaction(id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">รายรับ-รายจ่าย</h1>
          <p className="text-gray-400 text-sm mt-0.5">ติดตามกระแสเงินสดของคุณ</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/> เพิ่ม</button>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-3 animate-in delay-100">
        <label className="label mb-0">เดือน:</label>
        <input type="month" className="input w-auto" value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 animate-in delay-100">
        <div className="card text-center">
          <p className="label text-center">รายรับ</p>
          <p className="font-display font-bold text-lg text-green-400">{fmt(summary.income)}</p>
        </div>
        <div className="card text-center">
          <p className="label text-center">รายจ่าย</p>
          <p className="font-display font-bold text-lg text-red-400">{fmt(summary.expense)}</p>
        </div>
        <div className="card text-center">
          <p className="label text-center">คงเหลือ</p>
          <p className={`font-display font-bold text-lg ${summary.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmt(summary.net)}</p>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card animate-in delay-200 space-y-0">
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : rows.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">ไม่มีรายการในเดือนนี้</p>
        ) : rows.map(r => (
          <div key={r.id} className="flex items-center gap-3 py-3 border-b border-surface-700 last:border-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${r.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {r.type === 'income' ? <TrendingUp size={14} className="text-green-400"/> : <TrendingDown size={14} className="text-red-400"/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{CAT_LABEL[r.category] || r.category}</p>
              <p className="text-xs text-gray-500">{r.date}{r.note ? ` · ${r.note}` : ''}{r.is_recurring ? ' 🔄' : ''}</p>
            </div>
            <p className={`font-display font-bold text-sm flex-shrink-0 ${r.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
              {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
            </p>
            <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-red-400 flex-shrink-0">
              <Trash2 size={14}/>
            </button>
          </div>
        ))}
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={load}/>}
    </div>
  )
}
