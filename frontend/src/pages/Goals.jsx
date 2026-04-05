import { useState, useEffect } from 'react'
import { getGoals, getDebts, createGoal, updateGoal, deleteGoal } from '../utils/api'
import { fmt } from '../utils/format'
import { Plus, Trash2, Edit2, X, Target, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ICONS = ['🎯','🏆','🛡️','📉','💪','🚀','💰','🏠','🚗','🎓']

function GoalModal({ goal, debts, onClose, onSaved }) {
  const { userId } = useAuth()
  const [form, setForm] = useState(goal || { title: '', target_amount: '', current_amount: '', target_date: '', debt_id: '', icon: '🎯' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.title || !form.target_amount) return
    setSaving(true)
    try {
      const data = { ...form, userId, target_amount: parseFloat(form.target_amount), current_amount: parseFloat(form.current_amount) || 0, debt_id: form.debt_id || null }
      if (goal?.id) await updateGoal(goal.id, data)
      else await createGoal(data)
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">{goal ? 'แก้ไขเป้าหมาย' : 'เพิ่มเป้าหมาย'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">ไอคอน</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${form.icon === ic ? 'bg-brand-500 scale-110' : 'bg-surface-700 hover:bg-surface-600'}`}>{ic}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">ชื่อเป้าหมาย *</label>
            <input className="input" placeholder="เช่น ปิดบัตรเครดิต KBank" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">เป้าหมาย (฿) *</label>
              <input className="input" type="number" placeholder="50000" value={form.target_amount} onChange={e => set('target_amount', e.target.value)} />
            </div>
            <div>
              <label className="label">ความคืบหน้า (฿)</label>
              <input className="input" type="number" placeholder="0" value={form.current_amount} onChange={e => set('current_amount', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">วันที่เป้าหมาย</label>
              <input className="input" type="date" value={form.target_date || ''} onChange={e => set('target_date', e.target.value)} />
            </div>
            <div>
              <label className="label">ผูกกับหนี้</label>
              <select className="input" value={form.debt_id || ''} onChange={e => set('debt_id', e.target.value)}>
                <option value="">ไม่ผูก</option>
                {debts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">{saving ? 'กำลังบันทึก...' : goal ? '✏️ บันทึก' : '+ เพิ่ม'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Goals() {
  const { userId } = useAuth()
  const [goals, setGoals] = useState([])
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [gr, dr] = await Promise.all([getGoals(userId), getDebts(userId)])
      setGoals(gr.data.data || [])
      setDebts(dr.data.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [userId])

  const handleDelete = async (id) => {
    if (!confirm('ลบเป้าหมายนี้?')) return
    await deleteGoal(id)
    setGoals(g => g.filter(x => x.id !== id))
  }

  const active = goals.filter(g => g.status === 'active')
  const achieved = goals.filter(g => g.status === 'achieved')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">เป้าหมาย</h1>
          <p className="text-gray-400 text-sm mt-0.5">{active.length} กำลังดำเนินการ · {achieved.length} สำเร็จแล้ว</p>
        </div>
        <button onClick={() => { setEditGoal(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/> เพิ่ม</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : goals.length === 0 ? (
        <div className="card text-center py-12">
          <Target size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">ยังไม่มีเป้าหมาย — ตั้งเป้าหมายแรกได้เลย!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">+ ตั้งเป้าหมาย</button>
        </div>
      ) : (
        <div className="space-y-3 animate-in delay-100">
          {active.map(g => {
            const pct = g.target_amount > 0 ? Math.min(100, Math.round(g.current_amount / g.target_amount * 100)) : 0
            const daysLeft = g.target_date ? Math.ceil((new Date(g.target_date) - new Date()) / 86400000) : null
            return (
              <div key={g.id} className="card-hover">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{g.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{g.title}</p>
                        {g.debt_name && <p className="text-xs text-gray-500">ผูกกับ: {g.debt_name}</p>}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => { setEditGoal(g); setShowModal(true) }} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-brand-400"><Edit2 size={13}/></button>
                        <button onClick={() => handleDelete(g.id)} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-red-400"><Trash2 size={13}/></button>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-surface-600 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-orange-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">{fmt(g.current_amount)} / {fmt(g.target_amount)} ({pct}%)</span>
                      {daysLeft !== null && (
                        <span className={`text-xs ${daysLeft < 30 ? 'text-red-400' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? `เหลือ ${daysLeft} วัน` : 'เกินกำหนด'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {achieved.length > 0 && (
            <>
              <p className="text-sm text-green-400 font-medium mt-4 flex items-center gap-2"><CheckCircle size={14}/> สำเร็จแล้ว</p>
              {achieved.map(g => (
                <div key={g.id} className="card opacity-60 flex items-center gap-3">
                  <span className="text-2xl">{g.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold line-through text-gray-400">{g.title}</p>
                    <p className="text-xs text-green-400">✅ {fmt(g.target_amount)}</p>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-red-400"><Trash2 size={13}/></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {showModal && <GoalModal goal={editGoal} debts={debts} onClose={() => setShowModal(false)} onSaved={load}/>}
    </div>
  )
}
