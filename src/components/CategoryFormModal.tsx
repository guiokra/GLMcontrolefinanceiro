import React, { useState, useEffect } from 'react';
import { X, FolderPlus, Palette, Settings } from 'lucide-react';
import { Category } from '../types';
import { ICON_MAP, CategoryIcon } from './CategoryIcon';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<Category, 'id'>) => void;
  onUpdate: (id: string, category: Omit<Category, 'id'>) => void;
  onDelete: (id: string) => void;
  editingCategory?: Category | null;
}

const PRESET_COLORS = [
  '#3b82f6', // Azul (blue)
  '#10b981', // Verde (green)
  '#a855f7', // Roxo (purple)
  '#eab308', // Amarelo (yellow)
  '#f97316', // Laranja (orange)
  '#ef4444', // Vermelho (red)
  '#f43f5e', // Rose (rose)
  '#ec4899', // Rosa (pink)
  '#06b6d4', // Ciano (cyan)
  '#64748b', // Slate (cinza)
];

export function CategoryFormModal({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  editingCategory,
}: CategoryFormModalProps) {
  const [name, setName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(PRESET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState<string>('HelpCircle');

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name);
        setSelectedColor(editingCategory.color);
        setSelectedIcon(editingCategory.icon);
      } else {
        setName('');
        setSelectedColor(PRESET_COLORS[0]);
        setSelectedIcon('HelpCircle');
      }
    }
  }, [isOpen, editingCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome para a nova categoria.');
      return;
    }

    const payload = {
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    };

    if (editingCategory) {
      // Cannot delete default simulation categories root, but can rename/edit.
      onUpdate(editingCategory.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingCategory) return;
    
    // Warn the user that elements will be transferred to 'Outros'
    if (confirm(`Deseja realmente remover a categoria "${editingCategory.name}"? Todos os gastos vinculados a ela serão automaticamente transferidos para a categoria "Outros".`)) {
      onDelete(editingCategory.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="category-modal-overlay">
      <div 
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in fade-in duration-200 flex flex-col max-h-[90vh]"
        id="category-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FolderPlus size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              {editingCategory ? 'Configurar Categoria' : 'Criar Categoria'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            id="close-category-modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form Scrollable */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1 py-1">
          {/* Group 1: Category Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Transporte, Streaming, Animais"
              maxLength={25}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium transition-all"
              id="category-name-input"
              autoFocus
            />
          </div>

          {/* Group 2: Color picker circles */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Palette size={14} className="text-slate-500" />
              Cor Identificadora
            </label>
            <div className="grid grid-cols-5 xs:grid-cols-10 gap-2.5 bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl justify-items-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`relative w-8 h-8 rounded-full transition-all duration-250 cursor-pointer ${
                    selectedColor === color 
                      ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-slate-900 shadow-md' 
                      : 'hover:scale-105 active:scale-90 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Group 3: Icon Grid Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Settings size={14} className="text-slate-500" />
              Ícone de Categoria
            </label>
            <div className="grid grid-cols-5 gap-3 bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl max-h-[160px] overflow-y-auto">
              {Object.keys(ICON_MAP).map((iconKey) => {
                const isSelected = selectedIcon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setSelectedIcon(iconKey)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition-all border duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 scale-105'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700 active:scale-95'
                    }`}
                    title={iconKey}
                  >
                    <CategoryIcon name={iconKey} size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-slate-950/65 border border-slate-800/60 p-4 rounded-2xl flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview:</span>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900">
              <span 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: selectedColor }}
              >
                <CategoryIcon name={selectedIcon} size={16} />
              </span>
              <span className="text-sm font-bold text-slate-200">
                {name || 'Nome da Categoria'}
              </span>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-800 pt-4 shrink-0">
            <div>
              {editingCategory && editingCategory.id !== 'cat-others' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-950/20 active:scale-95"
                  id="delete-category-btn"
                >
                  Excluir Categoria
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg active:scale-95"
                id="submit-category-form"
              >
                {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
