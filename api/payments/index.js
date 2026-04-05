/**
 * GET  /api/payments?userId=1&debtId=1
 * POST /api/payments  body: { debtId, userId, amount, paid_date, note }
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
    const userId = parseInt(req.query.userId || '1');
    const debtId = req.query.debtId ? parseInt(req.query.debtId) : null;

    if (method === 'GET') {
      let query = `
        SELECT p.*, d.name as debt_name, d.color, d.min_payment
        FROM payments p JOIN debts d ON d.id = p.debt_id
        WHERE p.user_id = ?
      `;
      const params = [userId];
      if (debtId) { query += ' AND p.debt_id = ?'; params.push(debtId); }
      query += ' ORDER BY p.paid_date DESC LIMIT 50';
      return ok(context, db.prepare(query).all(...params));
    }

    if (method === 'POST') {
      const b = req.body || {};
      if (!b.debtId || !b.amount || !b.paid_date) {
        return fail(context, 'Missing debtId, amount, or paid_date');
      }

      const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(b.debtId);
      if (!debt) return fail(context, 'Debt not found', 404);

      const isExtra = parseFloat(b.amount) > debt.min_payment ? 1 : 0;

      // Insert payment
      const result = db.prepare(`
        INSERT INTO payments (debt_id, user_id, amount, paid_date, note, is_extra)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(b.debtId, b.userId || userId, b.amount, b.paid_date, b.note || '', isExtra);

      // Update debt balance
      const newBalance = Math.max(0, debt.current_balance - parseFloat(b.amount));
      db.prepare(`
        UPDATE debts SET current_balance = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newBalance, newBalance <= 0 ? 'paid' : 'active', b.debtId);

      // Update user streak & XP
      const xpGain = isExtra ? 75 : 50;
      db.prepare(`
        UPDATE users SET
          xp = xp + ?,
          streak_days = streak_days + 1,
          last_paid_at = datetime('now'),
          updated_at = datetime('now')
        WHERE id = ?
      `).run(xpGain, b.userId || userId);

      // Award first_payment badge if needed
      const badgeFirst = db.prepare("SELECT id FROM badges WHERE code = 'first_payment'").get();
      if (badgeFirst) {
        db.prepare(`
          INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)
        `).run(b.userId || userId, badgeFirst.id);
      }

      // Award extra_payment badge
      if (isExtra) {
        const badgeExtra = db.prepare("SELECT id FROM badges WHERE code = 'extra_payment'").get();
        if (badgeExtra) {
          db.prepare(`INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)`).run(b.userId || userId, badgeExtra.id);
        }
      }

      // Alert if debt fully paid
      if (newBalance <= 0) {
        db.prepare(`
          INSERT INTO alerts (user_id, debt_id, type, message)
          VALUES (?, ?, 'milestone', ?)
        `).run(b.userId || userId, b.debtId, `🎉 ยินดีด้วย! คุณปิดหนี้ "${debt.name}" สำเร็จแล้ว!`);
      }

      const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
      return ok(context, { payment, newBalance, xpGained: xpGain });
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
