export interface Category {
  id: string;
  name: string;
  color: string; // Hex color or Tailwind accent color
  icon: string;  // Name of the Lucide-react icon
}

export type TransactionType = 'single' | 'installment';

export interface Transaction {
  id: string;
  title: string;
  categoryId: string;
  type: TransactionType;
  amount: number;             // Total purchase amount
  installmentsCount?: number; // Total number of installments (only if type === 'installment')
  startMonth: string;         // YYYY-MM format when the purchase / payment starts
  date: string;               // YYYY-MM-DD purchase date
  comments: string;           // Optional note or observation
}

export interface MonthlyState {
  salary: number;
  month: string;              // YYYY-MM
}

export interface FinanceData {
  categories: Category[];
  transactions: Transaction[];
  salaries: Record<string, number>; // Record YYYY-MM -> salary
  defaultSalary: number;            // fallback salary when no specific month is set
  paidTransactions?: Record<string, boolean>; // Keyed by: `${transactionId}_${month}`
}
