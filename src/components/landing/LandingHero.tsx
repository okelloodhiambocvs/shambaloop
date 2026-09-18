import React from 'react';
import HeroAvatarLoop from '../HeroAvatarLoop';
import { UserRole } from '../../types';

interface LandingHeroProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  onOpenDoc: (title: string) => void;
  isDarkMode?: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onLoginClick,
  onOpenDoc,
  isDarkMode = false,
}) => {
  return (
    <section
      className={`relative overflow-hidden py-8 md:py-12 px-4 sm:px-6 lg:px-8 border-b border-border-base min-h-[500px] lg:min-h-[560px] flex flex-col justify-center ${
        isDarkMode
          ? 'bg-[#0a120d] text-white'
          : 'bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/20 text-slate-900'
      }`}
    >
      {/* Subtle background radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#8B5E3C]/10 dark:bg-[#8B5E3C]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[480px] lg:min-h-[540px]">
        <HeroAvatarLoop />

        <div className="relative z-20 max-w-2xl lg:max-w-2xl xl:max-w-3xl mx-auto text-center space-y-4 pt-2 pb-1 px-4">
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium font-display tracking-tight leading-[1.12] text-slate-900 dark:text-white">
              The Agricultural Cooperative
            </h1>
            <p className="text-2xl sm:text-4xl md:text-5xl font-medium font-display tracking-tight">
              <span className="text-emerald-600 dark:text-emerald-400">Lease.</span>{' '}
              <span className="text-[#8B5E3C] dark:text-amber-400">Partner.</span>{' '}
              <span className="text-amber-600 dark:text-amber-300">Grow.</span>
            </p>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
            Connecting Kenyan smallholders, diaspora investors, and fertile shamba into an automated asset-sharing marketplace. Fund verified livestock, lease productive land, and secure yield dividends via M-Pesa escrow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
            <button
              onClick={() => onLoginClick('dashboard')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#1F6B3D] hover:bg-[#185530] text-white text-base font-bold tracking-wide shadow-md transition-all cursor-pointer text-center"
              id="hero_cta_join_free_btn"
            >
              <span>Explore Marketplace</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('landing_how_it_works_section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else onOpenDoc('How It Works');
              }}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-base font-bold tracking-wide shadow-sm transition-all cursor-pointer text-center"
              id="hero_cta_how_it_works_btn"
            >
              How It Works
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
