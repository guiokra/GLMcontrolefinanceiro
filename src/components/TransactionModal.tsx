import React, { useState, useEffect } from 'react';
import { X, Calendar, Wallet, FileText, Split } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  activeMonth: string; // YYYY-MM
  onSave: (tx: Omit<Transaction, 'id'>) => void;
  onUpdate: (id: string, tx: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  activeMonth,
  onSave,
  onUpdate,
  editingTransaction,
}: TransactionModalProps) {
  const [title, setTitle] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [type, setType] = useState<TransactionType>('single');
  const [installmentsCount, setInstallmentsCount] = useState<number>(3);
  const [startMonth, setStartMonth] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [comments, setComments] = useState<string>('');

  // Hydrate form when opening or changing edit target
  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setTitle(editingTransaction.title);
        setCategoryId(editingTransaction.categoryId);
        setAmountInput(editingTransaction.amount.toString());
        setType(editingTransaction.type);
        setInstallmentsCount(editingTransaction.installmentsCount || 3);
        setStartMonth(editingTransaction.startMonth);
        setDate(editingTransaction.date);
        setComments(editingTransaction.comments);
      } else {
        // Form default values for a new transaction
        const today = new Date();
        const year = today.getFullYear();
        const monthStr = String(today.getMonth() + 1).padStart(2, '0');
        const dayStr = String(today.getDate()).padStart(2, '0');
        const fullDate = `${year}-${monthStr}-${dayStr}`;

        setTitle('');
        setCategoryId(categories[0]?.id || 'cat-others');
        setAmountInput('');
        setType('single');
        setInstallmentsCount(3);
        setStartMonth(activeMonth);
        setDate(fullDate);
        setComments('');
      }
    }
  }, [isOpen, editingTransaction, categories, activeMonth]);

  // Sync Start Month to Transaction Date when date changes
  const handleDateChange = (newDateStr: string) => {
    setDate(newDateStr);
    if (!editingTransaction && newDateStr) {
      const [year, month] = newDateStr.split('-');
      setStartMonth(`${year}-${month}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, informe a descrição do gasto.');
      return;
    }
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) {
      alert('Por favor, informe um valor de compra válido.');
      return;
    }

    const payload: Omit<Transaction, 'id'> = {
      title: title.trim(),
      categoryId,
      type,
      amount: val,
      installmentsCount: type === 'installment' ? installmentsCount : undefined,
      startMonth,
      date,
      comments: comments.trim(),
    };

    if (editingTransaction) {
      onUpdate(editingTransaction.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const parsedAmount = parseFloat(amountInput) || 0;
  const monthlyInstallmentValue = type === 'installment' ? parsedAmount / installmentsCount : parsedAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 shadow-2xl" id="transaction-modal-overlay">
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col max-h-[90vh]"
        id="transaction-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Wallet size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              {editingTransaction ? 'Editar Registro de Gasto' : 'Lançar Novo Gasto'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            id="close-transaction-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 py-1">
          {/* Title description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição / Título do Gasto
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Compra Carrefour, Fatura Cabeleireiro, Geladeira"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium transition-all"
              id="transaction-title-input"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Value */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {type === 'installment' ? 'Valor Total da Compra (R$)' : 'Valor do Gasto (R$)'}
              </label>
              <div className="relative rounded-xl border border-slate-800 bg-slate-950/80 focus-within:border-indigo-500 transition-all">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0,00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-transparent py-2.5 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none font-semibold text-sm"
                  id="transaction-amount-input"
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Categoria correspondente
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-slate-400 font-medium focus:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                id="transaction-category-select"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Purchase Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Data do Gasto
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium transition-all cursor-pointer"
                id="transaction-date-input"
              />
            </div>

            {/* Recurrence Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Tipo de Cobrança
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950/40 border border-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('single')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'single'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/30'
                  }`}
                >
                  À Vista / Único
                </button>
                <button
                  type="button"
                  onClick={() => setType('installment')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    type === 'installment'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/30'
                  }`}
                  id="toggle-installment-btn"
                >
                  Parcelado
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Installment details */}
          {type === 'installment' && (
            <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-250">
              <div className="grid grid-cols-2 gap-4">
                {/* Number of Installments */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Split size={12} className="text-indigo-400" /> Num. de Parcelas (Vezes)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="180"
                    required
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-bold transition-all"
                    id="transaction-installments-count"
                  />
                </div>

                {/* Initializing Month */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar size={12} className="text-indigo-400" /> Mês da 1ª Parcela
                  </label>
                  <input
                    type="month"
                    required
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold transition-all cursor-pointer"
                    id="transaction-start-month-input"
                  />
                </div>
              </div>

              {/* Installment breakdown helper */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                <span>Resultado por parcela:</span>
                <span className="font-extrabold text-indigo-400 text-sm">
                  {installmentsCount}x de o equivalente a {formatCurrency(monthlyInstallmentValue)} /mês
                </span>
              </div>
            </div>
          )}

          {/* Comment description textfield */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-500" />
              Observações / Comentários
            </label>
            <textarea
              placeholder="Adicione um comentário para lembrar deste gasto nos meses seguintes... (Opcional)"
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-sm font-medium transition-all resize-none"
              id="transaction-comments-input"
            />
          </div>

          {/* Action buttons footer */}
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
              id="submit-transaction-form"
            >
              {editingTransaction ? 'Salvar Edição' : 'Lançar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
