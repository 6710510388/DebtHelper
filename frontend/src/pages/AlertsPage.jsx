import { useState, useEffect } from 'react'
import { getAlerts, markAlertRead, markAllAlertsRead } from '../utils/api'
import { Bell, BellOff, CheckCheck, AlertTriangle, Info, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TYPE_CONFIG = {
  due_soon:    { icon: AlertTriangle, color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/30',    label: 'ใกล้ครบกำหนด' },
  overdue:     { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', label: 'เกินกำหนด' },
  milestone:   { icon: Trophy,        color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/30',  label: 'ความสำเร็จ' },
  high_interest: { icon: Info,        color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', label: 'ดอกเบี้ยสูง' },
  info:        { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30',    label: 'ข้อมูล' },
}

export default function AlertsPage() {
  const { userId } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const r = await getAlerts(userId)
      setAlerts(r.data.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [userId])

  const handleRead = async (id) => {
    await markAlertRead(id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: 1 } : a))
  }

  const handleReadAll = async () => {
    await markAllAlertsRead(userId)
    setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })))
  }

  const unread = alerts.filter(a => !a.is_read)
  const read   = alerts.filter(a => a.is_read)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">การแจ้งเตือน</h1>
          <p className="text-gray-400 text-sm mt-0.5">{unread.length > 0 ? `${unread.length} รายการยังไม่ได้อ่าน` : 'อ่านครบแล้ว'}</p>
        </div>
        {unread.length > 0 && (
          <button onClick={handleReadAll} className="btn-ghost flex items-center gap-2 text-sm">
            <CheckCheck size={15}/> อ่านทั้งหมด
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : alerts.length === 0 ? (
        <div className="card text-center py-16">
          <BellOff size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">ไม่มีการแจ้งเตือน</p>
          <p className="text-gray-500 text-sm mt-1">การแจ้งเตือนจะปรากฏเมื่อมีหนี้ใกล้ครบกำหนดหรือเหตุการณ์สำคัญ</p>
        </div>
      ) : (
        <div className="space-y-4 animate-in delay-100">
          {/* Unread */}
          {unread.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Bell size={12} className="text-brand-400"/> ยังไม่ได้อ่าน ({unread.length})
              </p>
              {unread.map(a => {
                const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info
                const Icon = cfg.icon
                return (
                  <div key={a.id} className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.bg} cursor-pointer`} onClick={() => handleRead(a.id)}>
                    <Icon size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-xs font-semibold ${cfg.color} mb-0.5`}>{cfg.label}</p>
                          <p className="text-sm text-white">{a.message}</p>
                          {a.debt_name && <p className="text-xs text-gray-400 mt-1">📌 {a.debt_name}</p>}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{a.created_at?.split('T')[0]}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-600 uppercase tracking-wider">อ่านแล้ว ({read.length})</p>
              {read.map(a => {
                const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info
                const Icon = cfg.icon
                return (
                  <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl border border-surface-600 bg-surface-800/50 opacity-60">
                    <Icon size={16} className="text-gray-500 flex-shrink-0 mt-0.5"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400">{a.message}</p>
                      {a.debt_name && <p className="text-xs text-gray-500 mt-0.5">📌 {a.debt_name}</p>}
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">{a.created_at?.split('T')[0]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
