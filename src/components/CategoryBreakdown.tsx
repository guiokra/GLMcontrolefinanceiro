import React from 'react';
import { Plus, Tags, Settings2 } from 'lucide-react';
import { Category } from '../types';
import { formatCurrency } from '../utils';
import { CategoryIcon } from './CategoryIcon';

interface CategoryBreakdownProps {
  categories: Category[];
  activeTransactionsWithAmount: { categoryId: string; amount: number }[];
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
}

export function CategoryBreakdown({
  categories,
  activeTransactionsWithAmount,
  onAddCategory,
  onEditCategory,
}: CategoryBreakdownProps) {
  // Compute sum per category
  const categoryTotals = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = 0;
    return acc;
  }, {});

  let grandTotal = 0;
  activeTransactionsWithAmount.forEach((tx) => {
    const value = tx.amount;
    grandTotal += value;
    if (categoryTotals[tx.categoryId] !== undefined) {
      categoryTotals[tx.categoryId] += value;
    } else {
      // Fallback to Outros if category not found or deleted
      if (categoryTotals['cat-others'] !== undefined) {
        categoryTotals['cat-others'] += value;
      } else {
        categoryTotals['cat-others'] = value;
      }
    }
  });

  // Sort categories by total spent descending, keeping categories with zero spending too
  const breakdownList = categories.map((cat) => {
    const spentObj = categoryTotals[cat.id] || 0;
    const percentage = grandTotal > 0 ? (spentObj / grandTotal) * 100 : 0;
    return {
      category: cat,
      spent: spentObj,
      percentage,
    };
  }).sort((a, b) => b.spent - a.spent);

  return (
    <div 
      className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg flex flex-col h-full"
      id="category-breakdown-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-855/80 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Tags size={18} />
          </span>
          <h2 className="font-bold text-slate-200 text-base">Divisão por Categorias</h2>
        </div>
        <button
          onClick={onAddCategory}
          className="flex items-center gap-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
          id="btn-add-category"
        >
          <Plus size={14} />
          Nova
        </button>
      </div>

      {breakdownList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-500 text-xs">
          <span>Nenhuma categoria cadastrada.</span>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {breakdownList.map(({ category, spent, percentage }) => {
            return (
              <div 
                key={category.id} 
                className="group relative bg-slate-950/25 hover:bg-slate-950/50 border border-transparent hover:border-slate-800/80 p-2.5 rounded-xl transition-all"
              >
                {/* Info Text */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: category.color }}
                    >
                      <CategoryIcon name={category.icon} size={14} />
                    </span>
                    <span className="text-xs font-bold text-slate-300 group-hover:text-slate-100 transition-colors">
                      {category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      {formatCurrency(spent)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-md min-w-[32px] text-center">
                      {percentage.toFixed(0)}%
                    </span>
                    
                    {/* Settings Cog edit category trigger */}
                    <button
                      onClick={() => onEditCategory(category)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
                      title="Editar categoria"
                      id={`edit-cat-trigger-${category.id}`}
                    >
                      <Settings2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Linear percentage progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.max(percentage, spent > 0 ? 3 : 0)}%`, // minimum width if > 0 so it's visible
                      backgroundColor: category.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Badge */}
      <div className="mt-4 border-t border-slate-800/60 pt-3 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Gasto Total no Mês: {formatCurrency(grandTotal)}</span>
        <span>Ajuste as prioridades de gastos</span>
      </div>
    </div>
  );
}
