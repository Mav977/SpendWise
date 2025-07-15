import { SQLiteDatabase } from 'expo-sqlite';
import { Category, Transaction, TransactionsByMonth } from '../../types';

export async function getAllAppData(
  db: SQLiteDatabase
): Promise<{
  transactions: Transaction[]; // now: current month transactions
  allTransactions: Transaction[]; // all transactions in DB
  categories: Category[];
  monthlySummary: TransactionsByMonth;
}> {
  // 🔹 Get all transactions
  const allTransactions = await db.getAllAsync<Transaction>(
    `SELECT * FROM Transactions ORDER BY date DESC;`
  );

  // 🔹 Get categories
  const categories = await db.getAllAsync<Category>(`SELECT * FROM Categories;`);

  // 🔹 Calculate current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);

  const startTimestamp = startOfMonth.getTime();
  const endTimestamp = endOfMonth.getTime();

  // 🔹 Get transactions of the current month
  const transactions = await db.getAllAsync<Transaction>(
    `SELECT * FROM Transactions WHERE date >= ? AND date <= ? ORDER BY date DESC;`,
    [startTimestamp, endTimestamp]
  );

  // 🔹 Get total income and expense summary for current month
  const monthly = await db.getAllAsync<TransactionsByMonth>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS totalExpenses,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS totalIncome
      FROM Transactions
      WHERE date >= ? AND date <= ?;
    `,
    [startTimestamp, endTimestamp]
  );

  return {
    transactions,         // current month only
    allTransactions,      // all from DB
    categories,
    monthlySummary: monthly[0],
  };
}
