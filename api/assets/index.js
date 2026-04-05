/**
 * GET    /api/assets?userId=1
 * POST   /api/assets
 * PUT    /api/assets?id=1
 * DELETE /api/assets?id=1
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
      const assets = db.prepare('SELECT * FROM assets WHERE user_id=? ORDER BY current_value DESC').all(userId);
      const totalValue = assets.reduce((s,a) => s + a.current_value, 0);
      const byType = {};
      assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.current_value; });
      return ok(context, { assets, totalValue, byType });
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.name || !b.type || b.current_value === undefined)
        return fail(context, 'Missing required fields');
      const r = db.prepare(`
        INSERT INTO assets (user_id,name,type,current_value,purchase_value,purchase_date,notes)
        VALUES (?,?,?,?,?,?,?)
      `).run(b.userId||userId, b.name, b.type, b.current_value, b.purchase_value||0, b.purchase_date||null, b.notes||'');
      return ok(context, db.prepare('SELECT * FROM assets WHERE id=?').get(r.lastInsertRowid));
    }

    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const fields = []; const vals = [];
      ['name','type','current_value','purchase_value','purchase_date','notes'].forEach(k => {
        if (b[k] !== undefined) { fields.push(`${k}=?`); vals.push(b[k]); }
      });
      if (!fields.length) return fail(context, 'Nothing to update');
      fields.push("updated_at=datetime('now')"); vals.push(id);
      db.prepare(`UPDATE assets SET ${fields.join(',')} WHERE id=?`).run(...vals);
      return ok(context, db.prepare('SELECT * FROM assets WHERE id=?').get(id));
    }

    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      db.prepare('DELETE FROM assets WHERE id=?').run(id);
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
