import { useState, useEffect } from 'react'
import { getDebts, calcStrategy } from '../utils/api'
import { fmt, fmtMonths } from '../utils/format'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-700 border border-surface-500 rounded-xl p-3 text-xs space-y-1">
      <p className="text-gray-400 mb-1.5">เดือนที่ {label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  )
}

export default function Simulate() {
  const { userId } = useAuth()
  const [debts, setDebts]       = useState([])
  const [result, setResult]     = useState(null)
  const [extra, setExtra]       = useState(0)
  const [strategy, setStrategy] = useState('avalanche')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    getDebts(userId).then(r => setDebts(r.data.data || []))
  }, [userId])

  useEffect(() => {
    if (!debts.length) return
    setLoading(true)
    calcStrategy({ debts, extraPayment: extra }).then(r => setResult(r.data.data)).finally(() => setLoading(false))
  }, [debts, extra])

  const chartData = (() => {
    if (!result) return []
    const timeline = result[strategy]?.timeline || []
    return timeline.map(snap => {
      const row = { month: snap.month }
      snap.debts.forEach(d => { row[d.name] = d.balance })
      row.total = snap.totalRemaining
      return row
    })
  })()

  const debtNames = debts.map(d => d.name)
  const CHART_COLORS = ['#FF6B6B','#FF9F43','#54A0FF','#5F27CD','#0be881','#ffd32a']
  const current = result?.[strategy]

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">จำลองอนาคต</h1>
        <p className="text-gray-400 text-sm mt-0.5">ดูว่าหนี้จะหมดเมื่อไหร่ — และถ้าเพิ่มเงินจะเร็วขึ้นแค่ไหน</p>
      </div>

      <div className="card animate-in delay-100 space-y-4">
        <div>
          <label className="label">กลยุทธ์</label>
          <div className="flex gap-2 mt-1">
            {['snowball','avalanche'].map(s => (
              <button key={s} onClick={() => setStrategy(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${strategy === s ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
                {s === 'snowball' ? '⛄ Snowball' : '🧊 Avalanche'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">เงินพิเศษต่อเดือน: <span className="text-white font-semibold">{fmt(extra)}</span></label>
          <input type="range" min="0" max="15000" step="500" value={extra}
            onChange={e => setExtra(Number(e.target.value))} className="w-full mt-1.5 accent-brand-500"/>
          <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>฿0</span><span>฿15,000</span></div>
        </div>
      </div>

      {current && (
        <div className="grid grid-cols-3 gap-3 animate-in delay-200">
          {[
            { label: 'หมดหนี้ใน',       value: fmtMonths(current.months),    accent: 'text-brand-400' },
            { label: 'ดอกเบี้ยรวม',     value: fmt(current.totalInterestPaid), accent: 'text-yellow-400' },
            { label: 'ประหยัดได้',       value: extra > 0 ? fmt(Math.max(0, (result.avalanche.totalInterestPaid - current.totalInterestPaid))) : '—', accent: 'text-green-400' }
          ].map(({ label, value, accent }) => (
            <div key={label} className="card text-center">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`font-display font-bold text-base mt-1 ${accent}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card animate-in delay-300">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={16} className="text-brand-400"/>
          <p className="font-semibold text-sm">กราฟยอดหนี้รายเดือน</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {debtNames.map((name, i) => (
                  <linearGradient key={name} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e40"/>
              <XAxis dataKey="month" stroke="#555" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={v => `${v}ด`}/>
              <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: '12px', color: '#888' }}/>
              {debtNames.map((name, i) => (
                <Area key={name} type="monotone" dataKey={name} stackId="1"
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={`url(#grad${i})`} strokeWidth={2}/>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-12">ไม่มีข้อมูล — กรุณาเพิ่มหนี้ก่อน</p>
        )}
      </div>

      {current && extra === 0 && (
        <div className="card bg-blue-500/10 border-blue-500/30 animate-in delay-400">
          <p className="text-sm text-blue-300 font-medium mb-1">💡 Insight</p>
          <p className="text-sm text-gray-300">
            ถ้าคุณเพิ่มเงินพิเศษอีกแค่ <span className="text-white font-semibold">฿1,000/เดือน</span>{' '}
            คุณจะปิดหนี้ <span className="text-blue-300 font-semibold">เร็วขึ้นหลายเดือน</span>{' '}
            ลองเลื่อน slider ดูเลย!
          </p>
        </div>
      )}
    </div>
  )
}
