import React, { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  ArrowUp, 
  ArrowDown, 
  Square, 
  CheckSquare, 
  GripVertical,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { Category, Transaction } from '../types';
import { formatCurrency, getTransactionInstallmentDetails } from '../utils';

interface CategoryBreakdownProps {
  categories: Category[];
  transactions: Transaction[];
  activeMonth: string;
  paidTransactions: Record<string, boolean>;
  onTogglePaid: (transactionId: string, month: string) => void;
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onReorderCategories: (reordered: Category[]) => void;
  onAddTransaction: (categoryId?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function CategoryBreakdown({
  categories,
  transactions,
  activeMonth,
  paidTransactions,
  onTogglePaid,
  onAddCategory,
  onEditCategory,
  onReorderCategories,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: CategoryBreakdownProps) {
  // State for collapsible cards
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    // Expand first few categories by default for a friendly user onboarding flow
    return {
      'cat-housing': true,
      'cat-food': true,
      'cat-cards': true,
    };
  });

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // State to track dragging item index
  const [dragStartIndex, setDragStartIndex] = useState<number | null>(null);

  // Group transactions for accurate calculations
  const activeItems = transactions.map((tx) => {
    const details = getTransactionInstallmentDetails(tx, activeMonth);
    return {
      transaction: tx,
      details,
    };
  }).filter((item) => item.details.active);

  // Accumulate total budget
  let grandTotal = 0;
  const itemsByCategory = categories.reduce<Record<string, typeof activeItems>>((acc, cat) => {
    acc[cat.id] = [];
    return acc;
  }, {});

  if (!itemsByCategory['cat-others']) {
    itemsByCategory['cat-others'] = [];
  }

  activeItems.forEach((item) => {
    const catId = item.transaction.categoryId;
    const amount = item.details.installmentAmount;
    grandTotal += amount;

    if (itemsByCategory[catId]) {
      itemsByCategory[catId].push(item);
    } else {
      itemsByCategory['cat-others'].push(item);
    }
  });

  // Calculate stats per category
  const breakdownList = categories.map((cat, index) => {
    const catItems = itemsByCategory[cat.id] || [];
    const spent = catItems.reduce((sum, item) => sum + item.details.installmentAmount, 0);

    const paidSpent = catItems.reduce((sum, item) => {
      const key = `${item.transaction.id}_${activeMonth}`;
      return sum + (paidTransactions[key] ? item.details.installmentAmount : 0);
    }, 0);

    return {
      category: cat,
      items: catItems,
      spent,
      paidSpent,
      index,
    };
  });

  // Reorder actions
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newList = [...categories];
    const prevItem = newList[index - 1];
    newList[index - 1] = newList[index];
    newList[index] = prevItem;
    onReorderCategories(newList);
  };

  const handleMoveDown = (index: number) => {
    if (index === categories.length - 1) return;
    const newList = [...categories];
    const nextItem = newList[index + 1];
    newList[index + 1] = newList[index];
    newList[index] = nextItem;
    onReorderCategories(newList);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragStartIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragStartIndex === null || dragStartIndex === index) return;

    const newList = [...categories];
    const draggedItem = newList.splice(dragStartIndex, 1)[0];
    newList.splice(index, 0, draggedItem);

    setDragStartIndex(index);
    onReorderCategories(newList);
  };

  const handleDragEnd = () => {
    setDragStartIndex(null);
  };

  return (
    <div className="flex flex-col space-y-6 w-full" id="categories-module">
      {/* Upper Module Title Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Categorias</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-505 animate-pulse" />
          </div>
          <button
            onClick={onAddCategory}
            className="w-9 h-9 rounded-xl bg-[#121826] border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer active:scale-95 shadow-md shadow-slate-950/40"
            title="Adicionar Categoria"
            id="btn-add-category"
          >
            <Plus size={18} />
          </button>
        </div>
        <p className="text-[11px] text-slate-550 font-medium">
          Dica: Segure o dedo sobre o nome da categoria para mudar a posição.
        </p>
      </div>

      {/* Main Categories Card list stack */}
      <div className="space-y-4">
        {breakdownList.map(({ category, items, spent, paidSpent, index }) => {
          const isExpanded = !!expandedCats[category.id];
          const isDragging = dragStartIndex === index;
          const isAllPaid = items.length > 0 && items.every((item) => paidTransactions[`${item.transaction.id}_${activeMonth}`]);

          return (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`rounded-3xl border transition-all duration-200 select-none ${
                isDragging 
                  ? 'bg-slate-900/55 border-indigo-500/50 scale-[0.99] opacity-90' 
                  : isAllPaid
                    ? 'bg-[#111624] border-emerald-950/30'
                    : 'bg-[#151b2c] border-slate-800/20 hover:border-slate-800/60'
              } p-6 shadow-xl relative`}
              id={`category-card-${category.id}`}
            >
              {/* Category card Header */}
              <div className="flex items-start justify-between gap-4">
                {/* Drag handle or Collapse Trigger click area */}
                <div 
                  onClick={() => toggleExpand(category.id)}
                  className="flex-1 cursor-pointer text-left"
                  title={isExpanded ? "Recolher itens de despesa" : "Expandir itens de despesa"}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner" 
                      style={{ backgroundColor: category.color }}
                    />
                    <h3 className="text-[17px] font-extrabold text-[#f1f5f9] tracking-tight leading-tight">
                      {index + 1}. {category.name}
                    </h3>
                    <span className="text-slate-500 hover:text-slate-300 transition-colors">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#64748b] font-bold mt-1 tracking-wide">
                    Total: {formatCurrency(spent)}
                  </p>
                </div>

                {/* Right Area: Sum information + Configurations */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-base sm:text-lg font-black text-[#f1f5f9] block leading-none tracking-tight">
                      {formatCurrency(spent)}
                    </span>
                    {spent > 0 && spent !== paidSpent && (
                      <span className="text-[10px] text-indigo-400 font-bold mt-1 block tracking-wide">
                        Pago: {formatCurrency(paidSpent)}
                      </span>
                    )}
                    {spent > 0 && isAllPaid && (
                      <span className="text-[10px] text-emerald-400 font-bold mt-1 block flex items-center justify-end gap-1 select-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Card Pago
                      </span>
                    )}
                  </div>

                  {/* Micro Actions (Up, Down & Configure Pencil icon) */}
                  <div className="flex items-center gap-1">
                    {/* Shift Up */}
                    {index > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        className="w-7 h-7 rounded-lg bg-[#111522] border border-slate-800/60 hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                        title="Mover para cima"
                      >
                        <ArrowUp size={12} />
                      </button>
                    )}
                    {/* Shift Down */}
                    {index < categories.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        className="w-7 h-7 rounded-lg bg-[#111522] border border-slate-800/60 hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={12} />
                      </button>
                    )}

                    {/* Circular Pencil button precisely matching screenshot layout */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategory(category);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-800/40 hover:bg-white text-slate-300 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-sm ml-0.5"
                      title="Configurar Categoria"
                      id={`edit-cat-btn-${category.id}`}
                    >
                      <Pencil size={11} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Expense items List */}
              {isExpanded && (
                <div className="mt-5 pt-5 border-t border-slate-800/40 space-y-4 animate-in fade-in slide-in-from-top-1 duration-150">
                  {items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-600 font-semibold italic">
                      Nenhum gasto lançado para este mês
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map(({ transaction: tx, details }, subIndex) => {
                        const paidKey = `${tx.id}_${activeMonth}`;
                        const isPaid = !!paidTransactions[paidKey];
                        const isInstallment = tx.type === 'installment';

                        return (
                          <div
                            key={tx.id}
                            className="group/subitem flex items-center justify-between gap-4 py-2 px-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/45 border border-transparent hover:border-slate-800/20 transition-all"
                            id={`subtx-item-${tx.id}`}
                          >
                            {/* Checkbox + Title block */}
                            <div className="flex items-center gap-3.5 overflow-hidden flex-1">
                              <button
                                onClick={() => onTogglePaid(tx.id, activeMonth)}
                                className={`shrink-0 transition-transform active:scale-90 cursor-pointer ${
                                  isPaid ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
                                }`}
                                title={isPaid ? "Marcar como não pago" : "Marcar como pago"}
                              >
                                {isPaid ? <CheckSquare size={19} /> : <Square size={19} />}
                              </button>

                              <div className="overflow-hidden text-left">
                                <span className={`text-[13.5px] font-bold block truncate tracking-tight leading-snug ${
                                  isPaid ? 'line-through text-[#64748b] font-medium decoration-emerald-500/40' : 'text-[#e2e8f0]'
                                }`}>
                                  {subIndex + 1}. {tx.title}
                                  {isInstallment && (
                                    <span className={`text-[10px] font-black ml-2 ${
                                      isPaid ? 'text-slate-600' : 'text-indigo-400'
                                    }`}>
                                      ({details.currentInstallment}/{tx.installmentsCount})
                                    </span>
                                  )}
                                </span>
                                {tx.comments && (
                                  <span className="text-[10.5px] text-slate-500 mt-0.5 block font-semibold leading-normal">
                                    ({tx.comments})
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Monthly amount & hover/static controls */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[13.5px] font-extrabold font-sans tracking-tight block ${
                                isPaid ? 'line-through text-slate-500 font-semibold decoration-emerald-500/40' : 'text-slate-100'
                              }`}>
                                {formatCurrency(details.installmentAmount)}
                              </span>

                              {/* Tiny Edit & Delete buttons */}
                              <div className="flex items-center gap-1 opacity-0 group-hover/subitem:opacity-100 transition-opacity ml-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shadow-md">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTransaction(tx);
                                  }}
                                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                                  title="Editar gasto"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Excluir o gasto "${tx.title}"?`)) {
                                      onDeleteTransaction(tx.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-450 transition-colors cursor-pointer"
                                  title="Excluir gasto"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add transaction pre-selected for this category card */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onAddTransaction(category.id)}
                      className="flex items-center gap-1 text-xs font-black text-[#a855f7] hover:text-[#c084fc] bg-slate-900/10 hover:bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-800/10 hover:border-slate-800/40 cursor-pointer active:scale-95 transition-all"
                      id={`btn-add-tx-to-${category.id}`}
                    >
                      <Plus size={13} className="stroke-[3px]" />
                      Adicionar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
