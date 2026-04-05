import { useState, useEffect } from 'react'
import { getDebts } from '../utils/api'
import { fmt } from '../utils/format'
import { Calendar, Bell, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function getDaysUntilDue(dueDay) {
  if (!dueDay) return null
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay)
  const target = thisMonth > now ? thisMonth : nextMonth
  return Math.ceil((target - now) / 86400000)
}

function getMonthlySchedule(debts, months = 6) {
  const now = new Date()
  const schedule = []
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const label = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
    const payments = debts
      .filter(debt => debt.status === 'active')
      .map(debt => ({
        ...debt,
        due_date: debt.due_day ? `${String(debt.due_day).padStart(2,'0')} ${d.toLocaleDateString('th-TH',{month:'short'})}` : '-'
      }))
    const total = payments.reduce((s, p) => s + p.min_payment, 0)
    schedule.push({ label, payments, total })
  }
  return schedule
}

export default function PaymentSchedule() {
  const { userId } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('upcoming') // 'upcoming' | 'schedule'

  useEffect(() => {
    getDebts(userId).then(r => setDebts(r.data.data || [])).finally(() => setLoading(false))
  }, [userId])

  const schedule = getMonthlySchedule(debts, 6)
  const upcomingDebts = debts
    .filter(d => d.due_day && d.status === 'active')
    .map(d => ({ ...d, daysLeft: getDaysUntilDue(d.due_day) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const totalMonthly = debts.filter(d => d.status === 'active').reduce((s, d) => s + d.min_payment, 0)

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-5">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">ตารางชำระหนี้</h1>
        <p className="text-gray-400 text-sm mt-0.5">วันครบกำหนดและแผนการชำระ 6 เดือน</p>
      </div>

      {/* Total monthly */}
      <div className="card animate-in delay-100 bg-gradient-to-r from-brand-500/10 to-orange-500/10 border-brand-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="label">ยอดชำระขั้นต่ำรวมต่อเดือน</p>
            <p className="font-display font-bold text-3xl text-brand-400">{fmt(totalMonthly)}</p>
          </div>
          <Calendar size={32} className="text-brand-400 opacity-60"/>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 animate-in delay-100">
        {[['upcoming','🔔 ใกล้ครบกำหนด'],['schedule','📅 ตาราง 6 เดือน']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${view === v ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {view === 'upcoming' && (
        <div className="space-y-3 animate-in delay-200">
          {upcomingDebts.length === 0 ? (
            <div className="card text-center py-10">
              <Bell size={32} className="text-gray-600 mx-auto mb-3"/>
              <p className="text-gray-400">ไม่มีหนี้ที่กำหนดวันครบกำหนด</p>
              <p className="text-gray-500 text-sm mt-1">ตั้งค่าวันครบกำหนดในหน้า "หนี้ของฉัน"</p>
            </div>
          ) : upcomingDebts.map(d => {
            const urgent = d.daysLeft <= 3
            const soon   = d.daysLeft <= 7
            return (
              <div key={d.id} className={`card-hover flex items-center gap-4 ${urgent ? 'border-red-500/40' : soon ? 'border-orange-500/30' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center ${urgent ? 'bg-red-500/20' : soon ? 'bg-orange-500/20' : 'bg-surface-700'}`}>
                  <span className={`font-display font-bold text-lg leading-tight ${urgent ? 'text-red-400' : soon ? 'text-orange-400' : 'text-white'}`}>{d.due_day}</span>
                  <span className="text-xs text-gray-500">วัน</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{d.name}</p>
                    {urgent && <AlertTriangle size={14} className="text-red-400 flex-shrink-0"/>}
                  </div>
                  <p className="text-xs text-gray-400">{d.creditor}</p>
                  <p className={`text-xs mt-0.5 font-medium ${urgent ? 'text-red-400' : soon ? 'text-orange-400' : 'text-gray-500'}`}>
                    {d.daysLeft === 0 ? '🚨 ครบกำหนดวันนี้!'
                     : d.daysLeft < 0 ? `⚠️ เกินกำหนด ${Math.abs(d.daysLeft)} วัน`
                     : `อีก ${d.daysLeft} วัน`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-base text-white">{fmt(d.min_payment)}</p>
                  <p className="text-xs text-gray-500">/เดือน</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'schedule' && (
        <div className="space-y-4 animate-in delay-200">
          {schedule.map((month, mi) => (
            <div key={mi} className="card">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-sm text-gray-200">📅 {month.label}</p>
                <p className="font-display font-bold text-brand-400">{fmt(month.total)}</p>
              </div>
              <div className="space-y-0">
                {month.payments.map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-surface-700 last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">วันที่ {p.due_date}</p>
                    </div>
                    <p className="text-sm font-medium text-white flex-shrink-0">{fmt(p.min_payment)}</p>
                    {mi === 0 && <CheckCircle size={13} className="text-gray-600 flex-shrink-0"/>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
