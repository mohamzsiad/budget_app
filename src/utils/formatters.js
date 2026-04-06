import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format a number as currency.
 * @param {number} amount
 * @param {string} currencySymbol - e.g. '$', '€'
 */
export function formatCurrency(amount, currencySymbol = '$') {
  if (amount === undefined || amount === null) return `${currencySymbol}0.00`;
  return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format an ISO date string for display.
 */
export function formatDate(isoString, pattern = 'MMM d, yyyy') {
  try {
    return format(new Date(isoString), pattern);
  } catch {
    return isoString;
  }
}

/**
 * Relative time e.g. "2 hours ago"
 */
export function formatRelative(isoString) {
  try {
    return formatDistanceToNow(new Date(isoString), { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Format a percentage for display.
 */
export function formatPercent(value, decimals = 0) {
  return `${(value || 0).toFixed(decimals)}%`;
}

/**
 * Shorten large numbers: 1200 → "1.2K", 1500000 → "1.5M"
 */
export function formatCompact(amount) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(2);
}
