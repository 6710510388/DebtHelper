/**
 * GET /api/dashboard?userId=1
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

    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT * FROM users WHERE id=@userId');
    const user = userResult.recordset[0];
    if (!user) return fail(context, 'User not found', 404);

    const debtsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query("SELECT * FROM debts WHERE user_id=@userId AND status='active' ORDER BY interest_rate DESC");
    const debts = debtsResult.recordset;

    const totalDebt      = debts.reduce((s, d) => s + d.current_balance, 0);
    const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0);
    const totalMin       = debts.reduce((s, d) => s + d.min_payment, 0);
    const paidPercent    = totalPrincipal > 0
      ? Math.round(((totalPrincipal - totalDebt) / totalPrincipal) * 100) : 0;

    // Monthly transactions summary
    const currentMonth = new Date().toISOString().slice(0, 7);
    const txResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('month',  sql.NVarChar, `${currentMonth}%`)
      .query(`SELECT type, SUM(amount) as total FROM transactions WHERE user_id=@userId AND date LIKE @month GROUP BY type`);
    const txRows = txResult.recordset;
    const monthlyIncome  = txRows.find(r => r.type === 'income')?.total  || user.monthly_income  || 0;
    const monthlyExpense = txRows.find(r => r.type === 'expense')?.total || user.monthly_expense || 0;

    // Recent payments
    const recentResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP(5) p.*, d.name as debt_name, d.color
        FROM payments p JOIN debts d ON d.id=p.debt_id
        WHERE p.user_id=@userId ORDER BY p.paid_date DESC
      `);
    const recentPayments = recentResult.recordset;

    // Auto-generate due-soon alerts
    const today = new Date();
    for (const d of debts) {
      if (d.due_day) {
        const todayDay = today.getDate();
        let daysLeft = d.due_day >= todayDay
          ? d.due_day - todayDay
          : Math.round((new Date(today.getFullYear(), today.getMonth() + 1, d.due_day) - today) / 86400000);

        if (daysLeft <= 5 && daysLeft >= 0) {
          const type = daysLeft <= 1 ? 'overdue' : 'due_soon';
          const msg = daysLeft === 0
            ? `💸 ${d.name} ครบกำหนดวันนี้!`
            : `⏰ ${d.name} ครบกำหนดในอีก ${daysLeft} วัน`;

          const existsResult = await pool.request()
            .input('uid',    sql.Int,      userId)
            .input('debtId', sql.Int,      d.id)
            .input('type',   sql.NVarChar, type)
            .query(`SELECT id FROM alerts WHERE user_id=@uid AND debt_id=@debtId AND type=@type
                    AND CAST(created_at AS DATE)=CAST(GETDATE() AS DATE)`);

          if (!existsResult.recordset[0]) {
            await pool.request()
              .input('uid',    sql.Int,      userId)
              .input('debtId', sql.Int,      d.id)
              .input('type',   sql.NVarChar, type)
              .input('msg',    sql.NVarChar, msg)
              .query('INSERT INTO alerts (user_id,debt_id,type,message) VALUES (@uid,@debtId,@type,@msg)');
          }
        }
      }
    }

    // Unread alerts
    const alertsResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP(10) a.*, d.name as debt_name FROM alerts a
        LEFT JOIN debts d ON d.id=a.debt_id
        WHERE a.user_id=@userId AND a.is_read=0
        ORDER BY a.created_at DESC
      `);
    const alerts = alertsResult.recordset;

    // Badges
    const badgesResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT b.*, ub.earned_at FROM user_badges ub
        JOIN badges b ON b.id=ub.badge_id
        WHERE ub.user_id=@userId ORDER BY ub.earned_at DESC
      `);
    const badges = badgesResult.recordset;

    ok(context, {
      user: { ...user, monthly_income: monthlyIncome, monthly_expense: monthlyExpense },
      summary: {
        totalDebt, totalPrincipal, totalMin, paidPercent,
        debtCount: debts.length,
        highInterestCount: debts.filter(d => d.interest_rate >= 18).length,
        monthlyIncome, monthlyExpense,
        debtToIncomeRatio: monthlyIncome > 0 ? Math.round((totalMin / monthlyIncome) * 100) : 0
      },
      debts, recentPayments, alerts, badges
    });
  } catch (e) {
    fail(context, e.message, 500);
  }
};
