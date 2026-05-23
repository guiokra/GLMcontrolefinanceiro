import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  currentSalary: number;
  defaultSalary: number;
  onSaveSalary: (month: string, val: number) => void;
  onSaveDefaultSalary: (val: number) => void;
}

export function SalaryModal({
  isOpen,
  onClose,
  currentMonth,
  currentSalary,
  defaultSalary,
  onSaveSalary,
  onSaveDefaultSalary,
}: SalaryModalProps) {
  const [salaryInput, setSalaryInput] = useState<string>('');
  const [useAsDefault, setUseAsDefault] = useState<boolean>(false);

  // Load active salary when modal opens
  useEffect(() => {
    if (isOpen) {
      setSalaryInput(currentSalary.toString());
      setUseAsDefault(false);
    }
  }, [isOpen, currentSalary]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(salaryInput);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      alert('Por favor, insira um valor válido e positivo.');
      return;
    }

    if (useAsDefault) {
      onSaveDefaultSalary(parsedAmount);
    }
    onSaveSalary(currentMonth, parsedAmount);
    onClose();
  };

  // Human friendly month formatting for Portuguese: "Maio de 2026"
  const [year, month] = currentMonth.split('-');
  const dateName = new Date(Number(year), Number(month) - 1, 15)
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const formattedMonth = dateName.charAt(0).toUpperCase() + dateName.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="salary-modal-overlay">
      {/* Background glass overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in duration-200"
        id="salary-modal-content"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-100">Alterar Salário / Renda</h2>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            id="close-salary-modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Valor da Renda (R$)
            </label>
            <div className="relative rounded-xl border border-slate-700 bg-slate-950/50 shadow-inner group focus-within:border-indigo-500 transition-all">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0,00"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                className="w-full bg-transparent py-3 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:outline-none font-semibold text-lg"
                id="salary-amount-input"
                autoFocus
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Ajuste para o mês selecionado: <strong className="text-indigo-400">{formattedMonth}</strong>.
            </p>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 select-none hover:bg-slate-950/60 transition-all cursor-pointer" onClick={() => setUseAsDefault(!useAsDefault)}>
            <input
              type="checkbox"
              id="checkbox-use-default"
              checked={useAsDefault}
              onChange={(e) => setUseAsDefault(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <label htmlFor="checkbox-use-default" className="text-xs font-bold text-slate-200 cursor-pointer">
                Salvar como renda padrão
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Atualiza também seu valor padrão (hoje: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(defaultSalary)}) para os meses futuros sem cadastro.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              id="submit-salary-form"
            >
              Confirmar Renda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
