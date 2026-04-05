/**
 * GET    /api/goals?userId=1
 * POST   /api/goals
 * PUT    /api/goals?id=1
 * DELETE /api/goals?id=1
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
    const userId = parseInt(req.query.userId || '1');
    const id = parseInt(req.query.id);
    const method = req.method;

    if (method === 'GET') {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT g.*, d.name as debt_name, d.color as debt_color
          FROM goals g LEFT JOIN debts d ON d.id=g.debt_id
          WHERE g.user_id=@userId ORDER BY g.target_date ASC
        `);
      return ok(context, result.recordset);
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.title || !b.target_amount) return fail(context, 'Missing fields');
      const inserted = await pool.request()
        .input('userId',       sql.Int,      b.userId || userId)
        .input('debtId',       sql.Int,      b.debt_id || null)
        .input('title',        sql.NVarChar, b.title)
        .input('targetAmount', sql.Float,    b.target_amount)
        .input('currentAmt',   sql.Float,    b.current_amount || 0)
        .input('targetDate',   sql.NVarChar, b.target_date || null)
        .input('icon',         sql.NVarChar, b.icon || '🎯')
        .query(`
          INSERT INTO goals (user_id,debt_id,title,target_amount,current_amount,target_date,icon)
          OUTPUT INSERTED.id
          VALUES (@userId,@debtId,@title,@targetAmount,@currentAmt,@targetDate,@icon)
        `);
      const newId = inserted.recordset[0].id;
      const result = await pool.request()
        .input('id', sql.Int, newId)
        .query('SELECT * FROM goals WHERE id=@id');
      return ok(context, result.recordset[0]);
    }

    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const allowed = { title: sql.NVarChar, target_amount: sql.Float, current_amount: sql.Float, target_date: sql.NVarChar, status: sql.NVarChar, icon: sql.NVarChar };
      const r = pool.request().input('id', sql.Int, id);
      const fields = [];
      for (const [key, type] of Object.entries(allowed)) {
        if (b[key] !== undefined) {
          const p = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
          r.input(p, type, b[key]);
          fields.push(`${key}=@${p}`);
        }
      }
      if (!fields.length) return fail(context, 'Nothing to update');
      await r.query(`UPDATE goals SET ${fields.join(',')} WHERE id=@id`);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM goals WHERE id=@id');
      return ok(context, result.recordset[0]);
    }

    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      await pool.request().input('id', sql.Int, id).query('DELETE FROM goals WHERE id=@id');
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
