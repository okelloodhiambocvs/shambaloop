import React from 'react';
import { SolutionStepItem } from './types';

const SOLUTION_STEPS: SolutionStepItem[] = [
  {
    number: 1,
    image: '/images/lush_golden_crops_1789548009520.jpg',
    category: 'Land & Asset Verification',
    title: 'Verified Land & Livestock Marketplace',
    description:
      'Landowners list idle arable acreage with verified title beacon coordinates. Investors list pedigree dairy cows (Friesian, Ayrshire) and Boer goats with verified registration documents.',
    accentColor: '#1F6B3D',
  },
  {
    number: 2,
    image: '/images/pedigree_cow_livestock_1789547947480.jpg',
    category: 'Clinical & Escrow Governance',
    title: 'KVB Veterinary Audits & Milestone Escrow',
    description:
      'Certified Kenya Veterinary Board clinicians inspect herds and validate animal health. Investor capital remains protected in Safaricom Daraja escrow, released in staged operational milestones.',
    accentColor: '#8B5E3C',
  },
  {
    number: 3,
    image: '/images/dairy_calf_baby_1789547904840.jpg',
    category: 'Yield & Payouts',
    title: 'Daily Telemetry & Automated M-Pesa Splits',
    description:
      'Farmers record daily morning and evening production. Platform ledgers calculate agreed revenue splits and automatically settle net dividends directly to registered M-Pesa mobile wallets.',
    accentColor: '#d97706',
  },
];

export const AboutSolution: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Our Solution
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            A seamless tripartite ecosystem connecting Landowners, Livestock Investors,
            and Verified Smallholder Farmers across Kenya.
          </p>
        </div>

        {/* 3 Numbered Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SOLUTION_STEPS.map((step) => (
            <div
              key={step.number}
              className="bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 shadow-sm hover:shadow-lg transition flex flex-col group"
            >
              {/* Card Image Header with Floating Number Badge */}
              <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Numbered Circle badge modeled after Nyumbani Greens */}
                <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white text-slate-950 font-black flex items-center justify-center text-sm shadow-md border border-slate-100">
                  {step.number}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <span
                    className="text-[11px] font-extrabold uppercase tracking-wider block"
                    style={{ color: step.accentColor }}
                  >
                    {step.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
