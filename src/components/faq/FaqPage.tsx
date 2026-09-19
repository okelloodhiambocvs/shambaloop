import React, { useState, useEffect, useMemo } from 'react';
import { AboutNavbar } from '../about/AboutNavbar';
import { AboutFooter } from '../about/AboutFooter';
import { FaqHero } from './FaqHero';
import { FaqCategoryFilter } from './FaqCategoryFilter';
import { FaqAccordion } from './FaqAccordion';
import { FAQ_ITEMS } from './faqData';
import { UserRole } from '../../types';

interface FaqPageProps {
  onBack: () => void;
  onLoginClick: (role?: UserRole) => void;
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({
  onBack,
  onLoginClick,
  onOpenDoc,
  onNavigateAbout,
  onNavigateHowItWorks,
  isDarkMode,
  toggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <AboutNavbar
        onBack={onBack}
        onLoginClick={() => onLoginClick()}
        onOpenDoc={onOpenDoc}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activePage="faq"
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      <main className="flex-1">
        <FaqHero searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FaqCategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <div className="mt-4">
            <FaqAccordion items={filteredItems} />
          </div>

          <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white">
              Still have questions regarding your shamba or livestock?
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Our regional agricultural liaisons in Nyandarua, Nakuru, Kiambu, and Kisumu are on standby to guide you.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => onOpenDoc('Contact Us')}
                className="px-5 py-2.5 bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Contact Agricultural Liaison
              </button>
              <button
                onClick={() => onLoginClick()}
                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Access Portal
              </button>
            </div>
          </div>
        </div>
      </main>

      <AboutFooter
        onBack={onBack}
        onOpenDoc={onOpenDoc}
        onNavigateAbout={onNavigateAbout}
        onNavigateHowItWorks={onNavigateHowItWorks}
        onNavigateFaq={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
