import { useState, useEffect } from 'react'
import { getDebts } from '../utils/api'
import { fmt, fmtMonths } from '../utils/format'
import { GitMerge, Info } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function calcPayoff(principal, rate, payment) {
  if (principal <= 0 || payment <= 0) return { months: 999, totalInterest: 0 }
  let balance = principal
  const monthly = rate / 100 / 12
  let totalInterest = 0
  let months = 0
  while (balance > 0.01 && months < 600) {
    const interest = balance * monthly
    totalInterest += interest
    balance = balance + interest - Math.min(payment, balance + interest)
    months++
  }
  return { months, totalInterest: Math.round(totalInterest) }
}

export default function DebtConsolidate() {
  const { userId } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newRate, setNewRate] = useState(8)
  const [selected, setSelected] = useState([])

  useEffect(() => {
    getDebts(userId).then(r => {
      const d = r.data.data || []
      setDebts(d)
      setSelected(d.map(x => x.id))
    }).finally(() => setLoading(false))
  }, [userId])

  const toggleDebt = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const selectedDebts = debts.filter(d => selected.includes(d.id))
  const totalBalance  = selectedDebts.reduce((s, d) => s + d.current_balance, 0)
  const totalMin      = selectedDebts.reduce((s, d) => s + d.min_payment, 0)
  const avgRate       = selectedDebts.length
    ? selectedDebts.reduce((s, d) => s + d.interest_rate * d.current_balance, 0) / totalBalance
    : 0

  // Current state: sum of each debt
  const currentTotal = selectedDebts.reduce((s, d) => {
    const r = calcPayoff(d.current_balance, d.interest_rate, d.min_payment)
    return s + d.current_balance + r.totalInterest
  }, 0)

  // Consolidated
  const consolidated = calcPayoff(totalBalance, newRate, totalMin)
  const consolidatedTotal = totalBalance + consolidated.totalInterest

  const saving = currentTotal - consolidatedTotal
  const isWorthIt = newRate < avgRate

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">คำนวณรวมหนี้</h1>
        <p className="text-gray-400 text-sm mt-0.5">เปรียบเทียบดอกเบี้ยก่อน-หลังรวมหนี้</p>
      </div>

      {/* Select debts */}
      <div className="card animate-in delay-100">
        <p className="font-semibold text-sm text-gray-200 mb-3">เลือกหนี้ที่ต้องการรวม</p>
        <div className="space-y-2">
          {debts.map(d => (
            <label key={d.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selected.includes(d.id) ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-surface-700 hover:bg-surface-600'}`}>
              <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleDebt(d.id)} className="w-4 h-4 accent-brand-500 flex-shrink-0"/>
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-xs text-gray-400">{d.interest_rate}% ต่อปี · ขั้นต่ำ {fmt(d.min_payment)}</p>
              </div>
              <p className="font-display font-bold text-sm text-white flex-shrink-0">{fmt(d.current_balance)}</p>
            </label>
          ))}
        </div>
      </div>

      {/* New rate */}
      <div className="card animate-in delay-200">
        <p className="font-semibold text-sm text-gray-200 mb-3">อัตราดอกเบี้ยใหม่หลังรวมหนี้</p>
        <div className="flex items-center gap-4">
          <input type="range" min="1" max="30" step="0.5" value={newRate}
            onChange={e => setNewRate(parseFloat(e.target.value))}
            className="flex-1 accent-brand-500"/>
          <div className="w-28">
            <input type="number" step="0.1" className="input text-center py-2"
              value={newRate} onChange={e => setNewRate(parseFloat(e.target.value) || 0)}/>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">อัตราดอกเบี้ยเฉลี่ยปัจจุบัน: <span className="text-yellow-400 font-semibold">{avgRate.toFixed(1)}%</span></p>
      </div>

      {/* Result */}
      {selectedDebts.length > 0 && (
        <div className="space-y-4 animate-in delay-300">
          {/* Summary */}
          <div className={`card border-2 ${isWorthIt ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
            <div className="flex items-start gap-3">
              <GitMerge size={20} className={isWorthIt ? 'text-green-400' : 'text-red-400'} />
              <div>
                <p className={`font-semibold ${isWorthIt ? 'text-green-300' : 'text-red-300'}`}>
                  {isWorthIt ? '✅ แนะนำให้รวมหนี้' : '⚠️ ไม่แนะนำ — อัตราใหม่สูงกว่าเดิม'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isWorthIt
                    ? `ลดอัตราดอกเบี้ยจาก ${avgRate.toFixed(1)}% → ${newRate}% ประหยัดได้ ${fmt(Math.max(0, saving))}`
                    : `อัตราใหม่ ${newRate}% สูงกว่าเฉลี่ย ${avgRate.toFixed(1)}% ไม่คุ้มค่า`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <div className="card">
              <p className="font-semibold text-sm text-gray-300 mb-3">📋 ก่อนรวมหนี้</p>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ยอดหนี้รวม</span><span className="font-bold">{fmt(totalBalance)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ดอกเบี้ยเฉลี่ย</span><span className="text-red-400 font-bold">{avgRate.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ดอกเบี้ยรวมตลอดหนี้</span><span className="text-red-400 font-bold">{fmt(currentTotal - totalBalance)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">จ่ายทั้งหมด</span><span className="font-bold">{fmt(currentTotal)}</span></div>
              </div>
            </div>

            <div className="card">
              <p className="font-semibold text-sm text-green-300 mb-3">🔀 หลังรวมหนี้</p>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ยอดหนี้รวม</span><span className="font-bold">{fmt(totalBalance)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">อัตราดอกเบี้ยใหม่</span><span className={`font-bold ${isWorthIt ? 'text-green-400' : 'text-red-400'}`}>{newRate}%</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ดอกเบี้ยรวมตลอดหนี้</span><span className={`font-bold ${isWorthIt ? 'text-green-400' : 'text-red-400'}`}>{fmt(consolidated.totalInterest)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400 text-sm">ระยะเวลาปิดหนี้</span><span className="font-bold">{fmtMonths(consolidated.months)}</span></div>
              </div>
            </div>
          </div>

          <div className="card bg-blue-500/5 border-blue-500/30 animate-in delay-400">
            <div className="flex items-start gap-2">
              <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-gray-400">
                การรวมหนี้ควรทำเมื่ออัตราดอกเบี้ยใหม่<span className="text-white">ต่ำกว่าเฉลี่ยเดิมอย่างน้อย 2-3%</span> 
                และควรตรวจสอบค่าธรรมเนียมการรีไฟแนนซ์ด้วย
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
