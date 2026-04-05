import { useDashboard } from '../hooks/useDashboard'
import { fmt, fmtShort, riskColor, levelFromXP } from '../utils/format'
import { AlertTriangle, TrendingDown, Zap, Award, Flame, ArrowRight, RefreshCw, TrendingUp, DollarSign, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { getAssets } from '../utils/api'

function StatCard({ label, value, sub, accent, delay = '', icon: Icon }) {
  return (
    <div className={`card animate-in ${delay}`}>
      <div className="flex items-start justify-between">
        <p className="label">{label}</p>
        {Icon && <Icon size={16} className={`${accent || 'text-gray-500'} opacity-60`} />}
      </div>
      <p className={`stat-number text-2xl mt-1 ${accent || 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function DebtTypeBreakdown({ debts }) {
  const short = debts.filter(d => d.term_type === 'short' || !d.term_type && (d.type === 'credit_card' || d.type === 'other'))
  const long  = debts.filter(d => d.term_type === 'long'  || (!d.term_type && (d.type === 'car' || d.type === 'house' || d.type === 'personal_loan')))
  const shortTotal = short.reduce((s, d) => s + d.current_balance, 0)
  const longTotal  = long.reduce((s, d) => s + d.current_balance, 0)
  const total = shortTotal + longTotal || 1

  return (
    <div className="card animate-in delay-200">
      <p className="font-semibold text-sm text-gray-200 mb-3">ประเภทหนี้สิน</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-400"/>
            <p className="text-xs text-gray-400">ระยะสั้น (&lt;1 ปี)</p>
          </div>
          <p className="font-display font-bold text-lg text-red-400">{fmt(shortTotal)}</p>
          <p className="text-xs text-gray-500">{short.length} รายการ · {Math.round(shortTotal/total*100)}%</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-400"/>
            <p className="text-xs text-gray-400">ระยะยาว (≥1 ปี)</p>
          </div>
          <p className="font-display font-bold text-lg text-orange-400">{fmt(longTotal)}</p>
          <p className="text-xs text-gray-500">{long.length} รายการ · {Math.round(longTotal/total*100)}%</p>
        </div>
      </div>
      {/* Bar */}
      <div className="mt-3 h-2 bg-surface-600 rounded-full overflow-hidden flex">
        <div className="h-full bg-red-400 transition-all" style={{ width: `${shortTotal/total*100}%` }}/>
        <div className="h-full bg-orange-400 transition-all" style={{ width: `${longTotal/total*100}%` }}/>
      </div>
    </div>
  )
}

function FinancialAnalysis({ summary, totalAssets, totalDebt }) {
  const netWorth = totalAssets - totalDebt
  const cashflow = summary.monthlyIncome - summary.monthlyExpense - summary.totalMin
  const liquidity = summary.monthlyIncome > 0 ? ((summary.monthlyIncome - summary.totalMin) / summary.monthlyIncome * 100).toFixed(0) : 0
  const debtRatio = totalAssets > 0 ? (totalDebt / totalAssets * 100).toFixed(0) : 0

  const netWorthColor = netWorth >= 0 ? 'text-green-400' : 'text-red-400'
  const cashflowColor = cashflow >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="card animate-in delay-300">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-purple-400"/>
        <p className="font-semibold text-sm text-gray-200">วิเคราะห์ทางการเงิน</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">ความมั่งคั่งสุทธิ</p>
          <p className={`font-display font-bold text-base ${netWorthColor}`}>{fmt(netWorth)}</p>
          <p className="text-xs text-gray-500">สินทรัพย์ - หนี้สิน</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">กระแสเงินสดสุทธิ</p>
          <p className={`font-display font-bold text-base ${cashflowColor}`}>{fmt(cashflow)}</p>
          <p className="text-xs text-gray-500">รายรับ - รายจ่าย - หนี้</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">สภาพคล่อง</p>
          <p className={`font-display font-bold text-base ${Number(liquidity) > 20 ? 'text-green-400' : 'text-yellow-400'}`}>{liquidity}%</p>
          <p className="text-xs text-gray-500">รายได้หลังจ่ายหนี้</p>
        </div>
        <div className="bg-surface-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">อัตราหนี้ต่อสินทรัพย์</p>
          <p className={`font-display font-bold text-base ${Number(debtRatio) > 60 ? 'text-red-400' : 'text-green-400'}`}>{debtRatio}%</p>
          <p className="text-xs text-gray-500">{Number(debtRatio) > 60 ? '⚠️ สูงเกินไป' : '✅ อยู่ในเกณฑ์ดี'}</p>
        </div>
      </div>
    </div>
  )
}

function DebtRiskBar({ debt }) {
  const pct = debt.principal > 0
    ? Math.round(((debt.principal - debt.current_balance) / debt.principal) * 100)
    : 0
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-700 last:border-0">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: debt.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-medium truncate">{debt.name}</span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{fmt(debt.current_balance)}</span>
        </div>
        <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: debt.color }}/>
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-gray-500">ชำระแล้ว {pct}%</span>
          <span className="text-xs" style={{ color: riskColor(debt.interest_rate) }}>{debt.interest_rate}% ต่อปี</span>
        </div>
      </div>
    </div>
  )
}

function XPBar({ user }) {
  const { level, nextXP, currentLevelXP } = levelFromXP(user.xp)
  const pct = nextXP ? Math.round(((user.xp - currentLevelXP) / (nextXP - currentLevelXP)) * 100) : 100
  return (
    <div className="card animate-in delay-300">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="label">Debt Killer Level {level}</p>
          <p className="stat-number text-2xl text-brand-400">{user.xp.toLocaleString()} XP</p>
        </div>
        <div className="text-4xl">{level < 3 ? '🌱' : level < 5 ? '🔥' : level < 8 ? '⚡' : '👑'}</div>
      </div>
      <div className="h-2 bg-surface-600 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}/>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-gray-500">Level {level}</span>
        {nextXP && <span className="text-xs text-gray-500">อีก {(nextXP - user.xp).toLocaleString()} XP → Level {level + 1}</span>}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Flame size={14} className="text-orange-400" />
        <span className="text-sm text-orange-400 font-medium">จ่ายตรง {user.streak_days} วัน</span>
        <span className="text-xs text-gray-500">🔥 streak!</span>
      </div>
    </div>
  )
}

function AlertBanner({ alerts }) {
  if (!alerts?.length) return null
  return (
    <div className="space-y-2 animate-in delay-100">
      {alerts.slice(0, 3).map(a => (
        <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${a.type === 'milestone' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-brand-500/10 border-brand-500/30 text-brand-300'}`}>
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{a.message}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { userId } = useAuth()
  const { data, loading, error, reload } = useDashboard(userId)
  const [assets, setAssets] = useState(null)

  useEffect(() => {
    if (userId) {
      getAssets(userId).then(r => setAssets(r.data.data)).catch(() => {})
    }
  }, [userId])

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">กำลังโหลดข้อมูล...</p>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-red-400">⚠️ โหลดข้อมูลไม่ได้: {error}</p>
      <button onClick={reload} className="btn-ghost flex items-center gap-2 text-sm">
        <RefreshCw size={15} /> ลองอีกครั้ง
      </button>
    </div>
  )

  const { user, summary, debts, alerts, badges } = data
  const totalAssets = assets?.totalValue || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">สวัสดี, {user.name} 👋</h1>
        <p className="text-gray-400 text-sm mt-0.5">นี่คือภาพรวมการเงินของคุณวันนี้</p>
      </div>

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="หนี้รวมทั้งหมด" value={`฿${fmtShort(summary.totalDebt)}`} sub={`จาก ฿${fmtShort(summary.totalPrincipal)} ต้น`} accent="text-brand-400" delay="delay-100" icon={CreditCard2} />
        <StatCard label="ชำระแล้ว" value={`${summary.paidPercent}%`} sub={`${summary.debtCount} รายการหนี้`} accent="text-green-400" delay="delay-200" icon={TrendingDown} />
        <StatCard label="ชำระขั้นต่ำ/เดือน" value={`฿${fmtShort(summary.totalMin)}`} sub={`${summary.debtToIncomeRatio}% ของรายได้`} accent={summary.debtToIncomeRatio > 40 ? 'text-red-400' : 'text-yellow-400'} delay="delay-300" icon={DollarSign} />
        <StatCard label="สินทรัพย์รวม" value={`฿${fmtShort(totalAssets)}`} sub={`สุทธิ ฿${fmtShort(totalAssets - summary.totalDebt)}`} accent={totalAssets > summary.totalDebt ? 'text-green-400' : 'text-red-400'} delay="delay-400" icon={Shield} />
      </div>

      {/* Debt type breakdown */}
      <DebtTypeBreakdown debts={debts} />

      {/* Overall progress */}
      <div className="card animate-in delay-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="label">ความคืบหน้าการปิดหนี้</p>
            <p className="stat-number text-xl">
              <span className="text-green-400">{summary.paidPercent}%</span>
              <span className="text-gray-500 text-base font-normal"> เสร็จสิ้น</span>
            </p>
          </div>
          <TrendingDown size={28} className="text-green-400 opacity-60" />
        </div>
        <div className="h-4 bg-surface-600 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 via-brand-500 to-orange-400 rounded-full transition-all duration-1000 relative"
            style={{ width: `${summary.paidPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>เริ่มต้น: {fmt(summary.totalPrincipal)}</span>
          <span>เหลือ: {fmt(summary.totalDebt)}</span>
        </div>
      </div>

      {/* Financial analysis */}
      <FinancialAnalysis
        summary={{ ...summary, monthlyExpense: user.monthly_expense || 0 }}
        totalAssets={totalAssets}
        totalDebt={summary.totalDebt}
      />

      {/* Debts + XP */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card animate-in delay-300">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm text-gray-200">รายการหนี้</p>
            <Link to="/debts" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              ดูทั้งหมด <ArrowRight size={12} />
            </Link>
          </div>
          {debts.length === 0
            ? <p className="text-gray-500 text-sm py-4 text-center">ไม่มีหนี้ 🎉</p>
            : debts.map(d => <DebtRiskBar key={d.id} debt={d} />)
          }
        </div>

        <div className="space-y-4">
          <XPBar user={user} />
          <div className="card animate-in delay-400">
            <div className="flex items-center gap-2 mb-3">
              <Award size={16} className="text-yellow-400" />
              <p className="font-semibold text-sm text-gray-200">Badge ที่ได้รับ</p>
            </div>
            {badges?.length ? (
              <div className="flex flex-wrap gap-2">
                {badges.map(b => (
                  <div key={b.id} className="flex items-center gap-1.5 bg-surface-700 border border-surface-500 rounded-full px-3 py-1 text-xs font-medium">
                    <span>{b.icon}</span><span className="text-gray-200">{b.name}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-500">ยังไม่มี badge — เริ่มจ่ายหนี้เพื่อรับ! 🎯</p>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in delay-400">
        {[
          { to: '/debts',       icon: Zap,         color: 'brand', label: 'บันทึกชำระหนี้', sub: '+50 XP ต่อครั้ง' },
          { to: '/strategy',    icon: TrendingDown, color: 'green', label: 'วางกลยุทธ์',     sub: 'Snowball / Avalanche' },
          { to: '/transactions', icon: DollarSign, color: 'purple', label: 'บันทึกรายรับ',   sub: 'ติดตามรายได้-จ่าย' },
          { to: '/goals',       icon: Award,        color: 'yellow', label: 'เป้าหมาย',       sub: 'ตั้งเป้าปิดหนี้' },
        ].map(({ to, icon: Icon, color, label, sub }) => (
          <Link key={to} to={to} className="card-hover flex items-center gap-3 cursor-pointer">
            <div className={`w-9 h-9 bg-${color}-500/20 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={`text-${color}-400`} />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// icon alias
import { CreditCard as CreditCard2 } from 'lucide-react'
