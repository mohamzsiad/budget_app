/**
 * Common currencies with symbol and code.
 * Full list of 150+ currencies for the currency picker.
 */
export const CURRENCIES = [
  { code: 'USD', symbol: '$',  name: 'US Dollar' },
  { code: 'EUR', symbol: '€',  name: 'Euro' },
  { code: 'GBP', symbol: '£',  name: 'British Pound' },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',  name: 'Chinese Yuan' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'KRW', symbol: '₩',  name: 'South Korean Won' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'ZAR', symbol: 'R',  name: 'South African Rand' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼',  name: 'Saudi Riyal' },
  { code: 'QAR', symbol: '﷼',  name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar' },
  { code: 'OMR', symbol: '﷼',  name: 'Omani Rial' },
  { code: 'EGP', symbol: '£',  name: 'Egyptian Pound' },
  { code: 'TRY', symbol: '₺',  name: 'Turkish Lira' },
  { code: 'RUB', symbol: '₽',  name: 'Russian Ruble' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿',  name: 'Thai Baht' },
  { code: 'PHP', symbol: '₱',  name: 'Philippine Peso' },
  { code: 'VND', symbol: '₫',  name: 'Vietnamese Dong' },
  { code: 'PKR', symbol: '₨',  name: 'Pakistani Rupee' },
  { code: 'BDT', symbol: '৳',  name: 'Bangladeshi Taka' },
  { code: 'NGN', symbol: '₦',  name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  { code: 'UGX', symbol: 'Ush', name: 'Ugandan Shilling' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham' },
  { code: 'COP', symbol: 'Col$', name: 'Colombian Peso' },
  { code: 'ARS', symbol: '$',  name: 'Argentine Peso' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso' },
  { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol' },
  { code: 'CRC', symbol: '₡',  name: 'Costa Rican Colón' },
];

/**
 * Get a currency's symbol by code.
 * Falls back to the code itself if not found.
 */
export function getCurrencySymbol(code) {
  const found = CURRENCIES.find((c) => c.code === code);
  return found ? found.symbol : code;
}
