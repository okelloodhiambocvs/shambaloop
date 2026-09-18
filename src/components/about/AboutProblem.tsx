import React from 'react';
import { ProblemCardItem } from './types';

const PROBLEM_CARDS: ProblemCardItem[] = [
  {
    id: 'idle-land',
    image: '/images/lush_golden_crops_1789548009520.jpg',
    badge: 'IDLE ARABLE LAND',
    title: 'Fallow Acreage',
    description:
      'Over 40% of prime Kenyan arable land lies fallow. Absentee and diaspora landowners fear unauthorized encroachment, squatter disputes, and informal tenant defaults without legal leasing.',
  },
  {
    id: 'capital-access',
    image: '/images/african_farmer_portrait_1789549028340.jpg',
    badge: 'CAPITAL BARRIERS',
    title: 'Smallholder Liquidity',
    description:
      'Passionate smallholder farmers and agri-youth have proven operational skills but are locked out of credit and lack collateral to purchase high-yielding dairy cattle or certified seeds.',
  },
  {
    id: 'biosecurity-health',
    image: '/images/pedigree_cow_livestock_1789547947480.jpg',
    badge: 'HERD HEALTH RISKS',
    title: 'Clinical Deficits',
    description:
      'Livestock investments suffer catastrophic losses without certified veterinary supervision, routine vaccination regimes, pedigree breed verification, and daily production telemetry.',
  },
  {
    id: 'trust-escrow',
    image: '/images/baby_lamb_pasture_1789547988863.jpg',
    badge: 'TRUST & ESCROW DEFICIT',
    title: 'Informal Contracts',
    description:
      'Handshake deals, undocumented boundary lines, and unverified brokers create perpetual disputes. Without escrow custody, capital is mismanaged and farmers face unpaid harvests.',
  },
];

export const AboutProblem: React.FC = () => {
  return (
    <section className="py-14 sm:py-18 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight uppercase">
            The Problem
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
            Kenya’s agricultural potential is constrained by fragmented trust, idle
            arable land, and prohibitive capital barriers. Millions of fertile acres
            remain fallow while skilled smallholder farmers and young agri-preneurs
            struggle to access verified farmland and pedigree livestock.
          </p>
        </div>

        {/* 4 Cards Grid modeled after Nyumbani Greens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROBLEM_CARDS.map((card) => (
            <div
              key={card.id}
              className="bg-white dark:bg-slate-850 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-750 shadow-sm hover:shadow-md transition flex flex-col group"
            >
              {/* Card Image Header with Dark Badge */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="inline-block px-3 py-1 bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-extrabold uppercase tracking-wider rounded-lg shadow">
                    {card.badge}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
