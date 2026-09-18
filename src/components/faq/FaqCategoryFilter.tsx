import React from 'react';

interface FaqCategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const FaqCategoryFilter: React.FC<FaqCategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'farmers', label: 'For Farmers' },
    { id: 'investors', label: 'For Investors' },
    { id: 'vets', label: 'Veterinarians' },
    { id: 'escrow', label: 'M-Pesa Escrow' },
    { id: 'legal', label: 'Legal & ODPC' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-6 border-b border-slate-200 dark:border-slate-800">
      {categories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isActive
                ? 'bg-[#1F6B3D] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            id={`faq_filter_${cat.id}`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
};
