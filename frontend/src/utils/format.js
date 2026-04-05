export const fmt = (n) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)

export const fmtShort = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

export const fmtMonths = (m) => {
  const y = Math.floor(m / 12)
  const mo = m % 12
  if (y === 0) return `${mo} เดือน`
  if (mo === 0) return `${y} ปี`
  return `${y} ปี ${mo} เดือน`
}

export const debtTypeLabel = {
  credit_card:   'บัตรเครดิต',
  personal_loan: 'สินเชื่อส่วนบุคคล',
  car:           'ผ่อนรถ',
  house:         'ผ่อนบ้าน',
  other:         'อื่นๆ'
}

export const levelFromXP = (xp) => {
  const levels = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]
  let lv = 1
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i]) lv = i + 1 }
  return { level: lv, nextXP: levels[lv] || null, currentLevelXP: levels[lv - 1] || 0 }
}

export const riskColor = (rate) => {
  if (rate >= 20) return '#ff3d22'
  if (rate >= 15) return '#ff9f43'
  if (rate >= 8)  return '#ffd32a'
  return '#0be881'
}
