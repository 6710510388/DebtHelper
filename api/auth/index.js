/**
 * POST /api/auth/login   body: { email, password }
 * POST /api/auth/register body: { name, email, password, monthly_income }
 */
const { getDb, ok, fail, setCorsHeaders } = require('../_shared/db');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(context);
    context.res = { status: 204, headers: context.res.headers, body: '' };
    return;
  }

  try {
    const db = getDb();
    const action = req.params?.action || req.query?.action;
    const b = req.body || {};

    // --- REGISTER ---
    if (action === 'register') {
      if (!b.name || !b.email || !b.password)
        return fail(context, 'กรุณากรอกข้อมูลให้ครบ');

      const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(b.email);
      if (exists) return fail(context, 'อีเมลนี้ถูกใช้งานแล้ว');

      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, monthly_income)
        VALUES (?, ?, ?, ?)
      `).run(b.name, b.email, b.password, b.monthly_income || 0);

      const user = db.prepare('SELECT id,name,email,monthly_income,level,xp,streak_days FROM users WHERE id=?').get(result.lastInsertRowid);
      return ok(context, { user, token: `uid_${user.id}` });
    }

    // --- LOGIN ---
    if (action === 'login') {
      if (!b.email || !b.password)
        return fail(context, 'กรุณากรอกอีเมลและรหัสผ่าน');

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(b.email);
      if (!user || user.password_hash !== b.password)
        return fail(context, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);

      const { password_hash, ...safe } = user;
      return ok(context, { user: safe, token: `uid_${user.id}` });
    }

    fail(context, 'Unknown action', 400);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
