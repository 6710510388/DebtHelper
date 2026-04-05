/**
 * GET    /api/debts?userId=1
 * POST   /api/debts          body: { userId, name, type, ... }
 * PUT    /api/debts?id=1      body: { current_balance, ... }
 * DELETE /api/debts?id=1
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
    const method = req.method;
    const id = parseInt(req.query.id);
    const userId = parseInt(req.query.userId || '1');

    // --- GET ---
    if (method === 'GET') {
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT d.*,
            COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.debt_id = d.id), 0) as total_paid
          FROM debts d
          WHERE d.user_id = @userId
          ORDER BY d.interest_rate DESC
        `);
      return ok(context, result.recordset);
    }

    // --- POST ---
    if (method === 'POST') {
      const b = req.body || {};
      if (!b.name || !b.type || !b.current_balance || !b.interest_rate)
        return fail(context, 'Missing required fields');

      const inserted = await pool.request()
        .input('userId',     sql.Int,      b.userId || userId)
        .input('name',       sql.NVarChar, b.name)
        .input('type',       sql.NVarChar, b.type)
        .input('termType',   sql.NVarChar, b.term_type || 'short')
        .input('creditor',   sql.NVarChar, b.creditor || '')
        .input('principal',  sql.Float,    b.principal || b.current_balance)
        .input('balance',    sql.Float,    b.current_balance)
        .input('rate',       sql.Float,    b.interest_rate)
        .input('minPay',     sql.Float,    b.min_payment || 0)
        .input('dueDay',     sql.Int,      b.due_day || null)
        .input('termMonths', sql.Int,      b.term_months || null)
        .input('color',      sql.NVarChar, b.color || '#FF6B6B')
        .input('notes',      sql.NVarChar, b.notes || '')
        .query(`
          INSERT INTO debts
            (user_id, name, type, term_type, creditor, principal, current_balance, interest_rate, min_payment, due_day, term_months, color, notes)
          OUTPUT INSERTED.id
          VALUES (@userId, @name, @type, @termType, @creditor, @principal, @balance, @rate, @minPay, @dueDay, @termMonths, @color, @notes)
        `);

      const newId = inserted.recordset[0].id;
      const newDebt = await pool.request()
        .input('id', sql.Int, newId)
        .query('SELECT * FROM debts WHERE id = @id');
      return ok(context, newDebt.recordset[0]);
    }

    // --- PUT ---
    if (method === 'PUT') {
      if (!id) return fail(context, 'Missing id');
      const b = req.body || {};
      const allowed = ['name','type','term_type','creditor','current_balance','interest_rate','min_payment','due_day','term_months','color','notes','status','priority'];
      const req2 = pool.request().input('id', sql.Int, id);
      const fields = [];

      const typeMap = {
        name: sql.NVarChar, type: sql.NVarChar, term_type: sql.NVarChar,
        creditor: sql.NVarChar, color: sql.NVarChar, notes: sql.NVarChar, status: sql.NVarChar,
        current_balance: sql.Float, interest_rate: sql.Float, min_payment: sql.Float,
        due_day: sql.Int, term_months: sql.Int, priority: sql.Int
      };

      for (const key of allowed) {
        if (b[key] !== undefined) {
          const paramName = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
          req2.input(paramName, typeMap[key], b[key]);
          fields.push(`${key} = @${paramName}`);
        }
      }
      if (!fields.length) return fail(context, 'Nothing to update');
      fields.push('updated_at = GETDATE()');

      await req2.query(`UPDATE debts SET ${fields.join(', ')} WHERE id = @id`);
      const updated = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM debts WHERE id = @id');
      return ok(context, updated.recordset[0]);
    }

    // --- DELETE ---
    if (method === 'DELETE') {
      if (!id) return fail(context, 'Missing id');
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM debts WHERE id = @id');
      return ok(context, { deleted: id });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
