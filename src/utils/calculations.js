import { getDate, getDaysInMonth } from 'date-fns';

/**
 * Calculate total amount for an array of expenses/incomes.
 */
export function calcTotal(items) {
  return items.reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Calculate average daily spend for the current period.
 * @param {number} totalSpent
 * @param {number} daysPassed - days elapsed in current period
 */
export function calcDailyAverage(totalSpent, daysPassed) {
  if (!daysPassed || daysPassed <= 0) return 0;
  return totalSpent / daysPassed;
}

/**
 * Project end-of-month spend based on current daily average.
 */
export function calcProjectedMonthlySpend(totalSpent, date = new Date()) {
  const daysPassed = getDate(date);
  const daysInMonth = getDaysInMonth(date);
  if (daysPassed <= 0) return 0;
  const dailyAvg = totalSpent / daysPassed;
  return dailyAvg * daysInMonth;
}

/**
 * Calculate savings rate: (income - expenses) / income * 100
 */
export function calcSavingsRate(income, expenses) {
  if (!income || income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

/**
 * Get the top N categories by spend from a byCategory object.
 * @param {Object} byCategory - { categoryName: totalAmount }
 * @param {number} n
 */
export function getTopCategories(byCategory, n = 6) {
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, amount]) => ({ name, amount }));
}

/**
 * Find the biggest single expense day from a groupByDay object.
 * @param {Object} byDay - { 'YYYY-MM-DD': totalAmount }
 */
export function getBiggestExpenseDay(byDay) {
  let maxDay = null;
  let maxAmount = 0;
  for (const [day, amount] of Object.entries(byDay)) {
    if (amount > maxAmount) {
      maxAmount = amount;
      maxDay = day;
    }
  }
  return { day: maxDay, amount: maxAmount };
}

/**
 * Calculate budget utilization percentage.
 */
export function calcBudgetPct(spent, limit) {
  if (!limit || limit <= 0) return 0;
  return (spent / limit) * 100;
}

/**
 * Determine budget status color based on percentage.
 */
export function getBudgetStatus(pct) {
  if (pct >= 100) return 'over';
  if (pct >= 80)  return 'danger';
  if (pct >= 60)  return 'warning';
  return 'good';
}
