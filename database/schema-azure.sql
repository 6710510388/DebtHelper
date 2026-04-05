-- DebtHelper Azure SQL Schema
-- Run this script in Azure SQL Database (Query editor or SSMS)

-- USERS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
CREATE TABLE users (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  name            NVARCHAR(255) NOT NULL,
  email           NVARCHAR(255) NOT NULL UNIQUE,
  password_hash   NVARCHAR(255) NOT NULL DEFAULT '',
  avatar_url      NVARCHAR(500),
  monthly_income  FLOAT DEFAULT 0,
  monthly_expense FLOAT DEFAULT 0,
  level           INT DEFAULT 1,
  xp              INT DEFAULT 0,
  streak_days     INT DEFAULT 0,
  last_paid_at    NVARCHAR(50),
  created_at      DATETIME DEFAULT GETDATE(),
  updated_at      DATETIME DEFAULT GETDATE()
);

-- DEBTS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='debts' AND xtype='U')
CREATE TABLE debts (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  user_id         INT NOT NULL,
  name            NVARCHAR(255) NOT NULL,
  type            NVARCHAR(50) NOT NULL,
  term_type       NVARCHAR(20) DEFAULT 'short',
  creditor        NVARCHAR(255),
  principal       FLOAT NOT NULL,
  current_balance FLOAT NOT NULL,
  interest_rate   FLOAT NOT NULL,
  min_payment     FLOAT NOT NULL,
  due_day         INT,
  start_date      NVARCHAR(20),
  term_months     INT,
  priority        INT DEFAULT 3,
  status          NVARCHAR(20) DEFAULT 'active',
  color           NVARCHAR(20) DEFAULT '#FF6B6B',
  notes           NVARCHAR(MAX),
  created_at      DATETIME DEFAULT GETDATE(),
  updated_at      DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PAYMENTS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='payments' AND xtype='U')
CREATE TABLE payments (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  debt_id     INT NOT NULL,
  user_id     INT NOT NULL,
  amount      FLOAT NOT NULL,
  paid_date   NVARCHAR(20) NOT NULL,
  note        NVARCHAR(MAX),
  is_extra    BIT DEFAULT 0,
  created_at  DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE NO ACTION,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
);

-- TRANSACTIONS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='transactions' AND xtype='U')
CREATE TABLE transactions (
  id           INT IDENTITY(1,1) PRIMARY KEY,
  user_id      INT NOT NULL,
  type         NVARCHAR(20) NOT NULL,
  category     NVARCHAR(100) NOT NULL,
  amount       FLOAT NOT NULL,
  date         NVARCHAR(20) NOT NULL,
  note         NVARCHAR(MAX),
  is_recurring BIT DEFAULT 0,
  created_at   DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ASSETS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='assets' AND xtype='U')
CREATE TABLE assets (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  user_id         INT NOT NULL,
  name            NVARCHAR(255) NOT NULL,
  type            NVARCHAR(50) NOT NULL,
  current_value   FLOAT NOT NULL,
  purchase_value  FLOAT DEFAULT 0,
  purchase_date   NVARCHAR(20),
  notes           NVARCHAR(MAX),
  created_at      DATETIME DEFAULT GETDATE(),
  updated_at      DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- GOALS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='goals' AND xtype='U')
CREATE TABLE goals (
  id              INT IDENTITY(1,1) PRIMARY KEY,
  user_id         INT NOT NULL,
  debt_id         INT,
  title           NVARCHAR(255) NOT NULL,
  target_amount   FLOAT NOT NULL,
  current_amount  FLOAT DEFAULT 0,
  target_date     NVARCHAR(20),
  status          NVARCHAR(20) DEFAULT 'active',
  icon            NVARCHAR(10) DEFAULT '🎯',
  created_at      DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- BADGES
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='badges' AND xtype='U')
CREATE TABLE badges (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  code        NVARCHAR(50) NOT NULL UNIQUE,
  name        NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  icon        NVARCHAR(10),
  xp_reward   INT DEFAULT 50
);

-- USER_BADGES
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_badges' AND xtype='U')
CREATE TABLE user_badges (
  id        INT IDENTITY(1,1) PRIMARY KEY,
  user_id   INT NOT NULL,
  badge_id  INT NOT NULL,
  earned_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT UQ_user_badges UNIQUE (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id)
);

-- ALERTS
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='alerts' AND xtype='U')
CREATE TABLE alerts (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  user_id    INT NOT NULL,
  debt_id    INT,
  type       NVARCHAR(50) NOT NULL,
  message    NVARCHAR(MAX) NOT NULL,
  is_read    BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================
-- SEED DATA
-- =====================
IF NOT EXISTS (SELECT 1 FROM badges WHERE code='first_payment')
BEGIN
  INSERT INTO badges (code,name,description,icon,xp_reward) VALUES
    ('first_payment',  'First Blood 💸',       'จ่ายหนี้ครั้งแรกสำเร็จ!',      '💸', 100),
    ('streak_7',       'Debt Killer Lv.1 🔥',  'จ่ายตรง 7 วันติดต่อกัน',        '🔥', 200),
    ('streak_30',      'Debt Destroyer 🏆',    'จ่ายตรง 30 วันติดต่อกัน',       '🏆', 500),
    ('debt_paid',      'Debt Slayer',           'ปิดหนี้ก้อนแรกสำเร็จ!',         '⚔',  1000),
    ('extra_payment',  'Overachiever',          'จ่ายเกินขั้นต่ำเป็นครั้งแรก',  '⚡', 150),
    ('all_debts_paid', 'Financial Freedom',     'ปิดหนี้ทุกก้อนสำเร็จ!',         '🦋', 5000),
    ('avalanche_user', 'Smart Saver',           'เลือกกลยุทธ์ Avalanche',         '🧊', 100),
    ('snowball_user',  'Momentum Builder',      'เลือกกลยุทธ์ Snowball',           '⛄', 100);
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email='demo@debthelper.app')
BEGIN
  SET IDENTITY_INSERT users ON;
  INSERT INTO users (id,name,email,password_hash,monthly_income,monthly_expense,level,xp,streak_days)
    VALUES (1,'สมชาย ใจดี','demo@debthelper.app','demo1234',35000,18000,3,750,12);
  SET IDENTITY_INSERT users OFF;

  INSERT INTO debts (user_id,name,type,term_type,creditor,principal,current_balance,interest_rate,min_payment,due_day,priority,color,term_months) VALUES
    (1,'บัตรเครดิต KBank','credit_card','short','ธนาคารกสิกรไทย',50000,38500,18.0,1000,25,1,'#FF6B6B',12),
    (1,'สินเชื่อส่วนบุคคล SCB','personal_loan','long','ธนาคารไทยพาณิชย์',120000,95000,14.5,3500,10,2,'#FF9F43',48),
    (1,'ผ่อนมือถือ','other','short','Apple TH',25000,12000,0.0,700,5,4,'#54A0FF',24),
    (1,'บัตรเครดิต Citi','credit_card','short','Citibank',80000,72000,20.0,2000,20,1,'#5F27CD',12),
    (1,'ผ่อนรถยนต์','car','long','Toyota Leasing',650000,420000,5.5,9800,15,3,'#1dd1a1',60);

  INSERT INTO assets (user_id,name,type,current_value,purchase_value,purchase_date) VALUES
    (1,'บัญชีออมทรัพย์ KBank','bank',85000,85000,'2023-01-01'),
    (1,'รถยนต์ Toyota Yaris','vehicle',480000,650000,'2021-06-01'),
    (1,'กองทุนรวม LTF','stock',42000,35000,'2022-01-01'),
    (1,'เงินสด','cash',12000,12000,'2024-01-01');

  DECLARE @today NVARCHAR(10) = CONVERT(NVARCHAR(10), GETDATE(), 23);
  INSERT INTO transactions (user_id,type,category,amount,date,note,is_recurring) VALUES
    (1,'income','salary',35000,@today,'เงินเดือน',1),
    (1,'expense','food',6000,@today,'ค่าอาหาร',1),
    (1,'expense','transport',2500,@today,'ค่าเดินทาง',1),
    (1,'expense','utilities',1500,@today,'ค่าสาธารณูปโภค',1),
    (1,'expense','other',3000,@today,'ค่าใช้จ่ายอื่นๆ',0);

  INSERT INTO goals (user_id,debt_id,title,target_amount,current_amount,target_date,icon) VALUES
    (1,1,'ปิดบัตรเครดิต KBank',38500,11500,'2025-12-31','🎯'),
    (1,NULL,'กองทุนฉุกเฉิน 3 เดือน',105000,85000,'2025-06-30','🛡️'),
    (1,2,'ลดหนี้ SCB ให้ต่ำกว่า 50,000',95000,25000,'2026-06-30','📉');
END
