/**
 * GET /api/dashboard?userId=1
 * Returns full summary: debts, assets, transactions, alerts, badges, streak
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

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return fail(context, 'User not found', 404);

    const debts = db.prepare(`
      SELECT * FROM debts WHERE user_id = ? AND status = 'active' ORDER BY interest_rate DESC
    `).all(userId);

    const totalDebt      = debts.reduce((s, d) => s + d.current_balance, 0);
    const totalPrincipal = debts.reduce((s, d) => s + d.principal, 0);
    const totalMin       = debts.reduce((s, d) => s + d.min_payment, 0);
    const paidPercent    = totalPrincipal > 0
      ? Math.round(((totalPrincipal - totalDebt) / totalPrincipal) * 100)
      : 0;

    // Monthly transactions summary (current month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const txRows = db.prepare(`
      SELECT type, SUM(amount) as total FROM transactions
      WHERE user_id=? AND date LIKE ? GROUP BY type
    `).all(userId, `${currentMonth}%`);
    const monthlyIncome  = txRows.find(r => r.type === 'income')?.total  || user.monthly_income  || 0;
    const monthlyExpense = txRows.find(r => r.type === 'expense')?.total || user.monthly_expense || 0;

    // Recent payments
    const recentPayments = db.prepare(`
      SELECT p.*, d.name as debt_name, d.color
      FROM payments p JOIN debts d ON d.id = p.debt_id
      WHERE p.user_id = ?
      ORDER BY p.paid_date DESC LIMIT 5
    `).all(userId);

    // Unread alerts (auto-generate due soon)
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
          const exists = db.prepare(`SELECT id FROM alerts WHERE user_id=? AND debt_id=? AND type=? AND date(created_at)=date('now')`).get(userId, d.id, type);
          if (!exists) db.prepare(`INSERT INTO alerts (user_id,debt_id,type,message) VALUES (?,?,?,?)`).run(userId, d.id, type, msg);
        }
      }
    }

    const alerts = db.prepare(`
      SELECT a.*, d.name as debt_name FROM alerts a
      LEFT JOIN debts d ON d.id = a.debt_id
      WHERE a.user_id = ? AND a.is_read = 0
      ORDER BY a.created_at DESC LIMIT 10
    `).all(userId);

    // Badges
    const badges = db.prepare(`
      SELECT b.*, ub.earned_at FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ? ORDER BY ub.earned_at DESC
    `).all(userId);

    const highInterest = debts.filter(d => d.interest_rate >= 18);

    ok(context, {
      user: { ...user, monthly_income: monthlyIncome, monthly_expense: monthlyExpense },
      summary: {
        totalDebt,
        totalPrincipal,
        totalMin,
        paidPercent,
        debtCount: debts.length,
        highInterestCount: highInterest.length,
        monthlyIncome,
        monthlyExpense,
        debtToIncomeRatio: monthlyIncome > 0 ? Math.round((totalMin / monthlyIncome) * 100) : 0
      },
      debts,
      recentPayments,
      alerts,
      badges
    });
  } catch (e) {
    fail(context, e.message, 500);
  }
};
