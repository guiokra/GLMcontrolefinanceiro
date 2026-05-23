import { useState, useEffect } from 'react';
import { Category, Transaction, FinanceData } from '../types';
import { getDefaultCategories } from '../utils';

const STORAGE_KEY = 'controle_financeiro_data_v1';

export function useFinance() {
  // Core internal state
  const [data, setData] = useState<FinanceData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.categories && parsed.transactions) {
          // Initialize paidTransactions if missing
          if (!parsed.paidTransactions) {
            parsed.paidTransactions = {};
          }
          return parsed;
        }
      } catch (e) {
        console.error('Erro ao ler do localStorage:', e);
      }
    }

    // Default simulation data
    const initialCategories = getDefaultCategories();
    
    // YYYY-MM format
    const startMarch = '2026-03';
    const startJan = '2026-01';
    const startMay = '2026-05';

    const initialTransactions: Transaction[] = [
      {
        id: 'tx-sim-1',
        title: 'Geladeira Inox (5 parcelas)',
        categoryId: 'cat-housing',
        type: 'installment',
        amount: 2500, // R$ 2.500 total, 500 per month
        installmentsCount: 5,
        startMonth: startMarch, // Mar (1/5), Apr (2/5), May (3/5), Jun (4/5), Jul (5/5)
        date: '2026-03-05',
        comments: 'Compra realizada na promoção de aniversário da loja física. Garantia estendida inclusa.',
      },
      {
        id: 'tx-sim-2',
        title: 'Supermercado Mensal',
        categoryId: 'cat-food',
        type: 'single',
        amount: 620.50,
        startMonth: startMay,
        date: '2026-05-10',
        comments: 'Compras básicas para o mês no hipermercado.',
      },
      {
        id: 'tx-sim-3',
        title: 'Curso de Especialização Técnica',
        categoryId: 'cat-others',
        type: 'installment',
        amount: 1200, // R$ 1.200 total, 100 per month
        installmentsCount: 12,
        startMonth: startJan, // Jan (1/12), Feb (2/12), Mar (3/12), Apr (4/12), May (5/12)...
        date: '2026-01-15',
        comments: 'Curso online de automação para acelerar carreira laboral.',
      },
      {
        id: 'tx-sim-4',
        title: 'Fatura Boleto Internet Fibra',
        categoryId: 'cat-housing',
        type: 'single',
        amount: 119.90,
        startMonth: startMay,
        date: '2026-05-20',
        comments: 'Vence todo dia 20 de cada mês.',
      }
    ];

    return {
      categories: initialCategories,
      transactions: initialTransactions,
      salaries: {
        '2026-05': 5500,
      },
      defaultSalary: 5000,
      paidTransactions: {
        'tx-sim-4_2026-05': true, // default one example as paid
      },
    };
  });

  // Sync state to local storage on any state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // CATEGORIES CRUD
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCatCount = data.categories.length + 1;
    const newCatId = `cat-custom-${Date.now()}-${newCatCount}`;
    const newCat: Category = {
      ...category,
      id: newCatId,
    };

    setData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat],
    }));
  };

  const updateCategory = (id: string, updated: Omit<Category, 'id'>) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  };

  const deleteCategory = (id: string) => {
    setData((prev) => {
      const updatedTransactions = prev.transactions.map((tx) => {
        if (tx.categoryId === id) {
          return { ...tx, categoryId: 'cat-others' };
        }
        return tx;
      });
      return {
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        transactions: updatedTransactions,
      };
    });
  };

  // TRANSACTIONS CRUD
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTxId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...tx,
      id: newTxId,
    };

    setData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  };

  const updateTransaction = (id: string, updated: Omit<Transaction, 'id'>) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
  };

  const deleteTransaction = (id: string) => {
    setData((prev) => {
      // Also clean up any paid records for this transaction across all months
      const cleanedPaid = { ...prev.paidTransactions };
      Object.keys(cleanedPaid).forEach((key) => {
        if (key.startsWith(`${id}_`)) {
          delete cleanedPaid[key];
        }
      });

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        paidTransactions: cleanedPaid,
      };
    });
  };

  // PAID STATE TRIGGERS
  const togglePaidTransaction = (transactionId: string, month: string) => {
    const key = `${transactionId}_${month}`;
    setData((prev) => {
      const currentPaid = prev.paidTransactions || {};
      return {
        ...prev,
        paidTransactions: {
          ...currentPaid,
          [key]: !currentPaid[key],
        },
      };
    });
  };

  // SALARIES OPERATIONS
  const setSalaryForMonth = (month: string, salary: number) => {
    setData((prev) => ({
      ...prev,
      salaries: {
        ...prev.salaries,
        [month]: salary,
      },
    }));
  };

  const updateDefaultSalary = (salary: number) => {
    setData((prev) => ({
      ...prev,
      defaultSalary: salary,
    }));
  };

  const updateCategoriesOrder = (reorderedCats: Category[]) => {
    setData((prev) => ({
      ...prev,
      categories: reorderedCats,
    }));
  };

  // Restores simulation data
  const resetToSimulationData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return {
    categories: data.categories,
    transactions: data.transactions,
    salaries: data.salaries,
    defaultSalary: data.defaultSalary,
    paidTransactions: data.paidTransactions || {},
    togglePaidTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setSalaryForMonth,
    updateDefaultSalary,
    updateCategoriesOrder,
    resetToSimulationData,
  };
}
