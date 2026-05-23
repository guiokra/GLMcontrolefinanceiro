import React, { useState } from 'react';
import { 
  Trash2, 
  Edit3, 
  MessageSquare, 
  Calendar, 
  Filter, 
  Search, 
  Layers, 
  Info,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { getTransactionInstallmentDetails, formatCurrency } from '../utils';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  categories: Category[];
  transactions: Transaction[];
  activeMonth: string; // YYYY-MM
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onMoveTransaction: (id: string, categoryId: string) => void;
}

export function TransactionList({
  categories,
  transactions,
  activeMonth,
  onEditTransaction,
  onDeleteTransaction,
  onMoveTransaction,
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Get active items in currentMonth
  const activeItems = transactions.map((tx) => {
    const details = getTransactionInstallmentDetails(tx, activeMonth);
    return {
      transaction: tx,
      details,
    };
  }).filter((item) => item.details.active);

  // Apply search/category filters
  const filteredItems = activeItems.filter(({ transaction }) => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.comments && transaction.comments.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategoryFilter === 'all' || transaction.categoryId === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleComment = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCategoryDetails = (catId: string): Category => {
    return categories.find((c) => c.id === catId) || {
      id: 'deleted',
      name: 'Sem Categoria',
      color: '#64748b',
      icon: 'HelpCircle',
    };
  };

  return (
    <div 
      className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col"
      id="transactions-container-card"
    >
      {/* Header and Filter triggers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850/80 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers size={18} />
          </span>
          <h2 className="font-bold text-slate-200 text-base">Gastos e Parcelas Ativas</h2>
          <span className="text-xs bg-slate-800/80 text-slate-400 px-2.5 py-0.5 rounded-full font-bold">
            {filteredItems.length}
          </span>
        </div>

        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[150px] sm:flex-initial">
            <input
              type="text"
              placeholder="Buscar gasto ou nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[180px] bg-slate-950/80 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 rounded-xl py-2 pl-8 pr-3.5 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              id="search-transactions"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" />
          </div>

          {/* Category drop filter */}
          <div className="relative flex-1 min-w-[130px] sm:flex-initial">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full sm:w-[140px] bg-slate-950/80 border border-slate-800 text-xs text-slate-400 focus:text-slate-200 rounded-xl py-2 px-3.5 outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
              id="filter-category-select"
            >
              <option value="all">Todas Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction list ledger */}
      {filteredItems.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center px-4" id="empty-state-ledger">
          <div className="p-3.5 rounded-full bg-slate-950/60 border border-slate-800/40 text-slate-600 mb-3 shrink-0 animate-pulse">
            <CalendarDays size={32} />
          </div>
          <p className="text-sm font-bold text-slate-400">Nenhum gasto registrado</p>
          <p className="text-xs text-slate-600 max-w-sm mt-1">
            {searchTerm || selectedCategoryFilter !== 'all' 
              ? 'Tente remover os filtros de busca para visualizar os gastos.' 
              : 'Clique no botão "Lançar Gasto +" para registrar seu primeiro consumo ou compra parcelada deste mês.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1" id="transactions-active-list">
          {filteredItems.map(({ transaction: tx, details }) => {
            const cat = getCategoryDetails(tx.categoryId);
            const isInstallment = tx.type === 'installment';
            const hasComments = !!tx.comments;
            const expanded = !!expandedComments[tx.id];

            return (
              <div 
                key={tx.id}
                className="group relative flex flex-col rounded-xl bg-slate-950/25 hover:bg-slate-950/65 border border-slate-800/60 hover:border-slate-700/80 transition-all p-3.5"
                id={`transaction-item-${tx.id}`}
              >
                {/* Main line */}
                <div className="flex items-center justify-between gap-3">
                  {/* Category and Title group */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Category circle */}
                    <span 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </span>

                    {/* text descriptions */}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-200 truncate pr-1">
                          {tx.title}
                        </h4>
                        
                        {/* Period indicator badges */}
                        {isInstallment ? (
                          <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-950/50 px-2 py-0.5 rounded-full select-none shrink-0 inline-flex items-center gap-1">
                            <Info size={10} />
                            Parcela {details.currentInstallment}/{tx.installmentsCount}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-full select-none shrink-0 inline-flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-slate-500" />
                            À Vista
                          </span>
                        )}
                      </div>

                      {/* category marker word & date */}
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                        {/* Interactive mover dropdown to reassign category instantly */}
                        <div className="relative inline-flex items-center group/mover cursor-pointer" title="Mover para outra categoria">
                          <select
                            value={tx.categoryId}
                            onChange={(e) => onMoveTransaction(tx.id, e.target.value)}
                            className="bg-slate-900 border border-slate-800 text-[10px] font-bold text-indigo-455 hover:text-indigo-300 hover:border-slate-700 py-0.5 pl-2 pr-5 rounded-lg cursor-pointer outline-none transition-all appearance-none text-left"
                            id={`move-tx-cat-${tx.id}`}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id} className="bg-slate-950 text-slate-250 text-xs font-semibold">
                                Mover para: {c.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 text-indigo-500 scale-75 pointer-events-none group-hover/mover:text-indigo-400 transition-all">
                            <ChevronDown size={11} />
                          </div>
                        </div>
                        
                        <span className="select-none text-slate-700">•</span>
                        <span className="select-none text-slate-600">Comprou em: {new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Control utilities */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      {/* Price per installment */}
                      <div className="text-sm font-extrabold text-slate-100 tracking-tight">
                        {formatCurrency(details.installmentAmount)}
                      </div>
                      
                      {/* Subtotal metadata if parcelado */}
                      {isInstallment && (
                        <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                          do total {formatCurrency(tx.amount)}
                        </div>
                      )}
                    </div>

                    {/* Desktop control tray / Trigger buttons */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      {hasComments && (
                        <button
                          onClick={() => toggleComment(tx.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            expanded ? 'bg-indigo-500/10 text-indigo-400' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Visualizar comentário"
                        >
                          <MessageSquare size={13} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                        title="Editar lançamento"
                        id={`btn-edit-tx-${tx.id}`}
                      >
                        <Edit3 size={13} />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm(`Excluir permanentemente o gasto "${tx.title}"?`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Deletar lançamento"
                        id={`btn-delete-tx-${tx.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile action hooks and comment status */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-900/60 sm:hidden">
                  <div className="flex items-center gap-3">
                    {hasComments && (
                      <button
                        onClick={() => toggleComment(tx.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 cursor-pointer"
                      >
                        <MessageSquare size={11} />
                        {expanded ? 'Ocultar Nota' : 'Ver Comentário'}
                      </button>
                    )}
                  </div>
                  
                  {/* Action triggers tray for mobile screens */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="text-xs text-indigo-400 font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir permanentemente o gasto "${tx.title}"?`)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="text-xs text-rose-400 font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                {/* Inline comment wrapper */}
                {hasComments && (expanded || !isInstallment) && (
                  <div className={`mt-2 bg-slate-950/60 border border-slate-800/40 rounded-lg p-2.5 text-xs text-slate-300 flex items-start gap-1.5 animate-in fade-in duration-200 ${!expanded && isInstallment ? 'hidden' : 'block'}`}>
                    <MessageSquare size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[10px] text-slate-500 select-none block uppercase tracking-wider mb-0.5">Nota cadastrada:</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{tx.comments}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
