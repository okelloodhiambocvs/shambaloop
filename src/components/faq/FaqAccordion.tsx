import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FaqItem } from './faqData';

interface FaqAccordionProps {
  items: FaqItem[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    gen_1: true,
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-lg">
        No matching questions found. Please try another search term or select a different category.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {items.map((item) => {
        const isOpen = !!openIds[item.id];
        return (
          <div key={item.id} className="py-4 sm:py-5">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full flex items-center justify-between gap-4 text-left group cursor-pointer focus:outline-none"
              id={`faq_toggle_${item.id}`}
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                {item.question}
              </span>
              <div
                className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 transition-transform duration-200 shrink-0 ${
                  isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="mt-3 pr-6 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
