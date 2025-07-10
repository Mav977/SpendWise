import { SQLiteDatabase } from 'expo-sqlite';
import { Category } from '../../types';
import { getAllAppData } from './helpers'; // assumes you already have this helper

export async function addCategory(
  db: SQLiteDatabase,
  name: string,
  type: string,
  onUpdate: (categories: Category[]) => void
): Promise<void> {
  const trimmedName = name.trim();

  // Prevent empty or duplicate entries
  if (!trimmedName) return;

  const categories = await db.getAllAsync<Category>("SELECT * FROM Categories");

  const alreadyExists = categories.some(
    (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase() && cat.type === type
  );

  if (alreadyExists) {
    alert('Category already exists');
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(`INSERT INTO Categories (name, type) VALUES (?, ?)`, [trimmedName, type]);
  });

  // Fetch and return updated list
  const updatedData = await getAllAppData(db);
  onUpdate(updatedData.categories);
}
