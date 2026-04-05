/**
 * GET    /api/assets?userId=1
 * POST   /api/assets
 * PUT    /api/assets?id=1
 * DELETE /api/assets?id=1
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
        .query('SELECT * FROM assets WHERE user_id=@userId ORDER BY current_value DESC');
      const assets = result.recordset;
      const totalValue = assets.reduce((s, a) => s + a.current_value, 0);
      const byType = {};
      assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.current_value; });
      return ok(context, { assets, totalValue, byType });
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.name || !b.type || b.current_value === undefined)
        return fail(context, 'Missing required fields');
      const inserted = await pool.request()
        .input('userId',        sql.Int,      b.userId || userId)
        .input('name',          sql.NVarChar, b.name)
        .input('type',          sql.NVarChar, b.type)
        .input('currentValue',  sql.Float,    b.current_value)
        .input('purchaseValue', sql.Float,    b.purchase_value || 0)
        .input('purchaseDate',  sql.NVarChar, b.purchase_date || null)
        .input('notes',         sql.NVarChar, b.notes || '')
        .query(`
          INSERT INTO assets (user_id,name,type,current_value,purchase_value,purchase_date,notes)
          OUTPUT INSERTED.id
          VALUES (@userId,@name,@type,@currentValue,@purchaseValue,@purchaseDate,@notes)
        `);
      const newId = inserted.recordset[0].id;
      const result = await pool.request()
        .input('id', sql.Int, newId)
        .query('SELECT * FROM assets WHERE id=@id');
      return ok(context, result.recordset[0]);
    }

    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const allowed = { name: sql.NVarChar, type: sql.NVarChar, current_value: sql.Float, purchase_value: sql.Float, purchase_date: sql.NVarChar, notes: sql.NVarChar };
      const r = pool.request().input('id', sql.Int, id);
      const fields = ['updated_at=GETDATE()'];
      for (const [key, type] of Object.entries(allowed)) {
        if (b[key] !== undefined) {
          const p = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
          r.input(p, type, b[key]);
          fields.push(`${key}=@${p}`);
        }
      }
      if (fields.length === 1) return fail(context, 'Nothing to update');
      await r.query(`UPDATE assets SET ${fields.join(',')} WHERE id=@id`);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM assets WHERE id=@id');
      return ok(context, result.recordset[0]);
    }

    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      await pool.request().input('id', sql.Int, id).query('DELETE FROM assets WHERE id=@id');
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
