import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { UserRole } from '../../types';

interface HowItWorksHeroProps {
  onLoginClick: (role?: UserRole) => void;
}

export const HowItWorksHero: React.FC<HowItWorksHeroProps> = ({ onLoginClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900/10 via-amber-500/5 to-transparent pt-12 pb-16 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Kenya’s Agricultural Collaboration Framework</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-tight">
            How ShambaLoop Works: A Transparent Flow for Every Participant
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Whether you cultivate land, back livestock portfolios, or provide clinical veterinary oversight,
            ShambaLoop aligns incentives through automated digital deeds, Milestone Escrow, and verified physical proof.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => onLoginClick(UserRole.FARMER)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
              id="hero_start_farmer_btn"
            >
              <span>Get Started as Farmer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onLoginClick(UserRole.INVESTOR)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-emerald-600/40 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
              id="hero_start_investor_btn"
            >
              <span>Explore as Investor</span>
            </button>
            <button
              onClick={() => onLoginClick(UserRole.VETERINARIAN)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-semibold transition cursor-pointer"
              id="hero_start_vet_btn"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>KVB Vet Licensing</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
