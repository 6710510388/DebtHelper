/**
 * GET /api/alerts?userId=1           — ดึง alerts ทั้งหมด (พร้อม auto-generate จากหนี้ใกล้ครบ)
 * PUT /api/alerts?id=1               — mark as read
 * PUT /api/alerts?action=readAll&userId=1 — mark all as read
 */
const { getDb, ok, fail, setCorsHeaders } = require('../_shared/db');

function generateAlerts(db, userId) {
  const debts = db.prepare(`SELECT * FROM debts WHERE user_id=? AND status='active'`).all(userId);
  const today = new Date();
  const todayDay = today.getDate();

  for (const d of debts) {
    // Due soon alert (within 5 days)
    if (d.due_day) {
      const daysUntilDue = d.due_day >= todayDay
        ? d.due_day - todayDay
        : (new Date(today.getFullYear(), today.getMonth() + 1, d.due_day) - today) / 86400000;

      if (daysUntilDue <= 5 && daysUntilDue >= 0) {
        const type = daysUntilDue <= 1 ? 'overdue' : 'due_soon';
        const msg = daysUntilDue === 0
          ? `💸 ${d.name} ครบกำหนดชำระวันนี้! ยอด ${d.min_payment.toLocaleString('th-TH')} บาท`
          : `⏰ ${d.name} ครบกำหนดชำระในอีก ${Math.round(daysUntilDue)} วัน (${d.min_payment.toLocaleString('th-TH')} บาท)`;

        const exists = db.prepare(`
          SELECT id FROM alerts WHERE user_id=? AND debt_id=? AND type=? 
          AND date(created_at) = date('now')
        `).get(userId, d.id, type);

        if (!exists) {
          db.prepare(`INSERT INTO alerts (user_id, debt_id, type, message) VALUES (?,?,?,?)`)
            .run(userId, d.id, type, msg);
        }
      }
    }

    // High interest alert (once per week)
    if (d.interest_rate >= 18) {
      const exists = db.prepare(`
        SELECT id FROM alerts WHERE user_id=? AND debt_id=? AND type='high_interest'
        AND created_at >= datetime('now', '-7 days')
      `).get(userId, d.id);

      if (!exists) {
        db.prepare(`INSERT INTO alerts (user_id, debt_id, type, message) VALUES (?,?,?,?)`)
          .run(userId, d.id, 'high_interest',
            `⚠️ ${d.name} มีดอกเบี้ย ${d.interest_rate}% ต่อปี — พิจารณาปิดก่อน!`);
      }
    }
  }
}

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
    const action = req.query.action;

    if (req.method === 'GET') {
      // Auto-generate alerts from current debt state
      generateAlerts(db, userId);

      const alerts = db.prepare(`
        SELECT a.*, d.name as debt_name FROM alerts a
        LEFT JOIN debts d ON d.id = a.debt_id
        WHERE a.user_id = ?
        ORDER BY a.is_read ASC, a.created_at DESC
        LIMIT 50
      `).all(userId);

      return ok(context, alerts);
    }

    if (req.method === 'PUT') {
      if (action === 'readAll') {
        db.prepare(`UPDATE alerts SET is_read=1 WHERE user_id=?`).run(userId);
        return ok(context, { updated: true });
      }
      if (id) {
        db.prepare(`UPDATE alerts SET is_read=1 WHERE id=?`).run(id);
        return ok(context, db.prepare('SELECT * FROM alerts WHERE id=?').get(id));
      }
      return fail(context, 'Missing id or action');
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
