/**
 * GET    /api/goals?userId=1
 * POST   /api/goals
 * PUT    /api/goals?id=1
 * DELETE /api/goals?id=1
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
    const id = parseInt(req.query.id);
    const method = req.method;

    if (method === 'GET') {
      const goals = db.prepare(`
        SELECT g.*, d.name as debt_name, d.color as debt_color
        FROM goals g LEFT JOIN debts d ON d.id = g.debt_id
        WHERE g.user_id=? ORDER BY g.target_date ASC
      `).all(userId);
      return ok(context, goals);
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.title || !b.target_amount) return fail(context, 'Missing fields');
      const r = db.prepare(`
        INSERT INTO goals (user_id,debt_id,title,target_amount,current_amount,target_date,icon)
        VALUES (?,?,?,?,?,?,?)
      `).run(b.userId||userId, b.debt_id||null, b.title, b.target_amount, b.current_amount||0, b.target_date||null, b.icon||'🎯');
      return ok(context, db.prepare('SELECT * FROM goals WHERE id=?').get(r.lastInsertRowid));
    }

    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const fields = []; const vals = [];
      ['title','target_amount','current_amount','target_date','status','icon'].forEach(k => {
        if (b[k] !== undefined) { fields.push(`${k}=?`); vals.push(b[k]); }
      });
      if (!fields.length) return fail(context, 'Nothing to update');
      vals.push(id);
      db.prepare(`UPDATE goals SET ${fields.join(',')} WHERE id=?`).run(...vals);
      return ok(context, db.prepare('SELECT * FROM goals WHERE id=?').get(id));
    }

    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      db.prepare('DELETE FROM goals WHERE id=?').run(id);
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
