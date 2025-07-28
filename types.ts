
export interface Transaction {
  id: number;
  category_id: number;
  amount: number;
  date: number;
  description: string;
  type: "Expense" | "Income";
  pending_cat: number;
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
export interface UPICategory {
  id: number;
  receiver: string;
  category: string;
  description: string;
  alwaysAsk: number;
  type: "Expense" | "Income";
}
export type RootStackParamList = {

  Categorise: {
    receiver?: string;
    amount: number;
    ask: number;
    transactionId?: number;
    initialCategory?: string;
    initialDescription?: string;
    initialType?: "Expense" | "Income";
  };
   TabNavigation: {
    screen?: 'Home' | 'Analytics' | 'PendingTxns';
    params?: {
      HomeScreen?: undefined;
      AnalyticsScreen?: undefined;
      PendingTxns?: undefined;
    };
  };
  Transactions: {
    Transaction : Transaction[];
  }
};
