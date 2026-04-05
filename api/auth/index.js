/**
 * POST /api/auth/login    body: { email, password }
 * POST /api/auth/register body: { name, email, password, monthly_income }
 */
const { getPool, ok, fail, setCorsHeaders, sql } = require('../_shared/db');

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(context);
    context.res = { status: 204, headers: context.res.headers, body: '' };
    return;
  }

  try {
    const pool = await getPool();
    const action = req.params?.action || req.query?.action;
    const b = req.body || {};

    // --- REGISTER ---
    if (action === 'register') {
      if (!b.name || !b.email || !b.password)
        return fail(context, 'กรุณากรอกข้อมูลให้ครบ');

      const exists = await pool.request()
        .input('email', sql.NVarChar, b.email)
        .query('SELECT id FROM users WHERE email = @email');

      if (exists.recordset.length > 0)
        return fail(context, 'อีเมลนี้ถูกใช้งานแล้ว');

      const inserted = await pool.request()
        .input('name',    sql.NVarChar, b.name)
        .input('email',   sql.NVarChar, b.email)
        .input('password',sql.NVarChar, b.password)
        .input('income',  sql.Float,    b.monthly_income || 0)
        .query(`
          INSERT INTO users (name, email, password_hash, monthly_income)
          OUTPUT INSERTED.id
          VALUES (@name, @email, @password, @income)
        `);

      const newId = inserted.recordset[0].id;
      const user = await pool.request()
        .input('id', sql.Int, newId)
        .query('SELECT id,name,email,monthly_income,level,xp,streak_days FROM users WHERE id=@id');

      return ok(context, { user: user.recordset[0], token: `uid_${newId}` });
    }

    // --- LOGIN ---
    if (action === 'login') {
      if (!b.email || !b.password)
        return fail(context, 'กรุณากรอกอีเมลและรหัสผ่าน');

      const result = await pool.request()
        .input('email', sql.NVarChar, b.email)
        .query('SELECT * FROM users WHERE email = @email');

      const user = result.recordset[0];
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
