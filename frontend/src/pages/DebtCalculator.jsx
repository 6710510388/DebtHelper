import { useState } from 'react'
import { fmt, fmtMonths } from '../utils/format'
import { Calculator, RefreshCw } from 'lucide-react'

function calcPayoff(principal, rate, minPayment, extra = 0) {
  if (principal <= 0 || rate < 0) return { months: 0, totalInterest: 0, totalPaid: 0 }
  let balance = principal
  const monthly = rate / 100 / 12
  let totalInterest = 0
  let months = 0
  const MAX = 600
  while (balance > 0.01 && months < MAX) {
    const interest = balance * monthly
    totalInterest += interest
    balance = balance + interest - Math.min(minPayment + extra, balance + interest)
    months++
  }
  return { months, totalInterest: Math.round(totalInterest), totalPaid: Math.round(principal + totalInterest) }
}

export default function DebtCalculator() {
  const [form, setForm] = useState({ principal: 50000, rate: 18, minPayment: 1000, extra: 0 })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const base   = calcPayoff(form.principal, form.rate, form.minPayment, 0)
  const withEx = form.extra > 0 ? calcPayoff(form.principal, form.rate, form.minPayment, form.extra) : null

  const monthsSaved  = withEx ? base.months - withEx.months : 0
  const interestSaved = withEx ? base.totalInterest - withEx.totalInterest : 0

  const reset = () => setForm({ principal: 50000, rate: 18, minPayment: 1000, extra: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">คำนวณการปิดหนี้</h1>
          <p className="text-gray-400 text-sm mt-0.5">ดูว่าต้องใช้เวลานานแค่ไหนในการปิดหนี้</p>
        </div>
        <button onClick={reset} className="btn-ghost flex items-center gap-2 text-sm"><RefreshCw size={14}/> รีเซ็ต</button>
      </div>

      {/* Inputs */}
      <div className="card animate-in delay-100 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calculator size={16} className="text-brand-400"/>
          <p className="font-semibold text-sm">ข้อมูลหนี้</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ยอดหนี้ปัจจุบัน (฿)</label>
            <input className="input" type="number" value={form.principal}
              onChange={e => set('principal', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">ดอกเบี้ย (% ต่อปี)</label>
            <input className="input" type="number" step="0.1" value={form.rate}
              onChange={e => set('rate', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">ชำระขั้นต่ำ/เดือน (฿)</label>
            <input className="input" type="number" value={form.minPayment}
              onChange={e => set('minPayment', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <label className="label">เงินพิเศษ/เดือน (฿)</label>
            <input className="input" type="number" value={form.extra}
              onChange={e => set('extra', parseFloat(e.target.value) || 0)} />
          </div>
        </div>

        {/* Extra slider */}
        <div>
          <label className="label">เงินพิเศษ: <span className="text-white font-semibold">{fmt(form.extra)}</span></label>
          <input type="range" min="0" max="20000" step="500" value={form.extra}
            onChange={e => set('extra', Number(e.target.value))}
            className="w-full accent-brand-500"/>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>฿0</span><span>฿20,000</span></div>
        </div>
      </div>

      {/* Results */}
      <div className="grid lg:grid-cols-2 gap-4 animate-in delay-200">
        {/* Base result */}
        <div className="card border-surface-600">
          <p className="font-semibold text-sm text-gray-300 mb-3">💳 ชำระขั้นต่ำเพียงอย่างเดียว</p>
          <div className="space-y-3">
            <div className="bg-surface-700 rounded-xl p-3">
              <p className="text-xs text-gray-400">ระยะเวลาปิดหนี้</p>
              <p className="font-display font-bold text-2xl text-brand-400 mt-0.5">{fmtMonths(base.months)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">ดอกเบี้ยรวม</p>
                <p className="font-display font-bold text-base text-red-400">{fmt(base.totalInterest)}</p>
              </div>
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">จ่ายรวมทั้งหมด</p>
                <p className="font-display font-bold text-base text-white">{fmt(base.totalPaid)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* With extra */}
        {withEx ? (
          <div className="card border-green-500/40 bg-green-500/5">
            <p className="font-semibold text-sm text-green-300 mb-3">⚡ เพิ่มเงินพิเศษ {fmt(form.extra)}/เดือน</p>
            <div className="space-y-3">
              <div className="bg-surface-700 rounded-xl p-3">
                <p className="text-xs text-gray-400">ระยะเวลาปิดหนี้</p>
                <p className="font-display font-bold text-2xl text-green-400 mt-0.5">{fmtMonths(withEx.months)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400">ดอกเบี้ยรวม</p>
                  <p className="font-display font-bold text-base text-green-400">{fmt(withEx.totalInterest)}</p>
                </div>
                <div className="bg-surface-700 rounded-xl p-3">
                  <p className="text-xs text-gray-400">จ่ายรวมทั้งหมด</p>
                  <p className="font-display font-bold text-base text-white">{fmt(withEx.totalPaid)}</p>
                </div>
              </div>
            </div>
            {/* Savings highlight */}
            <div className="mt-3 p-3 bg-green-500/20 rounded-xl border border-green-500/30">
              <p className="text-sm text-green-300 font-semibold">🎉 คุณประหยัดได้</p>
              <div className="flex gap-4 mt-1">
                <div>
                  <p className="text-xs text-gray-400">เวลา</p>
                  <p className="text-green-400 font-bold">{fmtMonths(monthsSaved)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">ดอกเบี้ย</p>
                  <p className="text-green-400 font-bold">{fmt(interestSaved)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card flex flex-col items-center justify-center text-center text-gray-500 gap-3 min-h-[200px]">
            <Calculator size={32} className="opacity-30"/>
            <p className="text-sm">เลื่อน slider เพื่อดูผลลัพธ์<br/>เมื่อเพิ่มเงินพิเศษ</p>
          </div>
        )}
      </div>

      {/* Amortization tips */}
      <div className="card animate-in delay-300 bg-blue-500/5 border-blue-500/30">
        <p className="font-semibold text-sm text-blue-300 mb-2">💡 เคล็ดลับ</p>
        <ul className="text-sm text-gray-400 space-y-1.5">
          <li>• การเพิ่มเงินพิเศษแม้เพียง <span className="text-white">฿500/เดือน</span> สามารถลดดอกเบี้ยได้หลายหมื่นบาท</li>
          <li>• ชำระขั้นต่ำน้อยที่สุดเท่าที่ธนาคารกำหนด ส่วนใหญ่คือ <span className="text-white">5-10%</span> ของยอดคงค้าง</li>
          <li>• บัตรเครดิตดอกเบี้ย 18-20% ต่อปี ควรปิดก่อนหนี้อื่น</li>
          <li>• ลองใช้กลยุทธ์ <span className="text-white">Avalanche</span> เพื่อประหยัดดอกเบี้ยสูงสุด</li>
        </ul>
      </div>
    </div>
  )
}
