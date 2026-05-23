import React from 'react';
import { TrendingUp, TrendingDown, Edit3 } from 'lucide-react';
import { formatCurrency } from '../utils';

interface StatsBriefProps {
  salary: number;
  totalExpenses: number;
  onEditSalary: () => void;
}

export function StatsBrief({ salary, totalExpenses, onEditSalary }: StatsBriefProps) {
  const remaining = salary - totalExpenses;
  const isNegative = remaining < 0;
  
  // Calculate percentage of salary spent
  const spentPercentage = salary > 0 ? (totalExpenses / salary) * 105 : 0;
  const realPercentage = salary > 0 ? (totalExpenses / salary) * 100 : 0;
  
  let progressColor = 'bg-emerald-500';
  if (realPercentage > 90) {
    progressColor = 'bg-rose-500';
  } else if (realPercentage > 70) {
    progressColor = 'bg-amber-500';
  }

  return (
    <div 
      className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg p-4" 
      id="stats-compact-summary"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 gap-3 sm:gap-0">
        
        {/* Salary Cell */}
        <div className="pb-3.5 sm:pb-0 sm:pr-5 flex items-center justify-between sm:justify-start gap-4">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1 select-none">
              Renda / Salário
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-white tracking-tight">
                {formatCurrency(salary)}
              </span>
              <button 
                onClick={onEditSalary}
                className="p-1 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-90"
                title="Alterar renda deste mês"
                id="btn-edit-salary-compact"
              >
                <Edit3 size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Total Expenses Cash Flow Cell */}
        <div className="py-3.5 sm:py-0 sm:px-6 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 select-none">
            Total de Gastos
          </span>
          <div className="flex items-baseline justify-between sm:justify-start gap-2.5">
            <span className="text-xl font-extrabold text-slate-100 tracking-tight">
              {formatCurrency(totalExpenses)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded-md select-none">
              {realPercentage.toFixed(0)}% do salário
            </span>
          </div>
          {/* Thin layout progress bar */}
          <div className="w-full bg-slate-950 rounded-full h-1 mt-1.5 overflow-hidden">
            <div 
              className={`h-full ${progressColor} transition-all duration-300`}
              style={{ width: `${Math.min(realPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Rest Leftover Cell */}
        <div className="pt-3.5 sm:pt-0 sm:pl-6 flex items-center justify-between sm:justify-start gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1 select-none">
              Quanto está Sobrando
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-extrabold tracking-tight ${
                isNegative ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}>
                {formatCurrency(remaining)}
              </span>
              <span className={`p-1 rounded-full text-xs font-bold leading-none ${
                isNegative ? 'bg-rose-500/10 text-rose-450' : 'bg-emerald-500/10 text-emerald-450'
              }`}>
                {isNegative ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
