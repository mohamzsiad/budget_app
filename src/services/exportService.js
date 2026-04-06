import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { storageService } from './storageService';

/**
 * Export all app data as a JSON backup file.
 * The user can import this later to restore data.
 */
export async function exportJSON() {
  try {
    const data = await storageService.exportAll();
    const json = JSON.stringify(data, null, 2);
    const fileName = `spendsmart_backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    const filePath = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(filePath, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export SpendSmart Data',
      });
    }

    return filePath;
  } catch (error) {
    console.error('[Export] JSON export error:', error);
    throw error;
  }
}

/**
 * Export expenses as a CSV file for a given period.
 * @param {Array} expenses - Filtered expense array
 * @param {string} period - Human-readable label e.g. "April 2026"
 */
export async function exportCSV(expenses, period = 'all') {
  try {
    const headers = [
      'Date',
      'Title',
      'Category',
      'Subcategory',
      'Amount',
      'Currency',
      'Payment Method',
      'Recurring',
      'Note',
    ];

    const rows = expenses.map((e) => [
      format(new Date(e.date), 'yyyy-MM-dd HH:mm'),
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      `"${e.subcategory || ''}"`,
      e.amount.toFixed(2),
      e.currency,
      `"${e.paymentMethod}"`,
      e.isRecurring ? e.recurringFrequency : 'No',
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const safePeriod = period.replace(/[^a-z0-9]/gi, '_');
    const fileName = `spendsmart_expenses_${safePeriod}_${format(new Date(), 'yyyyMMdd')}.csv`;
    const filePath = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(filePath, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses as CSV',
      });
    }

    return filePath;
  } catch (error) {
    console.error('[Export] CSV export error:', error);
    throw error;
  }
}

/**
 * Import data from a previously exported JSON backup.
 * @param {string} fileUri - URI of the JSON file to import
 */
export async function importJSON(fileUri) {
  try {
    const raw = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const data = JSON.parse(raw);

    // Validate structure
    const validKeys = ['@expenses', '@incomes', '@budgets', '@settings'];
    const hasValidData = validKeys.some((k) => data[k] !== undefined);
    if (!hasValidData) {
      throw new Error('Invalid backup file. Expected SpendSmart export format.');
    }

    await storageService.importAll(data);
    return true;
  } catch (error) {
    console.error('[Export] Import error:', error);
    throw error;
  }
}
