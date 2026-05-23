import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Wallet, 
  RefreshCw, 
  Settings,
  HelpCircle,
  HelpCircle as InfoIcon
} from 'lucide-react';

import { useFinance } from './hooks/useFinance';
import { 
  formatMonthName, 
  getTransactionInstallmentDetails, 
  getMonthDropdownOptions 
} from './utils';

// Components
import { StatsBrief } from './components/StatsBrief';
import { SalaryModal } from './components/SalaryModal';
import { CategoryFormModal } from './components/CategoryFormModal';
import { TransactionModal } from './components/TransactionModal';
import { CategoryBreakdown } from './components/CategoryBreakdown';

import { Category, Transaction } from './types';

export default function App() {
  const {
    categories,
    transactions,
    salaries,
    defaultSalary,
    paidTransactions,
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
  } = useFinance();

  // Selected Active Month YYYY-MM
  const [activeMonth, setActiveMonth] = useState<string>('2026-05');

  // Modals state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState<boolean>(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);

  // Selected default category when launching a transaction for a specific category card
  const [selectedDefaultCategoryId, setSelectedDefaultCategoryId] = useState<string | undefined>(undefined);

  // Editing state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Month navigation dropdown options
  const monthOptions = useMemo(() => getMonthDropdownOptions(), []);

  // Set next month
  const handleNextMonth = () => {
    const currentIndex = monthOptions.findIndex((o) => o.value === activeMonth);
    if (currentIndex !== -1 && currentIndex < monthOptions.length - 1) {
      setActiveMonth(monthOptions[currentIndex + 1].value);
    }
  };

  // Set previous month
  const handlePrevMonth = () => {
    const currentIndex = monthOptions.findIndex((o) => o.value === activeMonth);
    if (currentIndex > 0) {
      setActiveMonth(monthOptions[currentIndex - 1].value);
    }
  };

  // Dynamic salary for the selected activeMonth, falling back to defaultSalary
  const activeSalary = useMemo(() => {
    return salaries[activeMonth] !== undefined ? salaries[activeMonth] : defaultSalary;
  }, [salaries, activeMonth, defaultSalary]);

  // Active transactions inside the selected activeMonth (includes calculated installments)
  const activeTransactionsWithAmount = useMemo(() => {
    return transactions.map((tx) => {
      const details = getTransactionInstallmentDetails(tx, activeMonth);
      return {
        id: tx.id,
        categoryId: tx.categoryId,
        amount: details.installmentAmount,
        active: details.active,
      };
    }).filter((t) => t.active);
  }, [transactions, activeMonth]);

  // Total spent in active month
  const totalExpenses = useMemo(() => {
    return activeTransactionsWithAmount.reduce((sum, item) => sum + item.amount, 0);
  }, [activeTransactionsWithAmount]);

  // Triggers
  const triggerAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const triggerEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const triggerAddTransaction = (defaultCatId?: any) => {
    setEditingTransaction(null);
    setSelectedDefaultCategoryId(typeof defaultCatId === 'string' ? defaultCatId : undefined);
    setIsTransactionModalOpen(true);
  };

  const triggerEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleMoveTransactionCategory = (transactionId: string, newCategoryId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (tx) {
      updateTransaction(transactionId, {
        title: tx.title,
        categoryId: newCategoryId,
        type: tx.type,
        amount: tx.amount,
        installmentsCount: tx.installmentsCount,
        startMonth: tx.startMonth,
        date: tx.date,
        comments: tx.comments,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a13] text-slate-100" id="finance-app-root">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c101b]/90 backdrop-blur-md border-b border-slate-800/60 px-4 py-4" id="app-header">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-505 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Wallet size={20} className="stroke-[2px]" />
            </span>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
                Finanças Pessoais
              </h1>
              <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-extrabold mt-1">
                Controle Inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Demo Reset Indicator */}
            <button
              onClick={resetToSimulationData}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-850 bg-slate-950/20 hover:bg-slate-950/60 hover:border-slate-805 text-slate-400 hover:text-indigo-400 text-xs font-black transition-all cursor-pointer"
              title="Recarrega as contas com os dados simulados originais"
              id="reset-demo-data"
            >
              <RefreshCw size={11} className="stroke-[2.5px]" />
              <span className="hidden sm:inline text-xs">Resetar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Body Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Calendar Month Banner */}
        <div 
          className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121826] border border-slate-800/60 p-5 rounded-3xl shadow-xl shadow-slate-950/10"
          id="calendar-navigation-banner"
        >
          {/* Quick Info text */}
          <div className="text-center sm:text-left select-none">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Navegação Temporal</h3>
            <p className="text-xs text-slate-450 font-medium mt-0.5">As parcelas sincronizam automaticamente com os meses futuros</p>
          </div>

          {/* Month Slider Mechanics */}
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-slate-100 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Mês Anterior"
              disabled={activeMonth === monthOptions[0]?.value}
              id="btn-prev-month"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Selector Dropdown custom-styled wrapper */}
            <div className="relative">
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-[#0c101b] border border-slate-800 text-sm font-black text-slate-100 py-2.5 px-4 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none pr-9 select-none transition-colors"
                id="month-active-selector"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0c101b] text-slate-200 font-extrabold">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDownIcon />
              </div>
            </div>

            <button 
              onClick={handleNextMonth}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 text-slate-400 hover:text-slate-100 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Mês Seguinte"
              disabled={activeMonth === monthOptions[monthOptions.length - 1]?.value}
              id="btn-next-month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Action to create a new expense item */}
          <button
            onClick={triggerAddTransaction}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-550 hover:from-indigo-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/10 active:scale-95 transition-all cursor-pointer"
            id="btn-trigger-add-expense"
          >
            <Plus size={15} className="stroke-[3px]" />
            Lançar Gasto
          </button>
        </div>

        {/* Financial metrics dashboard overview columns */}
        <StatsBrief 
          salary={activeSalary}
          totalExpenses={totalExpenses}
          onEditSalary={() => setIsSalaryModalOpen(true)}
        />

        {/* Beautiful layout centering the category deck cards with nested lists */}
        <div className="max-w-3xl mx-auto">
          <CategoryBreakdown 
            categories={categories}
            transactions={transactions}
            activeMonth={activeMonth}
            paidTransactions={paidTransactions}
            onTogglePaid={togglePaidTransaction}
            onAddCategory={triggerAddCategory}
            onEditCategory={triggerEditCategory}
            onReorderCategories={updateCategoriesOrder}
            onAddTransaction={triggerAddTransaction}
            onEditTransaction={triggerEditTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        </div>

      </main>

      {/* Elegant Footer Details */}
      <footer className="mt-12 mb-6 text-center select-none shrink-0" id="app-footer">
        <p className="text-xs text-slate-600 font-medium">
          Controle Financeiro Pessoal • Sincronia automática de parcelas
        </p>
        <p className="text-[10px] text-slate-700 mt-1">
          Feito com carinho para rodar em celulares Android, tablets e Windows.
        </p>
      </footer>

      {/* Salary input dialog */}
      <SalaryModal 
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        currentMonth={activeMonth}
        currentSalary={activeSalary}
        defaultSalary={defaultSalary}
        onSaveSalary={setSalaryForMonth}
        onSaveDefaultSalary={updateDefaultSalary}
      />

      {/* Category settings custom dialog */}
      <CategoryFormModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={addCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
        editingCategory={editingCategory}
      />

      {/* Multi Option purchase launch settings dialog */}
      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        categories={categories}
        activeMonth={activeMonth}
        onSave={addTransaction}
        onUpdate={updateTransaction}
        editingTransaction={editingTransaction}
        defaultCategoryId={selectedDefaultCategoryId}
      />
    </div>
  );
}

// Simple custom inline SVG indicator for selector chevron to prevent lucide-react import redundancy
function ChevronDownIcon() {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="w-4 h-4"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
