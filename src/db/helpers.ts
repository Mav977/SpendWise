// helpers.ts
import { SQLiteDatabase } from 'expo-sqlite';
import { Category, Transaction, TransactionsByMonth } from '../../types';

export async function getAllAppData(
  db: SQLiteDatabase
): Promise<{
  transactions: Transaction[];
  categories: Category[];
  monthlySummary: TransactionsByMonth;
}> {
  const transactions = await db.getAllAsync<Transaction>(
    `SELECT * FROM Transactions ORDER BY date DESC LIMIT 30;`
  );

  const categories = await db.getAllAsync<Category>(`SELECT * FROM Categories;`);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  endOfMonth.setMilliseconds(endOfMonth.getMilliseconds() - 1);

  const start = Math.floor(startOfMonth.getTime() / 1000);
  const end = Math.floor(endOfMonth.getTime() / 1000);

  const monthly = await db.getAllAsync<TransactionsByMonth>(
    `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END), 0) AS totalExpenses,
        COALESCE(SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END), 0) AS totalIncome
      FROM Transactions
      WHERE date >= ? AND date <= ?;
    `,
    [start, end]
  );

  return {
    transactions,
    categories,
    monthlySummary: monthly[0],
  };
}
