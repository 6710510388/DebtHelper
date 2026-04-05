/**
 * GET  /api/transactions?userId=1&month=2025-04
 * POST /api/transactions  body: { userId, type, category, amount, date, note }
 * DELETE /api/transactions?id=1
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
    const userId = parseInt(req.query.userId || '1');
    const method = req.method;

    if (method === 'GET') {
      const month = req.query.month; // e.g. "2025-04"
      let query = `SELECT * FROM transactions WHERE user_id = ?`;
      const params = [userId];
      if (month) { query += ` AND date LIKE ?`; params.push(`${month}%`); }
      query += ` ORDER BY date DESC LIMIT 100`;
      const rows = db.prepare(query).all(...params);

      // Summary
      const income  = rows.filter(r => r.type === 'income').reduce((s,r) => s + r.amount, 0);
      const expense = rows.filter(r => r.type === 'expense').reduce((s,r) => s + r.amount, 0);

      // Category breakdown
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
      const result = db.prepare(`
        INSERT INTO transactions (user_id, type, category, amount, date, note, is_recurring)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(b.userId || userId, b.type, b.category, b.amount, b.date, b.note || '', b.is_recurring ? 1 : 0);
      return ok(context, db.prepare('SELECT * FROM transactions WHERE id=?').get(result.lastInsertRowid));
    }

    if (method === 'DELETE') {
      const id = parseInt(req.query.id);
      if (!id) return fail(context, 'Missing id');
      db.prepare('DELETE FROM transactions WHERE id=?').run(id);
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
