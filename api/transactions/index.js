/**
 * GET    /api/transactions?userId=1&month=2025-04
 * POST   /api/transactions  body: { userId, type, category, amount, date, note }
 * DELETE /api/transactions?id=1
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
    const method = req.method;

    if (method === 'GET') {
      const month = req.query.month;
      const r = pool.request().input('userId', sql.Int, userId);
      let query = 'SELECT TOP(100) * FROM transactions WHERE user_id=@userId';
      if (month) {
        r.input('month', sql.NVarChar, `${month}%`);
        query += ' AND date LIKE @month';
      }
      query += ' ORDER BY date DESC';
      const result = await r.query(query);
      const rows = result.recordset;

      const income  = rows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
      const expense = rows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
      const byCategory = {};
      rows.forEach(r => {
        if (!byCategory[r.category]) byCategory[r.category] = { type: r.type, amount: 0 };
        byCategory[r.category].amount += r.amount;
      });
      return ok(context, { transactions: rows, summary: { income, expense, net: income - expense }, byCategory });
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.type || !b.category || !b.amount || !b.date)
        return fail(context, 'Missing required fields');
      const inserted = await pool.request()
        .input('userId',      sql.Int,      b.userId || userId)
        .input('type',        sql.NVarChar, b.type)
        .input('category',    sql.NVarChar, b.category)
        .input('amount',      sql.Float,    b.amount)
        .input('date',        sql.NVarChar, b.date)
        .input('note',        sql.NVarChar, b.note || '')
        .input('isRecurring', sql.Bit,      b.is_recurring ? 1 : 0)
        .query(`
          INSERT INTO transactions (user_id,type,category,amount,date,note,is_recurring)
          OUTPUT INSERTED.id
          VALUES (@userId,@type,@category,@amount,@date,@note,@isRecurring)
        `);
      const newId = inserted.recordset[0].id;
      const result = await pool.request()
        .input('id', sql.Int, newId)
        .query('SELECT * FROM transactions WHERE id=@id');
      return ok(context, result.recordset[0]);
    }

    if (method === 'DELETE') {
      const id = parseInt(req.query.id);
      if (!id) return fail(context, 'Missing id');
      await pool.request().input('id', sql.Int, id).query('DELETE FROM transactions WHERE id=@id');
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
