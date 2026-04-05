import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, TrendingDown, BarChart3,
  Bell, Menu, X, Target, Wallet, BookOpen, Calendar,
  GitMerge, LogOut, ChevronRight, PiggyBank
} from 'lucide-react'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginPage       from './pages/LoginPage'
import Dashboard       from './pages/Dashboard'
import Debts           from './pages/Debts'
import Strategy        from './pages/Strategy'
import Simulate        from './pages/Simulate'
import Transactions    from './pages/Transactions'
import Assets          from './pages/Assets'
import Goals           from './pages/Goals'
import AlertsPage      from './pages/AlertsPage'
import DebtCalculator  from './pages/DebtCalculator'
import DebtConsolidate from './pages/DebtConsolidate'
import DebtPriority    from './pages/DebtPriority'
import DebtKnowledge   from './pages/DebtKnowledge'
import PaymentSchedule from './pages/PaymentSchedule'

const NAV_MAIN = [
  { to: '/',             icon: LayoutDashboard, label: 'ภาพรวม' },
  { to: '/debts',        icon: CreditCard,      label: 'หนี้ของฉัน' },
  { to: '/strategy',     icon: TrendingDown,    label: 'กลยุทธ์' },
  { to: '/simulate',     icon: BarChart3,       label: 'จำลองอนาคต' },
]

const NAV_TOOLS = [
  { to: '/transactions', icon: Wallet,          label: 'รายรับ-รายจ่าย' },
  { to: '/assets',       icon: PiggyBank,       label: 'สินทรัพย์' },
  { to: '/goals',        icon: Target,          label: 'เป้าหมาย' },
  { to: '/calculator',   icon: BarChart3,       label: 'คำนวณปิดหนี้' },
  { to: '/consolidate',  icon: GitMerge,        label: 'รวมหนี้' },
  { to: '/priority',     icon: ChevronRight,    label: 'ลำดับความสำคัญ' },
  { to: '/schedule',     icon: Calendar,        label: 'ตารางชำระหนี้' },
  { to: '/knowledge',    icon: BookOpen,        label: 'ความรู้การเงิน' },
]

function SideNav({ onClose }) {
  const { user, logout } = useAuth()
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="mb-5 px-2 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💸</span>
            <span className="font-display font-bold text-xl text-gradient">DebtHelper</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 pl-9">GPS การเงินส่วนตัว</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg lg:hidden">
            <X size={18}/>
          </button>
        )}
      </div>

      {/* Main nav */}
      <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-1">หลัก</p>
      {NAV_MAIN.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isActive ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-surface-700'
            }`}
        >
          <Icon size={17} />{label}
        </NavLink>
      ))}

      {/* Tools nav */}
      <p className="text-xs text-gray-600 uppercase tracking-wider px-3 mb-1 mt-4">เครื่องมือ</p>
      {NAV_TOOLS.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to}
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-surface-700'
            }`}
        >
          <Icon size={16} />{label}
        </NavLink>
      ))}

      {/* Alerts */}
      <NavLink to="/alerts" onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all mt-1 ${
            isActive ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-surface-700'
          }`}
      >
        <Bell size={16}/> แจ้งเตือน
      </NavLink>

      {/* User */}
      <div className="mt-auto pt-3 border-t border-surface-700">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm">
            👤
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'ผู้ใช้'}</p>
            <p className="text-xs text-gray-500">Level {user?.level || 1} · {user?.xp || 0} XP</p>
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-red-400 transition-colors" title="ออกจากระบบ">
            <LogOut size={15}/>
          </button>
        </div>
      </div>
    </div>
  )
}

function AppLayout() {
  const { user, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  if (!user) return <LoginPage />

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-surface-700 p-4 gap-0.5 fixed h-full z-10 overflow-y-auto">
        <SideNav />
      </aside>

      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-surface-900/90 backdrop-blur border-b border-surface-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">💸</span>
          <span className="font-display font-bold text-lg text-gradient">DebtHelper</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-surface-700">
          {menuOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-surface-900/98 pt-4 p-4 flex flex-col gap-0.5 overflow-y-auto">
          <SideNav onClose={() => setMenuOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/debts"       element={<Debts />} />
            <Route path="/strategy"    element={<Strategy />} />
            <Route path="/simulate"    element={<Simulate />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/assets"      element={<Assets />} />
            <Route path="/goals"       element={<Goals />} />
            <Route path="/alerts"      element={<AlertsPage />} />
            <Route path="/calculator"  element={<DebtCalculator />} />
            <Route path="/consolidate" element={<DebtConsolidate />} />
            <Route path="/priority"    element={<DebtPriority />} />
            <Route path="/schedule"    element={<PaymentSchedule />} />
            <Route path="/knowledge"   element={<DebtKnowledge />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
