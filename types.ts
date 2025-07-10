export interface Transaction {
  id: number;
  category_id: number;
  amount: number;
  date: number;
  description: string;
  type: "Expense" | "Income";
}

export interface Category {
  id: number;
  name: string;
  type: "Expense" | "Income";
}

export interface TransactionsByMonth {
  totalExpenses: number;
  totalIncome: number;
}
export type RootStackParamList = {
  Home: undefined;
  Categorise: { receiver: string; amount: number;ask: number; };
};