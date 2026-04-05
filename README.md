# 💸 DebtHelper
> GPS การเงินส่วนตัว — จากคนติดหนี้ → คนคุมชีวิตตัวเองได้

---

## 📁 โครงสร้างโปรเจค

```
debthelper/
├── frontend/              React + Vite (deploy → Azure Static Web App)
├── api/                   Azure Functions Node.js (backend)
├── database/              SQLite schema + init script
└── staticwebapp.config.json
```

---

## 🚀 Setup ทีละขั้นตอน

### 1. สร้าง Database

```bash
cd database
npm install better-sqlite3
node init-db.js
```

จะได้ไฟล์ `database/debthelper.db`

**เปิดด้วย DBeaver:**
1. File → New → Database Connection → SQLite
2. Browse ไปที่ `debthelper/database/debthelper.db`
3. Finish

---

### 2. รัน Backend (Azure Functions)

```bash
cd api
npm install
# ติดตั้ง Azure Functions Core Tools ก่อน (ถ้ายังไม่มี)
npm install -g azure-functions-core-tools@4 --unsafe-perm true
func start
```

API จะรันที่ `http://localhost:7071/api/`

**Endpoints:**
| Method | URL | คำอธิบาย |
|--------|-----|---------|
| GET | /api/dashboard?userId=1 | ข้อมูลรวม dashboard |
| GET | /api/debts?userId=1 | รายการหนี้ทั้งหมด |
| POST | /api/debts | เพิ่มหนี้ใหม่ |
| PUT | /api/debts?id=1 | แก้ไขหนี้ |
| DELETE | /api/debts?id=1 | ลบหนี้ |
| GET | /api/payments?userId=1 | ประวัติการชำระ |
| POST | /api/payments | บันทึกการชำระ |
| POST | /api/strategy | คำนวณ Snowball vs Avalanche |

---

### 3. รัน Frontend

```bash
cd frontend
npm install
npm run dev
```

เปิด `http://localhost:5173`

---

## ☁️ Deploy ขึ้น Azure Static Web Apps

### วิธีที่ 1: Azure Portal (ง่ายสุด)

1. ไปที่ [portal.azure.com](https://portal.azure.com)
2. สร้าง **Static Web Apps** resource ใหม่
3. เชื่อมกับ GitHub repository
4. ตั้งค่า build:
   - **App location:** `/frontend`
   - **Api location:** `/api`
   - **Output location:** `dist`

### วิธีที่ 2: Azure CLI

```bash
# Login
az login

# สร้าง resource group
az group create --name debthelper-rg --location southeastasia

# Deploy Static Web App
az staticwebapp create \
  --name debthelper-app \
  --resource-group debthelper-rg \
  --source https://github.com/YOUR_USERNAME/debthelper \
  --location "East Asia" \
  --branch main \
  --app-location "/frontend" \
  --api-location "/api" \
  --output-location "dist"
```

### ⚠️ หมายเหตุ SQLite บน Azure

SQLite ใช้ได้ใน Azure Functions แต่ต้องจัดการ file path:
- **Local:** ใช้ `better-sqlite3` ปกติ
- **Production:** แนะนำเปลี่ยนเป็น **Azure SQL** หรือ **Cosmos DB** สำหรับ production จริง
- หรือใช้ **Azure Blob Storage** mount สำหรับ SQLite file

---

## 🎮 Features

| Feature | สถานะ |
|---------|-------|
| Dashboard ยอดหนี้รวม | ✅ |
| เพิ่ม/แก้ไข/ลบหนี้ | ✅ |
| บันทึกการชำระ | ✅ |
| Snowball Strategy | ✅ |
| Avalanche Strategy | ✅ |
| กราฟจำลองอนาคต | ✅ |
| Gamification (XP/Badge/Streak) | ✅ |
| Debt Risk Alert | ✅ |
| เงินพิเศษ simulator | ✅ |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS + Recharts
- **Backend:** Azure Functions (Node.js)
- **Database:** SQLite (better-sqlite3)
- **Deploy:** Azure Static Web Apps
