/**
 * GET /api/alerts?userId=1
 * PUT /api/alerts?id=1
 * PUT /api/alerts?action=readAll&userId=1
 */
const { getPool, ok, fail, setCorsHeaders, sql } = require('../_shared/db');

async function generateAlerts(pool, userId) {
  const debtsResult = await pool.request()
    .input('userId', sql.Int, userId)
    .query("SELECT * FROM debts WHERE user_id=@userId AND status='active'");
  const debts = debtsResult.recordset;
  const today = new Date();
  const todayDay = today.getDate();

  for (const d of debts) {
    if (d.due_day) {
      const daysUntilDue = d.due_day >= todayDay
        ? d.due_day - todayDay
        : (new Date(today.getFullYear(), today.getMonth() + 1, d.due_day) - today) / 86400000;

      if (daysUntilDue <= 5 && daysUntilDue >= 0) {
        const type = daysUntilDue <= 1 ? 'overdue' : 'due_soon';
        const msg = daysUntilDue === 0
          ? `💸 ${d.name} ครบกำหนดชำระวันนี้! ยอด ${d.min_payment.toLocaleString('th-TH')} บาท`
          : `⏰ ${d.name} ครบกำหนดชำระในอีก ${Math.round(daysUntilDue)} วัน (${d.min_payment.toLocaleString('th-TH')} บาท)`;

        const exists = await pool.request()
          .input('uid',    sql.Int,      userId)
          .input('debtId', sql.Int,      d.id)
          .input('type',   sql.NVarChar, type)
          .query(`SELECT id FROM alerts WHERE user_id=@uid AND debt_id=@debtId AND type=@type
                  AND CAST(created_at AS DATE)=CAST(GETDATE() AS DATE)`);

        if (!exists.recordset[0]) {
          await pool.request()
            .input('uid',    sql.Int,      userId)
            .input('debtId', sql.Int,      d.id)
            .input('type',   sql.NVarChar, type)
            .input('msg',    sql.NVarChar, msg)
            .query('INSERT INTO alerts (user_id,debt_id,type,message) VALUES (@uid,@debtId,@type,@msg)');
        }
      }
    }

    if (d.interest_rate >= 18) {
      const exists = await pool.request()
        .input('uid',    sql.Int,      userId)
        .input('debtId', sql.Int,      d.id)
        .query(`SELECT id FROM alerts WHERE user_id=@uid AND debt_id=@debtId AND type='high_interest'
                AND created_at >= DATEADD(day,-7,GETDATE())`);

      if (!exists.recordset[0]) {
        await pool.request()
          .input('uid',    sql.Int,      userId)
          .input('debtId', sql.Int,      d.id)
          .input('msg',    sql.NVarChar, `⚠️ ${d.name} มีดอกเบี้ย ${d.interest_rate}% ต่อปี — พิจารณาปิดก่อน!`)
          .query("INSERT INTO alerts (user_id,debt_id,type,message) VALUES (@uid,@debtId,'high_interest',@msg)");
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
    const pool = await getPool();
    const userId = parseInt(req.query.userId || '1');
    const id = parseInt(req.query.id);
    const action = req.query.action;

    if (req.method === 'GET') {
      await generateAlerts(pool, userId);
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT TOP(50) a.*, d.name as debt_name FROM alerts a
          LEFT JOIN debts d ON d.id=a.debt_id
          WHERE a.user_id=@userId
          ORDER BY a.is_read ASC, a.created_at DESC
        `);
      return ok(context, result.recordset);
    }

    if (req.method === 'PUT') {
      if (action === 'readAll') {
        await pool.request()
          .input('userId', sql.Int, userId)
          .query('UPDATE alerts SET is_read=1 WHERE user_id=@userId');
        return ok(context, { updated: true });
      }
      if (id) {
        await pool.request()
          .input('id', sql.Int, id)
          .query('UPDATE alerts SET is_read=1 WHERE id=@id');
        const result = await pool.request()
          .input('id', sql.Int, id)
          .query('SELECT * FROM alerts WHERE id=@id');
        return ok(context, result.recordset[0]);
      }
      return fail(context, 'Missing id or action');
    }

    fail(context, 'Method not allowed', 405);
  } catch (e) {
    fail(context, e.message, 500);
  }
};
