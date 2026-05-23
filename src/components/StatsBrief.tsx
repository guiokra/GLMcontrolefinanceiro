import React from 'react';
import { TrendingUp, TrendingDown, Edit3, DollarSign, CreditCard, Sparkles } from 'lucide-react';
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
  const realPercentage = salary > 0 ? (totalExpenses / salary) * 100 : 0;
  
  let progressColor = 'bg-linear-to-r from-emerald-500 to-teal-400';
  let progressGlow = 'shadow-[0_0_10px_rgba(16,185,129,0.3)]';
  
  if (realPercentage > 90) {
    progressColor = 'bg-linear-to-r from-rose-500 to-red-400';
    progressGlow = 'shadow-[0_0_10px_rgba(244,63,94,0.3)]';
  } else if (realPercentage > 70) {
    progressColor = 'bg-linear-to-r from-amber-500 to-orange-400';
    progressGlow = 'shadow-[0_0_10px_rgba(245,158,11,0.3)]';
  }

  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-3 gap-4" 
      id="stats-compact-summary"
    >
      {/* Salary Bento Card */}
      <div className="bg-[#121826] border border-slate-800/60 rounded-3xl p-5 hover:border-indigo-500/30 transition-all shadow-xl shadow-slate-950/20 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 font-sans">
            Sua Renda
          </span>
          <span className="p-1 px-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
            Fixa / Variável
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white tracking-tight font-sans">
              {formatCurrency(salary)}
            </span>
          </div>
          <button 
            onClick={onEditSalary}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-90"
            title="Alterar renda deste mês"
            id="btn-edit-salary-compact"
          >
            <Edit3 size={12} />
          </button>
        </div>
      </div>

      {/* Total Expenses Card */}
      <div className="bg-[#121826] border border-slate-800/60 rounded-3xl p-5 hover:border-slate-700/60 transition-all shadow-xl shadow-slate-950/20 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8] font-sans">
            Total de Gastos
          </span>
          <span className="p-1 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-extrabold font-mono">
            {realPercentage.toFixed(0)}% Utilizado
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-[#edf2f7] tracking-tight font-sans">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          {/* Clean sleek interactive visual progress bar with modern rounded tips */}
          <div className="w-full bg-slate-955 rounded-full h-1.5 overflow-hidden p-[1px] border border-slate-900">
            <div 
              className={`h-full rounded-full ${progressColor} ${progressGlow} transition-all duration-500`}
              style={{ width: `${Math.min(realPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Saldo Sobrando (Remaining Net Flow) Card */}
      <div className="bg-[#121826] border border-slate-800/60 rounded-3xl p-5 hover:border-slate-700/60 transition-all shadow-xl shadow-slate-950/20 relative group overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 select-none">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#94a3b8] font-sans border-none">
            Saldo Disponível
          </span>
          <span className={`p-1 px-1.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
            isNegative ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-405'
          }`}>
            {isNegative ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
            {isNegative ? 'Negativo' : 'Restando'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black tracking-tight font-sans transition-colors ${
              isNegative ? 'text-rose-450 animate-pulse' : 'text-emerald-400'
            }`}>
              {formatCurrency(remaining)}
            </span>
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isNegative ? 'bg-rose-500/5 text-rose-500/70' : 'bg-emerald-500/5 text-emerald-500/70'
          }`}>
            <Sparkles size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

