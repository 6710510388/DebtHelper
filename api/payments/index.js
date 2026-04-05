/**
 * GET  /api/payments?userId=1&debtId=1
 * POST /api/payments  body: { debtId, userId, amount, paid_date, note }
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
    const userId = parseInt(req.query.userId || '1');
    const debtId = req.query.debtId ? parseInt(req.query.debtId) : null;

    // --- GET ---
    if (method === 'GET') {
      const r = pool.request().input('userId', sql.Int, userId);
      let query = `
        SELECT TOP(50) p.*, d.name as debt_name, d.color, d.min_payment
        FROM payments p JOIN debts d ON d.id = p.debt_id
        WHERE p.user_id = @userId
      `;
      if (debtId) {
        r.input('debtId', sql.Int, debtId);
        query += ' AND p.debt_id = @debtId';
      }
      query += ' ORDER BY p.paid_date DESC';
      const result = await r.query(query);
      return ok(context, result.recordset);
    }

    // --- POST ---
    if (method === 'POST') {
      const b = req.body || {};
      if (!b.debtId || !b.amount || !b.paid_date)
        return fail(context, 'Missing debtId, amount, or paid_date');

      const debtResult = await pool.request()
        .input('debtId', sql.Int, b.debtId)
        .query('SELECT * FROM debts WHERE id = @debtId');
      const debt = debtResult.recordset[0];
      if (!debt) return fail(context, 'Debt not found', 404);

      const isExtra = parseFloat(b.amount) > debt.min_payment ? 1 : 0;
      const uid = b.userId || userId;

      // Insert payment
      const payInserted = await pool.request()
        .input('debtId',   sql.Int,      b.debtId)
        .input('userId',   sql.Int,      uid)
        .input('amount',   sql.Float,    b.amount)
        .input('paidDate', sql.NVarChar, b.paid_date)
        .input('note',     sql.NVarChar, b.note || '')
        .input('isExtra',  sql.Bit,      isExtra)
        .query(`
          INSERT INTO payments (debt_id, user_id, amount, paid_date, note, is_extra)
          OUTPUT INSERTED.id
          VALUES (@debtId, @userId, @amount, @paidDate, @note, @isExtra)
        `);

      const payId = payInserted.recordset[0].id;

      // Update debt balance
      const newBalance = Math.max(0, debt.current_balance - parseFloat(b.amount));
      await pool.request()
        .input('balance', sql.Float,    newBalance)
        .input('status',  sql.NVarChar, newBalance <= 0 ? 'paid' : 'active')
        .input('debtId',  sql.Int,      b.debtId)
        .query('UPDATE debts SET current_balance=@balance, status=@status, updated_at=GETDATE() WHERE id=@debtId');

      // Update user XP & streak
      const xpGain = isExtra ? 75 : 50;
      await pool.request()
        .input('xp',  sql.Int, xpGain)
        .input('uid', sql.Int, uid)
        .query('UPDATE users SET xp=xp+@xp, streak_days=streak_days+1, last_paid_at=GETDATE(), updated_at=GETDATE() WHERE id=@uid');

      // Badge: first_payment
      const badgeFirst = await pool.request()
        .query("SELECT id FROM badges WHERE code='first_payment'");
      if (badgeFirst.recordset[0]) {
        const bid = badgeFirst.recordset[0].id;
        await pool.request()
          .input('uid', sql.Int, uid)
          .input('bid', sql.Int, bid)
          .query(`IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id=@uid AND badge_id=@bid)
                  INSERT INTO user_badges (user_id, badge_id) VALUES (@uid, @bid)`);
      }

      // Badge: extra_payment
      if (isExtra) {
        const badgeExtra = await pool.request()
          .query("SELECT id FROM badges WHERE code='extra_payment'");
        if (badgeExtra.recordset[0]) {
          const bid = badgeExtra.recordset[0].id;
          await pool.request()
            .input('uid', sql.Int, uid)
            .input('bid', sql.Int, bid)
            .query(`IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id=@uid AND badge_id=@bid)
                    INSERT INTO user_badges (user_id, badge_id) VALUES (@uid, @bid)`);
        }
      }

      // Alert if debt fully paid
      if (newBalance <= 0) {
        await pool.request()
          .input('uid',     sql.Int,      uid)
          .input('debtId',  sql.Int,      b.debtId)
          .input('message', sql.NVarChar, `🎉 ยินดีด้วย! คุณปิดหนี้ "${debt.name}" สำเร็จแล้ว!`)
          .query("INSERT INTO alerts (user_id,debt_id,type,message) VALUES (@uid,@debtId,'milestone',@message)");
      }

      const payment = await pool.request()
        .input('id', sql.Int, payId)
        .query('SELECT * FROM payments WHERE id=@id');
      return ok(context, { payment: payment.recordset[0], newBalance, xpGained: xpGain });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
