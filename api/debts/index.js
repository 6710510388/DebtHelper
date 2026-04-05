/**
 * GET    /api/debts?userId=1
 * POST   /api/debts          body: { userId, name, type, ... }
 * PUT    /api/debts?id=1      body: { current_balance, ... }
 * DELETE /api/debts?id=1
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
    const method = req.method;
    const id = parseInt(req.query.id);
    const userId = parseInt(req.query.userId || '1');

    if (method === 'GET') {
      const debts = db.prepare(`
        SELECT d.*,
          COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.debt_id = d.id), 0) as total_paid
        FROM debts d
        WHERE d.user_id = ?
        ORDER BY d.interest_rate DESC
      `).all(userId);
      return ok(context, debts);
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.name || !b.type || !b.current_balance || !b.interest_rate) {
        return fail(context, 'Missing required fields');
      }
      const stmt = db.prepare(`
        INSERT INTO debts
          (user_id, name, type, term_type, creditor, principal, current_balance, interest_rate, min_payment, due_day, term_months, color, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        b.userId || userId,
        b.name, b.type,
        b.term_type || 'short',
        b.creditor || '',
        b.principal || b.current_balance,
        b.current_balance,
        b.interest_rate,
        b.min_payment || 0,
        b.due_day || null,
        b.term_months || null,
        b.color || '#FF6B6B',
        b.notes || ''
      );
      const newDebt = db.prepare('SELECT * FROM debts WHERE id = ?').get(result.lastInsertRowid);
      return ok(context, newDebt);
    }

    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const fields = [];
      const values = [];
      const allowed = ['name','type','term_type','creditor','current_balance','interest_rate','min_payment','due_day','term_months','color','notes','status','priority'];
      for (const key of allowed) {
        if (b[key] !== undefined) { fields.push(`${key} = ?`); values.push(b[key]); }
      }
      if (!fields.length) return fail(context, 'Nothing to update');
      fields.push("updated_at = datetime('now')");
      values.push(id);
      db.prepare(`UPDATE debts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
      return ok(context, updated);
    }

    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      db.prepare('DELETE FROM debts WHERE id = ?').run(id);
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
