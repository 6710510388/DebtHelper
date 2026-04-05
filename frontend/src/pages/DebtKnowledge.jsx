import { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react'

const ARTICLES = [
  {
    id: 1, icon: '📊', category: 'พื้นฐาน',
    title: 'หนี้ดีกับหนี้เสีย ต่างกันอย่างไร?',
    summary: 'ไม่ใช่หนี้ทุกประเภทที่แย่ — รู้จักแยกแยะเพื่อตัดสินใจได้ถูกต้อง',
    content: `**หนี้ดี (Good Debt)** คือหนี้ที่ก่อให้เกิดมูลค่าในอนาคต:
• สินเชื่อบ้าน — มูลค่าทรัพย์สินมักเพิ่มขึ้นตามเวลา
• สินเชื่อการศึกษา — เพิ่มรายได้ในอนาคต
• สินเชื่อธุรกิจ — สร้างรายได้และสินทรัพย์

**หนี้เสีย (Bad Debt)** คือหนี้ที่ลดมูลค่าหรือไม่สร้างรายได้:
• บัตรเครดิตที่ชำระไม่หมด ดอกเบี้ย 18-20%
• สินเชื่อส่วนบุคคลสำหรับสิ่งฟุ่มเฟือย
• ผ่อนสิ่งของที่มูลค่าลดลงเร็ว เช่น โทรศัพท์

**หลักง่ายๆ:** ถ้าดอกเบี้ยสูงกว่าผลตอบแทนที่คาดว่าจะได้ = หนี้เสีย`
  },
  {
    id: 2, icon: '🏔️', category: 'กลยุทธ์',
    title: 'Avalanche vs Snowball — เลือกอะไรดี?',
    summary: 'สองกลยุทธ์ยอดนิยมในการปิดหนี้ แต่ละวิธีเหมาะกับคนต่างประเภท',
    content: `**Avalanche Method (ปิดดอกสูงสุดก่อน)**
• จ่ายขั้นต่ำทุกรายการ
• ใส่เงินพิเศษทั้งหมดไปที่หนี้ดอกเบี้ยสูงสุด
• ✅ ประหยัดดอกเบี้ยสูงสุดในระยะยาว
• ❌ อาจใช้เวลานานก่อนเห็นผลสำเร็จ

**Snowball Method (ปิดยอดน้อยสุดก่อน)**
• จ่ายขั้นต่ำทุกรายการ
• ใส่เงินพิเศษไปที่หนี้ยอดน้อยที่สุด
• ✅ เห็นผลเร็ว สร้างแรงจูงใจ
• ❌ จ่ายดอกเบี้ยรวมมากกว่าเล็กน้อย

**เลือกแบบไหน?**
→ ถ้าต้องการ momentum และแรงจูงใจ → Snowball
→ ถ้าต้องการประหยัดเงินสูงสุด → Avalanche`
  },
  {
    id: 3, icon: '📉', category: 'กลยุทธ์',
    title: '5 วิธีปิดหนี้เร็วขึ้นโดยไม่เจ็บปวด',
    summary: 'เทคนิคง่ายๆ ที่ช่วยให้คุณหลุดพ้นหนี้เร็วกว่ากำหนด',
    content: `**1. จ่ายมากกว่าขั้นต่ำเสมอ**
แม้แค่ ฿500 เพิ่มต่อเดือน ช่วยประหยัดดอกเบี้ยได้มากในระยะยาว

**2. ใช้เงินพิเศษปิดหนี้ทันที**
โบนัส, เงินคืนภาษี, รายได้พิเศษ — อย่าเก็บไว้ใช้เรื่องอื่น

**3. รีไฟแนนซ์เมื่อมีโอกาส**
ถ้าเครดิตสกอร์ดีขึ้น ลองขอลดดอกเบี้ยจากสถาบันการเงิน

**4. หารายได้เพิ่ม**
งาน freelance, ขายของออนไลน์ — นำเงินทั้งหมดไปปิดหนี้

**5. ลดรายจ่ายที่ไม่จำเป็น**
ตัด subscription, ลดค่าอาหาร แล้วโอนส่วนต่างไปชำระหนี้`
  },
  {
    id: 4, icon: '📊', category: 'การวิเคราะห์',
    title: 'ทำความเข้าใจ Debt-to-Income Ratio (DTI)',
    summary: 'ตัวเลขสำคัญที่ธนาคารและคุณควรรู้ก่อนก่อหนี้เพิ่ม',
    content: `**DTI คืออะไร?**
อัตราส่วนหนี้ต่อรายได้ = (ยอดชำระหนี้ต่อเดือน ÷ รายได้รวม) × 100

**เกณฑ์ที่ควรรู้:**
• ต่ำกว่า 20% — ดีมาก มีสภาพคล่องสูง
• 20–35% — ปกติ ยังจัดการได้
• 35–50% — ระวัง เงินเหลือน้อย
• สูงกว่า 50% — อันตราย ควรหยุดก่อหนี้เพิ่ม

**ตัวอย่าง:**
รายได้ ฿35,000 · จ่ายหนี้ ฿14,000
DTI = 14,000/35,000 × 100 = 40% ← ควรระวัง

**เคล็ดลับ:** ธนาคารส่วนใหญ่จะอนุมัติสินเชื่อเพิ่มเมื่อ DTI ต่ำกว่า 40%`
  },
  {
    id: 5, icon: '🛡️', category: 'การป้องกัน',
    title: 'สร้างกองทุนฉุกเฉินก่อนหรือหลังปิดหนี้?',
    summary: 'คำถามยอดฮิตที่หลายคนสับสน — คำตอบขึ้นอยู่กับสถานการณ์ของคุณ',
    content: `**คำแนะนำทั่วไป:**
สร้างกองทุนฉุกเฉินขั้นต่ำ ฿10,000–20,000 ก่อน แล้วค่อยรุกปิดหนี้

**ทำไมต้องมีกองทุนฉุกเฉิน?**
ถ้าไม่มี และเกิดเหตุฉุกเฉิน คุณจะต้องกลับไปกู้หนี้ใหม่ในอัตราดอกเบี้ยสูง

**กลยุทธ์แนะนำ:**
1. สร้างกองทุนฉุกเฉิน 1 เดือน (฿15,000–30,000)
2. รุกปิดหนี้ดอกสูงสุดก่อน
3. เมื่อปิดหนี้หมดแล้ว เพิ่มกองทุนฉุกเฉินเป็น 3–6 เดือน

**ถ้าหนี้ดอกสูงมาก (>15%)**
อาจข้ามขั้นตอนที่ 1 แล้วรีบปิดหนี้ก่อน โดยมีเงินสดสำรองน้อยๆ ไว้`
  },
  {
    id: 6, icon: '💳', category: 'บัตรเครดิต',
    title: 'ใช้บัตรเครดิตอย่างไรให้ได้ประโยชน์ ไม่เป็นหนี้',
    summary: 'บัตรเครดิตไม่ใช่ศัตรู ถ้าใช้ถูกวิธีมีแต่ได้ประโยชน์',
    content: `**กฎทอง: ชำระเต็มจำนวนทุกเดือน**
ดอกเบี้ย 18–20% ต่อปี จะทำให้ทุก ฿100 ที่ใช้ กลายเป็น ฿120 ภายใน 1 ปี

**เทคนิคการใช้บัตรอย่างชาญฉลาด:**
• ตั้งชำระอัตโนมัติเต็มยอดทุกเดือน
• ใช้บัตรเฉพาะสิ่งที่มีเงินสดพร้อมจ่ายอยู่แล้ว
• เลือกบัตรที่มีคะแนนสะสม/เงินคืนที่คุ้มค่า
• อย่าใช้เกิน 30% ของวงเงิน (ดี Credit Score)

**สัญญาณอันตราย:**
❌ จ่ายแค่ขั้นต่ำทุกเดือน
❌ กดเงินสดจากบัตรเครดิต (ดอก 28%)
❌ ใช้บัตรซื้อของที่ไม่ได้วางแผน`
  },
]

function ArticleCard({ article }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`card-hover transition-all ${open ? 'border-brand-500/30' : ''}`}>
      <button className="w-full text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">{article.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">{article.category}</span>
                <p className="font-semibold mt-1.5">{article.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">{article.summary}</p>
              </div>
              <div className="flex-shrink-0 text-gray-500 mt-1">
                {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
              </div>
            </div>
          </div>
        </div>
      </button>
      {open && (
        <div className="mt-4 pt-4 border-t border-surface-700 animate-in">
          <div className="text-sm text-gray-300 space-y-2 whitespace-pre-line leading-relaxed">
            {article.content.split('\n').map((line, i) => {
              const isBold = line.startsWith('**') && line.includes('**', 2)
              const isListItem = line.startsWith('•') || line.startsWith('→') || line.startsWith('❌') || line.startsWith('✅') || line.match(/^\d\./)
              if (isBold && line.endsWith('**')) {
                const text = line.replace(/\*\*/g, '')
                return <p key={i} className="font-semibold text-white mt-3 first:mt-0">{text}</p>
              }
              if (isListItem) return <p key={i} className="pl-2 text-gray-300">{line}</p>
              return <p key={i} className="text-gray-400">{line}</p>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DebtKnowledge() {
  const [filter, setFilter] = useState('ทั้งหมด')
  const categories = ['ทั้งหมด', ...new Set(ARTICLES.map(a => a.category))]
  const filtered = filter === 'ทั้งหมด' ? ARTICLES : ARTICLES.filter(a => a.category === filter)

  return (
    <div className="space-y-5">
      <div className="animate-in">
        <h1 className="font-display font-bold text-2xl">ความรู้การจัดการหนี้</h1>
        <p className="text-gray-400 text-sm mt-0.5">บทความและเคล็ดลับจากผู้เชี่ยวชาญด้านการเงิน</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 animate-in delay-100">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === c ? 'bg-brand-500 text-white' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Articles */}
      <div className="space-y-3 animate-in delay-200">
        {filtered.map(a => <ArticleCard key={a.id} article={a} />)}
      </div>

      {/* Footer tip */}
      <div className="card bg-gradient-to-r from-brand-500/10 to-orange-500/10 border-brand-500/30 animate-in delay-300 text-center">
        <p className="text-2xl mb-2">🎓</p>
        <p className="font-semibold text-sm text-brand-300">ความรู้ทางการเงินคือการลงทุนที่ดีที่สุด</p>
        <p className="text-xs text-gray-400 mt-1">ยิ่งเข้าใจมากขึ้น ยิ่งตัดสินใจได้ดีขึ้น และหลุดพ้นหนี้ได้เร็วขึ้น</p>
      </div>
    </div>
  )
}
