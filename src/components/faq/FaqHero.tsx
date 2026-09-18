import React from 'react';
import { HelpCircle, Search } from 'lucide-react';

interface FaqHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const FaqHero: React.FC<FaqHeroProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900/10 via-amber-500/5 to-transparent pt-12 pb-14 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Knowledge Base & Common Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 dark:text-white leading-tight">
            Frequently Asked Questions
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Clear answers about land lease verification, livestock co-ownership, KVB clinical reports,
            M-Pesa escrow protection, and legal dispute mediation.
          </p>

          <div className="mt-8 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search questions (e.g., escrow, title deed, KVB, dispute)..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
              id="faq_search_input"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
