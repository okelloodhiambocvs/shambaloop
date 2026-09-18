import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AboutHeroProps {
  onExplore: () => void;
}

export const AboutHero: React.FC<AboutHeroProps> = ({ onExplore }) => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left narrative content */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1F6B3D] dark:text-emerald-400 font-display tracking-tight leading-[1.15]">
            Karibu ShambaLoop
          </h1>

          <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-sans max-w-2xl">
            At ShambaLoop, we are rooted in Kenyan agricultural heritage and driven
            by cooperative fintech innovation. We make productive land leasing,
            vetted livestock partnerships (dairy cattle, dairy goats, sheep), and certified
            veterinary oversight seamlessly accessible to modern Kenyan farmers,
            diaspora landowners, and urban agri-investors — transparent,
            legally protected, and sustainably managed.
          </p>

          <div className="pt-2">
            <button
              onClick={onExplore}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#1F6B3D] hover:bg-[#17522e] text-white font-bold text-sm rounded-xl transition shadow-md hover:shadow-lg cursor-pointer group"
              id="about_hero_cta_btn"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Right authentic farm image */}
        <div className="lg:col-span-5 relative">
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <img
              src="/images/kenyan_fertile_shamba_1789547934588.jpg"
              alt="Kenyan agricultural shamba with smallholder farmers tending productive crops"
              className="w-full h-72 sm:h-96 object-cover hover:scale-102 transition-transform duration-500"
              loading="eager"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-lg hidden sm:flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Active Leases & Livestock Across 5 Counties
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
