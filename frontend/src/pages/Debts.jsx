import { useState, useEffect } from 'react'
import { getDebts, createDebt, updateDebt, deleteDebt, createPayment } from '../utils/api'
import { fmt, debtTypeLabel, riskColor } from '../utils/format'
import { Plus, Trash2, CreditCard, ChevronDown, ChevronUp, X, CheckCircle, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const COLORS = ['#FF6B6B','#FF9F43','#54A0FF','#5F27CD','#0be881','#ffd32a','#ff6b81','#1dd1a1']
const DEBT_TYPES = Object.entries(debtTypeLabel)

function DebtCard({ debt, onPay, onDelete }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const pct = debt.principal > 0
    ? Math.round(((debt.principal - debt.current_balance) / debt.principal) * 100)
    : 0

  const handlePay = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setPaying(true)
    try {
      await onPay(debt.id, parseFloat(amount))
      setPaid(true)
      setAmount('')
      setTimeout(() => { setPaid(false); setOpen(false) }, 1500)
    } finally { setPaying(false) }
  }

  return (
    <div className="card-hover">
      <div className="flex items-start gap-3">
        <div className="w-3 h-12 rounded-full flex-shrink-0 mt-0.5" style={{ background: debt.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold truncate">{debt.name}</p>
              <p className="text-xs text-gray-500">{debtTypeLabel[debt.type]} · {debt.creditor}</p>
              {debt.due_day && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={10}/> ครบกำหนดวันที่ {debt.due_day} ของเดือน
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-display font-bold text-lg text-white">{fmt(debt.current_balance)}</p>
              <p className="text-xs" style={{ color: riskColor(debt.interest_rate) }}>
                {debt.interest_rate}% ต่อปี
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-surface-600 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: debt.color }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">ชำระแล้ว {pct}%</span>
            <span className="text-xs text-gray-500">ขั้นต่ำ {fmt(debt.min_payment)}/เดือน</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-700">
        <button onClick={() => setOpen(!open)}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-2 text-sm">
          {paid ? <><CheckCircle size={15}/> บันทึกแล้ว!</> : <><Plus size={15}/> บันทึกการชำระ</>}
        </button>
        <button onClick={() => onDelete(debt.id)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-700 hover:bg-red-500/20 hover:text-red-400 transition-colors">
          <Trash2 size={15} />
        </button>
        <button onClick={() => setOpen(!open)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-700 hover:bg-surface-600 transition-colors">
          {open ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
      </div>

      {open && (
        <div className="mt-3 p-3 bg-surface-700 rounded-xl space-y-2 animate-in">
          <p className="text-xs text-gray-400">จำนวนที่ชำระ</p>
          <div className="flex gap-2">
            <input type="number" className="input" placeholder={`ขั้นต่ำ ${fmt(debt.min_payment)}`}
              value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePay()} />
            <button onClick={handlePay} disabled={paying || !amount} className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
              {paying ? '...' : 'บันทึก'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[debt.min_payment, debt.min_payment * 1.5, debt.min_payment * 2].map(v => (
              <button key={v} onClick={() => setAmount(String(Math.round(v)))}
                className="text-xs px-2.5 py-1 bg-surface-600 hover:bg-surface-500 rounded-lg transition-colors">
                {fmt(Math.round(v))}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AddDebtModal({ onClose, onAdded, userId }) {
  const [form, setForm] = useState({
    name: '', type: 'credit_card', term_type: 'short', creditor: '',
    current_balance: '', interest_rate: '', min_payment: '',
    due_day: '', term_months: '', color: COLORS[0], notes: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.current_balance || !form.interest_rate) return
    setSaving(true)
    try {
      await createDebt({
        ...form, userId,
        current_balance: parseFloat(form.current_balance),
        interest_rate:   parseFloat(form.interest_rate),
        min_payment:     parseFloat(form.min_payment) || 0,
        due_day:         parseInt(form.due_day)  || null,
        term_months:     parseInt(form.term_months) || null,
        principal:       parseFloat(form.current_balance)
      })
      onAdded(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">เพิ่มหนี้ใหม่</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg"><X size={18}/></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="label">ชื่อหนี้ *</label>
            <input className="input" placeholder="เช่น บัตรเครดิต KBank" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ประเภท</label>
              <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                {DEBT_TYPES.map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="label">ระยะ</label>
              <select className="input" value={form.term_type} onChange={e => set('term_type', e.target.value)}>
                <option value="short">ระยะสั้น (&lt;1 ปี)</option>
                <option value="long">ระยะยาว (≥1 ปี)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">เจ้าหนี้</label>
            <input className="input" placeholder="ธนาคาร / บริษัท" value={form.creditor} onChange={e => set('creditor', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ยอดหนี้ปัจจุบัน (฿) *</label>
              <input className="input" type="number" placeholder="50000" value={form.current_balance} onChange={e => set('current_balance', e.target.value)} />
            </div>
            <div>
              <label className="label">ดอกเบี้ย (% ต่อปี) *</label>
              <input className="input" type="number" step="0.1" placeholder="18.0" value={form.interest_rate} onChange={e => set('interest_rate', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ชำระขั้นต่ำ/เดือน (฿)</label>
              <input className="input" type="number" placeholder="1000" value={form.min_payment} onChange={e => set('min_payment', e.target.value)} />
            </div>
            <div>
              <label className="label">วันครบกำหนด</label>
              <input className="input" type="number" min="1" max="31" placeholder="25" value={form.due_day} onChange={e => set('due_day', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">จำนวนงวด (เดือน)</label>
            <input className="input" type="number" placeholder="36" value={form.term_months} onChange={e => set('term_months', e.target.value)} />
          </div>
          <div>
            <label className="label">หมายเหตุ</label>
            <input className="input" placeholder="รายละเอียดเพิ่มเติม" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div>
            <label className="label">สี</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-surface-800' : 'hover:scale-110'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
            {saving ? 'กำลังบันทึก...' : '+ เพิ่มหนี้'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Debts() {
  const { userId } = useAuth()
  const [debts, setDebts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterType, setFilterType] = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const res = await getDebts(userId)
      setDebts(res.data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [userId])

  const handlePay = async (debtId, amount) => {
    await createPayment({ debtId, userId, amount, paid_date: new Date().toISOString().split('T')[0] })
    await load()
  }

  const handleDelete = async (id) => {
    if (!confirm('ต้องการลบหนี้นี้?')) return
    await deleteDebt(id)
    setDebts(d => d.filter(x => x.id !== id))
  }

  const filtered = filterType === 'all' ? debts
    : filterType === 'short' ? debts.filter(d => d.term_type === 'short' || (!d.term_type && ['credit_card','other'].includes(d.type)))
    : debts.filter(d => d.term_type === 'long' || (!d.term_type && ['car','house','personal_loan'].includes(d.type)))

  const total = filtered.reduce((s, d) => s + d.current_balance, 0)

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">หนี้ของฉัน</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            รวม <span className="text-brand-400 font-semibold">{fmt(total)}</span> · {filtered.length} รายการ
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16}/> เพิ่มหนี้
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 animate-in delay-100">
        {[['all','ทั้งหมด'],['short','ระยะสั้น'],['long','ระยะยาว']].map(([v, l]) => (
          <button key={v} onClick={() => setFilterType(v)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filterType === v ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 animate-in">
          <CreditCard size={48} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">ยังไม่มีหนี้ในระบบ</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 text-sm">+ เพิ่มหนี้แรก</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d, i) => (
            <div key={d.id} className="animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <DebtCard debt={d} onPay={handlePay} onDelete={handleDelete}/>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddDebtModal onClose={() => setShowAdd(false)} onAdded={load} userId={userId}/>}
    </div>
  )
}
