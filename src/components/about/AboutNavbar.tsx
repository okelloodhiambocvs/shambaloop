import React from 'react';
import { Logo } from '../BrandAssets';
import { Sun, Moon, ArrowLeft } from 'lucide-react';

export interface AboutNavbarProps {
  onBack: () => void;
  onLoginClick: () => void;
  onOpenDoc: (doc: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  activePage?: 'about' | 'how-it-works' | 'faq' | 'marketplace';
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
}

export const AboutNavbar: React.FC<AboutNavbarProps> = ({
  onBack,
  onLoginClick,
  onOpenDoc,
  isDarkMode,
  toggleTheme,
  activePage = 'about',
  onNavigateAbout,
  onNavigateHowItWorks,
  onNavigateFaq,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b transition-colors bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Return to Marketplace"
            id="about_nav_back_btn"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Back to Marketplace</span>
          </button>
          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <button
            onClick={onBack}
            className="cursor-pointer focus:outline-none"
            aria-label="ShambaLoop Home"
          >
            <Logo size={40} variant="full" isDarkMode={isDarkMode} />
          </button>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
          <button
            onClick={onBack}
            className={`transition cursor-pointer ${
              activePage === 'marketplace'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => onNavigateAbout ? onNavigateAbout() : onOpenDoc('About Us')}
            className={`transition cursor-pointer ${
              activePage === 'about'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            id="nav_link_about"
          >
            About Us
          </button>
          <button
            onClick={() => onNavigateHowItWorks ? onNavigateHowItWorks() : onOpenDoc('How It Works')}
            className={`transition cursor-pointer ${
              activePage === 'how-it-works'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            id="nav_link_how_it_works"
          >
            How It Works
          </button>
          <button
            onClick={() => onNavigateFaq ? onNavigateFaq() : onOpenDoc('FAQ')}
            className={`transition cursor-pointer ${
              activePage === 'faq'
                ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
            id="nav_link_faq"
          >
            FAQ
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onLoginClick}
            className="px-4 py-2 bg-[#1F6B3D] hover:bg-[#1a5832] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer"
            id="about_nav_login_btn"
          >
            Access Portal
          </button>
        </div>
      </div>
    </header>
  );
};
