import { useState, useEffect } from 'react'
import { getDebts, calcStrategy } from '../utils/api'
import { fmt, fmtMonths } from '../utils/format'
import { TrendingDown, Zap, Info, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function StrategyCard({ type, result, isRecommended, onSelect, selected }) {
  const isSnowball = type === 'snowball'
  const color = isSnowball ? '#54a0ff' : '#ff6b55'
  const icon  = isSnowball ? '⛄' : '🧊'
  const title = isSnowball ? 'Snowball' : 'Avalanche'
  const desc  = isSnowball
    ? 'ปิดหนี้ที่ยอดน้อยสุดก่อน — สร้าง Momentum!'
    : 'ปิดหนี้ดอกสูงสุดก่อน — ประหยัดดอกเบี้ย!'

  return (
    <button onClick={() => onSelect(type)}
      className={`card text-left w-full transition-all duration-200 ${selected === type ? 'border-2' : 'hover:border-surface-400'}`}
      style={selected === type ? { borderColor: color } : {}}>
      {isRecommended && (
        <div className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3" style={{ background: `${color}22`, color }}>
          ⭐ แนะนำ
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-lg flex items-center gap-2">{icon} {title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
        </div>
        <ChevronRight size={18} className="text-gray-500 mt-1 flex-shrink-0"/>
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-surface-700 rounded-xl p-3">
            <p className="text-xs text-gray-400">หมดหนี้ใน</p>
            <p className="font-display font-bold text-lg mt-0.5" style={{ color }}>{fmtMonths(result.months)}</p>
          </div>
          <div className="bg-surface-700 rounded-xl p-3">
            <p className="text-xs text-gray-400">ดอกเบี้ยรวม</p>
            <p className="font-display font-bold text-lg mt-0.5 text-white">{fmt(result.totalInterestPaid)}</p>
          </div>
        </div>
      )}
      {result && (
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-1.5">ลำดับการปิดหนี้</p>
          <div className="flex flex-wrap gap-1.5">
            {result.payoffOrder.map((name, i) => (
              <span key={i} className="flex items-center gap-1 text-xs bg-surface-600 px-2 py-0.5 rounded-full">
                <span className="text-gray-400">{i + 1}.</span>
                <span className="text-gray-200 truncate max-w-[120px]">{name}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  )
}

export default function Strategy() {
  const { userId } = useAuth()
  const [debts, setDebts]       = useState([])
  const [result, setResult]     = useState(null)
  const [extra, setExtra]       = useState(0)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getDebts(userId).then(r => { setDebts(r.data.data || []); setFetching(false) })
  }, [userId])

  const calculate = async () => {
    if (!debts.length) return
    setLoading(true)
    try {
      const res = await calcStrategy({ debts, extraPayment: extra })
      setResult(res.data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (debts.length) calculate() }, [debts, extra])

  if (fetching) return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="space-y-6">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">กลยุทธ์ปิดหนี้</h1>
        <p className="text-gray-400 text-sm mt-0.5">เปรียบเทียบ 2 วิธี — เลือกแบบที่ใช่สำหรับคุณ</p>
      </div>

      <div className="card animate-in delay-100">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-yellow-400"/>
          <p className="font-semibold text-sm">เงินพิเศษต่อเดือน (นอกจากขั้นต่ำ)</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="10000" step="500" value={extra}
            onChange={e => setExtra(Number(e.target.value))} className="flex-1 accent-brand-500"/>
          <div className="w-28">
            <input type="number" className="input text-center py-2 text-sm" value={extra}
              onChange={e => setExtra(Number(e.target.value))}/>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1.5">
          {extra > 0 ? `💡 เพิ่มอีก ${fmt(extra)} จะช่วยให้ปิดหนี้เร็วขึ้นมาก!` : 'ลองเพิ่มเงินพิเศษดูว่าจะเร็วขึ้นแค่ไหน'}
        </p>
      </div>

      {result && (
        <>
          <div className="card bg-gradient-to-r from-brand-500/10 to-orange-500/10 border-brand-500/30 animate-in delay-200">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-brand-400 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-semibold text-sm text-brand-300">
                  {result.recommendation === 'avalanche' ? '🧊 Avalanche' : '⛄ Snowball'} ดีกว่าสำหรับคุณ
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {result.recommendation === 'avalanche'
                    ? `ประหยัดดอกเบี้ยได้ ${fmt(result.interestSaved)}`
                    : `ปิดหนี้เร็วกว่า ${fmtMonths(result.monthsSaved)}`}
                  {result.monthsSaved > 0 && result.recommendation === 'avalanche' && ` · เร็วกว่า ${fmtMonths(result.monthsSaved)}`}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <StrategyCard type="snowball" result={result.snowball} isRecommended={result.recommendation==='snowball'} onSelect={setSelected} selected={selected}/>
            <StrategyCard type="avalanche" result={result.avalanche} isRecommended={result.recommendation==='avalanche'} onSelect={setSelected} selected={selected}/>
          </div>

          <div className="card animate-in delay-300">
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingDown size={16} className="text-green-400"/> เปรียบเทียบเต็มรูปแบบ
            </p>
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 text-xs border-b border-surface-700">
                <th className="text-left pb-2">รายการ</th>
                <th className="text-right pb-2">⛄ Snowball</th>
                <th className="text-right pb-2">🧊 Avalanche</th>
              </tr></thead>
              <tbody className="divide-y divide-surface-700">
                <tr><td className="py-2.5 text-gray-300">ระยะเวลา</td>
                  <td className="py-2.5 text-right font-mono text-blue-400">{fmtMonths(result.snowball.months)}</td>
                  <td className="py-2.5 text-right font-mono text-orange-400">{fmtMonths(result.avalanche.months)}</td></tr>
                <tr><td className="py-2.5 text-gray-300">ดอกเบี้ยรวม</td>
                  <td className="py-2.5 text-right font-mono text-blue-400">{fmt(result.snowball.totalInterestPaid)}</td>
                  <td className="py-2.5 text-right font-mono text-orange-400">{fmt(result.avalanche.totalInterestPaid)}</td></tr>
                <tr><td className="py-2.5 text-gray-300">ต่างกัน</td>
                  <td className="py-2.5 text-right text-xs text-gray-500" colSpan={2}>
                    {result.recommendation === 'avalanche' ? `Avalanche ประหยัดดอก ${fmt(result.interestSaved)}` : `Snowball เร็วกว่า ${fmtMonths(result.monthsSaved)}`}
                  </td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
      {loading && <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>}
    </div>
  )
}
