-- DebtHelper SQLite Schema v2
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ===========================
-- USERS (เพิ่ม password_hash)
-- ===========================
CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL DEFAULT '',
  avatar_url      TEXT,
  monthly_income  REAL DEFAULT 0,
  monthly_expense REAL DEFAULT 0,
  level           INTEGER DEFAULT 1,
  xp              INTEGER DEFAULT 0,
  streak_days     INTEGER DEFAULT 0,
  last_paid_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now'))
);

-- ===========================
-- DEBTS (เพิ่ม term_months)
-- ===========================
CREATE TABLE IF NOT EXISTS debts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,   -- credit_card|personal_loan|car|house|other
  term_type       TEXT DEFAULT 'short', -- short (<1yr) | long (>=1yr)
  creditor        TEXT,
  principal       REAL NOT NULL,
  current_balance REAL NOT NULL,
  interest_rate   REAL NOT NULL,
  min_payment     REAL NOT NULL,
  due_day         INTEGER,
  start_date      TEXT,
  term_months     INTEGER,         -- จำนวนเดือนทั้งหมด
  priority        INTEGER DEFAULT 3, -- 1=สูงสุด 2=สูง 3=ปานกลาง 4=ต่ำ
  status          TEXT DEFAULT 'active',
  color           TEXT DEFAULT '#FF6B6B',
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- PAYMENTS
-- ===========================
CREATE TABLE IF NOT EXISTS payments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  debt_id     INTEGER NOT NULL,
  user_id     INTEGER NOT NULL,
  amount      REAL NOT NULL,
  paid_date   TEXT NOT NULL,
  note        TEXT,
  is_extra    INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- INCOME & EXPENSES
-- ===========================
CREATE TABLE IF NOT EXISTS transactions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  type        TEXT NOT NULL,       -- income | expense
  category    TEXT NOT NULL,       -- salary|freelance|bonus|food|transport|etc.
  amount      REAL NOT NULL,
  date        TEXT NOT NULL,
  note        TEXT,
  is_recurring INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- ASSETS (สินทรัพย์)
-- ===========================
CREATE TABLE IF NOT EXISTS assets (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,   -- cash|bank|stock|property|vehicle|other
  current_value   REAL NOT NULL,
  purchase_value  REAL DEFAULT 0,
  purchase_date   TEXT,
  notes           TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- GOALS (เป้าหมาย)
-- ===========================
CREATE TABLE IF NOT EXISTS goals (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL,
  debt_id         INTEGER,          -- ถ้าผูกกับหนี้
  title           TEXT NOT NULL,
  target_amount   REAL NOT NULL,
  current_amount  REAL DEFAULT 0,
  target_date     TEXT,
  status          TEXT DEFAULT 'active', -- active|achieved|cancelled
  icon            TEXT DEFAULT '🎯',
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL
);

-- ===========================
-- STRATEGIES
-- ===========================
CREATE TABLE IF NOT EXISTS strategies (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL,
  strategy_type TEXT NOT NULL,
  extra_payment REAL DEFAULT 0,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ===========================
-- BADGES
-- ===========================
CREATE TABLE IF NOT EXISTS badges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  code        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  xp_reward   INTEGER DEFAULT 50
);

CREATE TABLE IF NOT EXISTS user_badges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  badge_id    INTEGER NOT NULL,
  earned_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- ===========================
-- ALERTS
-- ===========================
CREATE TABLE IF NOT EXISTS alerts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  debt_id     INTEGER,
  type        TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL
);

-- ===========================
-- SEED DATA
-- ===========================
INSERT OR IGNORE INTO badges (code, name, description, icon, xp_reward) VALUES
  ('first_payment',  'First Blood 💸',      'จ่ายหนี้ครั้งแรกสำเร็จ!',      '💸', 100),
  ('streak_7',       'Debt Killer Lv.1 🔥', 'จ่ายตรง 7 วันติดต่อกัน',        '🔥', 200),
  ('streak_30',      'Debt Destroyer 🏆',   'จ่ายตรง 30 วันติดต่อกัน',       '🏆', 500),
  ('debt_paid',      'Debt Slayer ⚔️',      'ปิดหนี้ก้อนแรกสำเร็จ!',        '⚔️', 1000),
  ('extra_payment',  'Overachiever ⚡',     'จ่ายเกินขั้นต่ำเป็นครั้งแรก',  '⚡', 150),
  ('all_debts_paid', 'Financial Freedom 🦋','ปิดหนี้ทุกก้อนสำเร็จ!',        '🦋', 5000),
  ('avalanche_user', 'Smart Saver 🧊',      'เลือกกลยุทธ์ Avalanche',         '🧊', 100),
  ('snowball_user',  'Momentum Builder ⛄', 'เลือกกลยุทธ์ Snowball',          '⛄', 100);

-- Demo user (password: demo1234 → plain for demo)
INSERT OR IGNORE INTO users (id, name, email, password_hash, monthly_income, monthly_expense, level, xp, streak_days) VALUES
  (1, 'สมชาย ใจดี', 'demo@debthelper.app', 'demo1234', 35000, 18000, 3, 750, 12);

INSERT OR IGNORE INTO debts (user_id, name, type, term_type, creditor, principal, current_balance, interest_rate, min_payment, due_day, priority, color, term_months) VALUES
  (1, 'บัตรเครดิต KBank',      'credit_card',   'short', 'ธนาคารกสิกรไทย',    50000,  38500, 18.0, 1000, 25, 1, '#FF6B6B', 12),
  (1, 'สินเชื่อส่วนบุคคล SCB', 'personal_loan', 'long',  'ธนาคารไทยพาณิชย์', 120000, 95000, 14.5, 3500, 10, 2, '#FF9F43', 48),
  (1, 'ผ่อนมือถือ',             'other',         'short', 'Apple TH',           25000,  12000,  0.0,  700,  5, 4, '#54A0FF', 24),
  (1, 'บัตรเครดิต Citi',       'credit_card',   'short', 'Citibank',            80000,  72000, 20.0, 2000, 20, 1, '#5F27CD', 12),
  (1, 'ผ่อนรถยนต์',            'car',           'long',  'Toyota Leasing',     650000, 420000,  5.5, 9800, 15, 3, '#1dd1a1', 60);

INSERT OR IGNORE INTO assets (user_id, name, type, current_value, purchase_value, purchase_date) VALUES
  (1, 'บัญชีออมทรัพย์ KBank', 'bank',     85000,   85000, '2023-01-01'),
  (1, 'รถยนต์ Toyota Yaris',   'vehicle', 480000,  650000, '2021-06-01'),
  (1, 'กองทุนรวม LTF',         'stock',    42000,   35000, '2022-01-01'),
  (1, 'เงินสด',                'cash',     12000,   12000, '2024-01-01');

INSERT OR IGNORE INTO transactions (user_id, type, category, amount, date, note, is_recurring) VALUES
  (1, 'income',  'salary',     35000, date('now','-0 months','start of month'), 'เงินเดือน', 1),
  (1, 'expense', 'food',        6000, date('now','-0 months','start of month'), 'ค่าอาหาร', 1),
  (1, 'expense', 'transport',   2500, date('now','-0 months','start of month'), 'ค่าเดินทาง', 1),
  (1, 'expense', 'utilities',   1500, date('now','-0 months','start of month'), 'ค่าสาธารณูปโภค', 1),
  (1, 'expense', 'other',       3000, date('now','-0 months','start of month'), 'ค่าใช้จ่ายอื่นๆ', 0);

INSERT OR IGNORE INTO goals (user_id, debt_id, title, target_amount, current_amount, target_date, icon) VALUES
  (1, 1, 'ปิดบัตรเครดิต KBank', 38500, 11500, '2025-12-31', '🎯'),
  (1, NULL, 'กองทุนฉุกเฉิน 3 เดือน', 105000, 85000, '2025-06-30', '🛡️'),
  (1, 2, 'ลดหนี้ SCB ให้ต่ำกว่า 50,000', 95000, 25000, '2026-06-30', '📉');
