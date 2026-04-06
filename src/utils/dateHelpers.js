import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subMonths, format,
  eachDayOfInterval, eachMonthOfInterval,
} from 'date-fns';

/**
 * Get date range for a given period.
 * @param {'Daily'|'Weekly'|'Monthly'} period
 * @param {Date} referenceDate
 * @param {number} weekStartDay - 0 = Sunday, 1 = Monday
 */
export function getDateRange(period, referenceDate = new Date(), weekStartDay = 1) {
  switch (period) {
    case 'Daily':
      return {
        start: startOfDay(referenceDate),
        end: endOfDay(referenceDate),
      };
    case 'Weekly':
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: weekStartDay }),
        end: endOfWeek(referenceDate, { weekStartsOn: weekStartDay }),
      };
    case 'Monthly':
    default:
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
  }
}

/**
 * Get an array of day labels for a monthly chart X-axis.
 */
export function getDaysInMonthLabels(date = new Date()) {
  const days = eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
  return days.map((d) => format(d, 'd'));
}

/**
 * Get last N months as { label, yearMonth } objects.
 */
export function getLastNMonths(n = 6) {
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    result.push({
      label: format(d, 'MMM'),
      yearMonth: format(d, 'yyyy-MM'),
    });
  }
  return result;
}

/**
 * Group expenses by day for a given month.
 * Returns an object: { '2026-04-01': totalAmount, ... }
 */
export function groupExpensesByDay(expenses, yearMonth) {
  const result = {};
  for (const expense of expenses) {
    if (expense.date.startsWith(yearMonth)) {
      const day = expense.date.substring(0, 10); // 'YYYY-MM-DD'
      result[day] = (result[day] || 0) + expense.amount;
    }
  }
  return result;
}

/**
 * Group expenses by month for the last N months.
 * Returns array of { yearMonth, total }
 */
export function groupExpensesByMonth(expenses, months) {
  return months.map(({ yearMonth }) => ({
    yearMonth,
    total: expenses
      .filter((e) => e.date.startsWith(yearMonth))
      .reduce((sum, e) => sum + e.amount, 0),
  }));
}
