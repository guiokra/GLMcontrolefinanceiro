import { Category, Transaction } from './types';

/**
 * Calculates the difference in months between two YYYY-MM strings.
 * Returns negative if activeMonth is before startMonth.
 */
export function getMonthDiff(startMonthStr: string, activeMonthStr: string): number {
  const [startY, startM] = startMonthStr.split('-').map(Number);
  const [activeY, activeM] = activeMonthStr.split('-').map(Number);
  return (activeY - startY) * 12 + (activeM - startM);
}

/**
 * Formats a numeric value as Brazilian Reais (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parses YYYY-MM and returns a localized month name in Portuguese (e.g. "Maio de 2026")
 */
export function formatMonthName(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 15); // middle of month to avoid timezone issues
  const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Checks if a transaction is active in the selected month and calculates its details.
 */
export interface InstallmentDetails {
  active: boolean;
  currentInstallment?: number;
  installmentAmount: number;
}

export function getTransactionInstallmentDetails(
  tx: Transaction,
  activeMonth: string
): InstallmentDetails {
  if (tx.type === 'single') {
    // Single payments are only active in their start month
    const active = tx.startMonth === activeMonth;
    return {
      active,
      installmentAmount: tx.amount,
    };
  }

  // Installment purchase
  const diff = getMonthDiff(tx.startMonth, activeMonth);
  const count = tx.installmentsCount || 1;

  if (diff >= 0 && diff < count) {
    return {
      active: true,
      currentInstallment: diff + 1,
      installmentAmount: tx.amount / count,
    };
  }

  return {
    active: false,
    installmentAmount: 0,
  };
}

/**
 * Default categories list for a standard personal finance workspace in Portuguese.
 */
export function getDefaultCategories(): Category[] {
  return [
    {
      id: 'cat-housing',
      name: 'Moradia',
      color: '#3b82f6', // blue
      icon: 'Home',
    },
    {
      id: 'cat-cards',
      name: 'Cartão de Crédito',
      color: '#a855f7', // purple
      icon: 'CreditCard',
    },
    {
      id: 'cat-food',
      name: 'Alimentação',
      color: '#10b981', // green
      icon: 'Utensils',
    },
    {
      id: 'cat-transport',
      name: 'Transporte',
      color: '#eab308', // yellow
      icon: 'Car',
    },
    {
      id: 'cat-leisure',
      name: 'Lazer e Viagens',
      color: '#f43f5e', // rose
      icon: 'Sparkles',
    },
    {
      id: 'cat-health',
      name: 'Saúde',
      color: '#ec4899', // pink
      icon: 'Activity',
    },
    {
      id: 'cat-savings',
      name: 'Investimento / Resg.',
      color: '#06b6d4', // cyan
      icon: 'PiggyBank',
    },
    {
      id: 'cat-others',
      name: 'Outros',
      color: '#64748b', // slate
      icon: 'Wallet',
    },
  ];
}

/**
 * Returns month options list (6 months back, 12 months forward from today) for quick selections
 */
export function getMonthDropdownOptions(): { value: string; label: string }[] {
  const options = [];
  const now = new Date();
  
  // start 12 months back and go 24 months forward for full control
  const start = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  for (let i = 0; i < 36; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const value = `${year}-${month}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    options.push({
      value,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    });
  }
  return options;
}
