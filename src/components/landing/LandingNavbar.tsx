import React from 'react';
import { Sun, Moon, LogIn, ArrowRight } from 'lucide-react';
import { Logo } from '../BrandAssets';
import { UserRole } from '../../types';

interface LandingNavbarProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onLoginClick,
  onOpenDoc,
  onNavigateAbout,
  onNavigateHowItWorks,
  onNavigateFaq,
  isDarkMode = false,
  toggleTheme,
}) => {
  const handleAboutClick = () => {
    if (onNavigateAbout) {
      onNavigateAbout();
    } else {
      const el = document.getElementById('landing_about_section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        onOpenDoc('About Us');
      }
    }
  };

  const handleHowItWorksClick = () => {
    if (onNavigateHowItWorks) {
      onNavigateHowItWorks();
    } else {
      onOpenDoc('How It Works');
    }
  };

  const handleFaqClick = () => {
    if (onNavigateFaq) {
      onNavigateFaq();
    } else {
      onOpenDoc('FAQ');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b transition-all duration-300 bg-card-bg/95 backdrop-blur-md border-border-base text-text-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo size={44} variant="full" isDarkMode={isDarkMode} />
        </div>

        {/* Quick short links in header for desktop */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
          <button
            onClick={handleAboutClick}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            id="nav_about_us"
          >
            About Us
          </button>
          <button
            onClick={handleHowItWorksClick}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            id="nav_how_it_works"
          >
            How It Works
          </button>
          <button
            onClick={handleFaqClick}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
            id="nav_faq"
          >
            FAQ
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Toggle visual theme"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            </button>
          )}

          <button
            onClick={() => onLoginClick()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            id="nav_open_login"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => onLoginClick('investor')}
            className="hidden sm:flex items-center gap-1 px-3.5 py-2 border border-emerald-600/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl text-xs font-bold transition cursor-pointer"
            id="nav_explore_listings"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
