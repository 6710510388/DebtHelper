/**
 * POST /api/strategy
 * Body: { debts: [...], extraPayment: 1000, strategy: 'snowball'|'avalanche' }
 * Returns: month-by-month payoff plan + comparison
 */
const { ok, fail, setCorsHeaders } = require('../_shared/db');

function simulatePayoff(debts, extraPayment, strategy) {
  // Sort debts by strategy
  let sorted = [...debts].filter(d => d.current_balance > 0);
  if (strategy === 'snowball') {
    sorted.sort((a, b) => a.current_balance - b.current_balance);
  } else {
    sorted.sort((a, b) => b.interest_rate - a.interest_rate);
  }

  // Deep clone balances
  let balances = sorted.map(d => ({ ...d, balance: d.current_balance }));
  let months = 0;
  let totalInterestPaid = 0;
  const timeline = [];
  const MAX_MONTHS = 360;

  while (balances.some(d => d.balance > 0) && months < MAX_MONTHS) {
    months++;
    let extra = extraPayment;
    const snapshot = { month: months, debts: [], totalRemaining: 0 };

    for (const debt of balances) {
      if (debt.balance <= 0) {
        snapshot.debts.push({ name: debt.name, balance: 0, payment: 0 });
        continue;
      }
      // Monthly interest
      const monthlyRate = debt.interest_rate / 100 / 12;
      const interest = debt.balance * monthlyRate;
      totalInterestPaid += interest;
      debt.balance += interest;

      // Pay minimum
      let payment = Math.min(debt.min_payment, debt.balance);

      // Add extra to first unpaid debt
      if (extra > 0 && debt === balances.find(d => d.balance > 0)) {
        const extraUsed = Math.min(extra, debt.balance - payment);
        payment += extraUsed;
        extra -= extraUsed;
      }

      debt.balance = Math.max(0, debt.balance - payment);
      snapshot.debts.push({ name: debt.name, balance: Math.round(debt.balance), payment: Math.round(payment), color: debt.color });
      snapshot.totalRemaining += debt.balance;
    }

    timeline.push(snapshot);
    if (months % 12 === 0 || months <= 6) {
      // Keep first 6 months + yearly snapshots
    }
  }

  return {
    months,
    totalInterestPaid: Math.round(totalInterestPaid),
    timeline: timeline.filter((_, i) => i < 6 || (i + 1) % 3 === 0), // every 3 months after 6
    payoffOrder: sorted.map(d => d.name)
  };
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(context);
    context.res = { status: 204, headers: context.res.headers, body: '' };
    return;
  }

  try {
    const b = req.body || {};
    const debts = b.debts || [];
    const extraPayment = parseFloat(b.extraPayment || 0);

    if (!debts.length) return fail(context, 'No debts provided');

    const snowball  = simulatePayoff(debts, extraPayment, 'snowball');
    const avalanche = simulatePayoff(debts, extraPayment, 'avalanche');

    // Recommendation
    const recommendation = avalanche.totalInterestPaid <= snowball.totalInterestPaid
      ? 'avalanche'
      : 'snowball';

    const interestSaved = Math.abs(snowball.totalInterestPaid - avalanche.totalInterestPaid);
    const monthsSaved   = Math.abs(snowball.months - avalanche.months);

    ok(context, {
      snowball,
      avalanche,
      recommendation,
      interestSaved,
      monthsSaved,
      summary: {
        snowball:  { months: snowball.months,  interest: snowball.totalInterestPaid },
        avalanche: { months: avalanche.months, interest: avalanche.totalInterestPaid }
      }
    });
  } catch (e) {
    fail(context, e.message, 500);
  }
};
