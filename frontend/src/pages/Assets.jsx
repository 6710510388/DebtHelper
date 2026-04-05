import { useState, useEffect } from 'react'
import { getAssets, createAsset, updateAsset, deleteAsset } from '../utils/api'
import { fmt } from '../utils/format'
import { Plus, Trash2, Edit2, X, PiggyBank } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const ASSET_TYPES = {
  cash: '💵 เงินสด', bank: '🏦 บัญชีธนาคาร', stock: '📈 หุ้น/กองทุน',
  property: '🏠 อสังหาริมทรัพย์', vehicle: '🚗 ยานพาหนะ', other: '📦 อื่นๆ'
}

function AssetModal({ asset, onClose, onSaved }) {
  const { userId } = useAuth()
  const [form, setForm] = useState(asset || { name: '', type: 'bank', current_value: '', purchase_value: '', purchase_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.current_value) return
    setSaving(true)
    try {
      const data = { ...form, userId, current_value: parseFloat(form.current_value), purchase_value: parseFloat(form.purchase_value) || 0 }
      if (asset?.id) await updateAsset(asset.id, data)
      else await createAsset(data)
      onSaved(); onClose()
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end lg:items-center justify-center p-4">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">{asset ? 'แก้ไขสินทรัพย์' : 'เพิ่มสินทรัพย์'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-700 rounded-lg"><X size={18}/></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">ชื่อสินทรัพย์ *</label>
            <input className="input" placeholder="เช่น บัญชีออมทรัพย์ KBank" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="label">ประเภท</label>
            <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
              {Object.entries(ASSET_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">มูลค่าปัจจุบัน (฿) *</label>
              <input className="input" type="number" placeholder="0" value={form.current_value} onChange={e => set('current_value', e.target.value)} />
            </div>
            <div>
              <label className="label">ราคาซื้อ (฿)</label>
              <input className="input" type="number" placeholder="0" value={form.purchase_value} onChange={e => set('purchase_value', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">วันที่ซื้อ</label>
            <input className="input" type="date" value={form.purchase_date || ''} onChange={e => set('purchase_date', e.target.value)} />
          </div>
          <div>
            <label className="label">หมายเหตุ</label>
            <input className="input" placeholder="รายละเอียดเพิ่มเติม" value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">ยกเลิก</button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">{saving ? 'กำลังบันทึก...' : asset ? '✏️ บันทึก' : '+ เพิ่ม'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Assets() {
  const { userId } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editAsset, setEditAsset] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await getAssets(userId)
      setData(r.data.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [userId])

  const handleDelete = async (id) => {
    if (!confirm('ลบสินทรัพย์นี้?')) return
    await deleteAsset(id)
    load()
  }

  const assets = data?.assets || []
  const totalValue = data?.totalValue || 0

  const byType = {}
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.current_value })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between animate-in">
        <div>
          <h1 className="font-display font-bold text-2xl">สินทรัพย์</h1>
          <p className="text-gray-400 text-sm mt-0.5">มูลค่าทรัพย์สินทั้งหมดของคุณ</p>
        </div>
        <button onClick={() => { setEditAsset(null); setShowModal(true) }} className="btn-primary flex items-center gap-2 text-sm"><Plus size={16}/> เพิ่ม</button>
      </div>

      {/* Total */}
      <div className="card animate-in delay-100 bg-gradient-to-r from-green-500/10 to-teal-500/10 border-green-500/30">
        <div className="flex items-center gap-3">
          <PiggyBank size={32} className="text-green-400"/>
          <div>
            <p className="label">มูลค่าสินทรัพย์รวม</p>
            <p className="font-display font-bold text-3xl text-green-400">{fmt(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* By type */}
      {Object.keys(byType).length > 0 && (
        <div className="card animate-in delay-200">
          <p className="font-semibold text-sm text-gray-200 mb-3">แบ่งตามประเภท</p>
          <div className="space-y-2">
            {Object.entries(byType).sort((a,b) => b[1]-a[1]).map(([type, val]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-gray-300 w-36">{ASSET_TYPES[type] || type}</span>
                <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: `${totalValue > 0 ? val/totalValue*100 : 0}%` }}/>
                </div>
                <span className="text-sm font-medium text-white w-24 text-right">{fmt(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asset list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>
      ) : assets.length === 0 ? (
        <div className="card text-center py-12">
          <PiggyBank size={40} className="text-gray-600 mx-auto mb-3"/>
          <p className="text-gray-400">ยังไม่มีสินทรัพย์ — เริ่มบันทึกได้เลย!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">+ เพิ่มสินทรัพย์แรก</button>
        </div>
      ) : (
        <div className="space-y-3 animate-in delay-300">
          {assets.map(a => {
            const gain = a.current_value - (a.purchase_value || 0)
            const gainPct = a.purchase_value > 0 ? ((gain / a.purchase_value) * 100).toFixed(1) : null
            return (
              <div key={a.id} className="card-hover flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center text-xl flex-shrink-0">
                  {ASSET_TYPES[a.type]?.split(' ')[0] || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.name}</p>
                  <p className="text-xs text-gray-500">{ASSET_TYPES[a.type] || a.type}{a.purchase_date ? ` · ซื้อ ${a.purchase_date}` : ''}</p>
                  {gainPct && (
                    <p className={`text-xs mt-0.5 ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {gain >= 0 ? '+' : ''}{fmt(gain)} ({gainPct}%)
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-lg text-white">{fmt(a.current_value)}</p>
                  {a.purchase_value > 0 && <p className="text-xs text-gray-500">ซื้อ {fmt(a.purchase_value)}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditAsset(a); setShowModal(true) }} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-brand-400"><Edit2 size={14}/></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-surface-700 rounded-lg text-gray-500 hover:text-red-400"><Trash2 size={14}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <AssetModal asset={editAsset} onClose={() => setShowModal(false)} onSaved={load}/>}
    </div>
  )
}
