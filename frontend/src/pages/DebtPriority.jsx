import { useState, useEffect } from 'react'
import { getDebts, updateDebt } from '../utils/api'
import { fmt } from '../utils/format'
import { ArrowUp, ArrowDown, Save, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PRIORITY_CONFIG = {
  1: { label: 'สูงมาก',   color: 'text-red-400',    bg: 'bg-red-500/20 border-red-500/40',    dot: 'bg-red-400'    },
  2: { label: 'สูง',       color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40', dot: 'bg-orange-400' },
  3: { label: 'ปานกลาง',  color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40', dot: 'bg-yellow-400' },
  4: { label: 'ต่ำ',       color: 'text-green-400',  bg: 'bg-green-500/20 border-green-500/40',  dot: 'bg-green-400'  },
}

const SCORE_FACTORS = (debt) => {
  let score = 0
  // High interest rate = high priority
  if (debt.interest_rate >= 20)      score += 40
  else if (debt.interest_rate >= 15) score += 30
  else if (debt.interest_rate >= 10) score += 20
  else                               score += 10
  // Small balance = higher priority (snowball logic) — add 10 for small
  if (debt.current_balance < 20000)  score += 15
  else if (debt.current_balance < 50000) score += 8
  // Short term = more urgent
  if (debt.term_type === 'short')    score += 10
  return score
}

export default function DebtPriority() {
  const { userId } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getDebts(userId).then(r => {
      const d = (r.data.data || []).sort((a, b) => (a.priority || 3) - (b.priority || 3))
      setDebts(d)
    }).finally(() => setLoading(false))
  }, [userId])

  const move = (idx, dir) => {
    const arr = [...debts]
    const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setDebts(arr)
  }

  const setPriority = (id, p) => setDebts(prev => prev.map(d => d.id === id ? { ...d, priority: p } : d))

  const autoSort = () => {
    const sorted = [...debts].sort((a, b) => SCORE_FACTORS(b) - SCORE_FACTORS(a))
    sorted.forEach((d, i) => { d.priority = i < 2 ? 1 : i < 4 ? 2 : i < 6 ? 3 : 4 })
    setDebts(sorted)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(debts.map((d, i) => updateDebt(d.id, { priority: d.priority || (i + 1) })))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-5">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">ลำดับความสำคัญหนี้</h1>
        <p className="text-gray-400 text-sm mt-0.5">จัดเรียงและกำหนดลำดับการชำระหนี้</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 animate-in delay-100">
        <button onClick={autoSort} className="btn-ghost flex items-center gap-2 text-sm flex-1">
          🤖 จัดลำดับอัตโนมัติ
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm flex-1">
          {saved ? <><CheckCircle size={15}/> บันทึกแล้ว!</> : saving ? 'กำลังบันทึก...' : <><Save size={15}/> บันทึก</>}
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 animate-in delay-100">
        {Object.entries(PRIORITY_CONFIG).map(([p, cfg]) => (
          <div key={p} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
            P{p} {cfg.label}
          </div>
        ))}
      </div>

      {/* Debt list */}
      <div className="space-y-2 animate-in delay-200">
        {debts.map((d, i) => {
          const pcfg = PRIORITY_CONFIG[d.priority || 3]
          const score = SCORE_FACTORS(d)
          return (
            <div key={d.id} className={`card-hover border ${pcfg.bg}`}>
              <div className="flex items-center gap-3">
                {/* Order number */}
                <div className="w-7 h-7 rounded-lg bg-surface-700 flex items-center justify-center text-sm font-bold text-gray-300 flex-shrink-0">
                  {i + 1}
                </div>
                {/* Color dot */}
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }}/>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{fmt(d.current_balance)}</span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs" style={{ color: d.interest_rate >= 15 ? '#ff3d22' : '#ffd32a' }}>{d.interest_rate}%/ปี</span>
                    {d.interest_rate >= 18 && <AlertTriangle size={11} className="text-red-400"/>}
                  </div>
                </div>
                {/* Priority selector */}
                <div className="flex gap-1 flex-shrink-0">
                  {[1,2,3,4].map(p => (
                    <button key={p} onClick={() => setPriority(d.id, p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${d.priority === p ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color} border` : 'bg-surface-700 text-gray-500 hover:bg-surface-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
                {/* Move buttons */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 hover:bg-surface-700 rounded disabled:opacity-20"><ArrowUp size={13}/></button>
                  <button onClick={() => move(i, 1)} disabled={i === debts.length - 1} className="p-1 hover:bg-surface-700 rounded disabled:opacity-20"><ArrowDown size={13}/></button>
                </div>
              </div>
              {/* Score bar */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16">คะแนน {score}</span>
                <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${pcfg.dot}`} style={{ width: `${Math.min(100, score * 1.5)}%` }}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card bg-blue-500/5 border-blue-500/30 animate-in delay-300">
        <p className="text-sm text-gray-400">
          💡 <span className="text-white">P1 (สูงมาก)</span> = ชำระก่อน เช่น หนี้ดอกเบี้ยสูง หรือมีวันใกล้ครบกำหนด 
          · <span className="text-white">P4 (ต่ำ)</span> = ชำระขั้นต่ำไปก่อน เช่น สินเชื่อบ้าน/รถที่ดอกต่ำ
        </p>
      </div>
    </div>
  )
}
