import React from 'react';
import { Search, ShieldAlert, TrendingUp, Landmark, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types';

interface InvestorWorkflowProps {
  onLoginClick: (role?: UserRole) => void;
}

export const InvestorWorkflow: React.FC<InvestorWorkflowProps> = ({ onLoginClick }) => {
  const steps = [
    {
      step: '01',
      title: 'Discover Pre-Vetted Farms & Livestock',
      desc: 'Browse verified listings across Kenya. Each opportunity has title-deed verification, GPS boundaries, and veterinarian health certificates.',
      icon: Search,
    },
    {
      step: '02',
      title: 'Set Investment Criteria & Upload Briefs',
      desc: 'Create bespoke criteria briefs. Upload supporting investment documentation and define preferred counties, animal breeds, or crop cycles.',
      icon: Landmark,
    },
    {
      step: '03',
      title: 'Deposit into Milestone Escrow',
      desc: 'Commit capital via Safaricom Daraja M-Pesa. Funds stay safely held in regulated escrow and are disbursed only as milestones get verified.',
      icon: ShieldAlert,
    },
    {
      step: '04',
      title: 'Real-Time Telemetry & Automated Yields',
      desc: 'Receive live milk yields, clinical vet reports, and harvest logs directly to your dashboard. Revenue shares auto-credit directly to your wallet.',
      icon: TrendingUp,
    }
  ];

  return (
    <section className="py-14 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1">
                For Investors & Diaspora Backers
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                Back Kenyan Agriculture with Clinical Escrow Governance
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                Participate in verified real-economy agriculture without the risk of ghost farms or unmonitored capital leakage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/40 transition shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono font-black text-slate-400">{item.step}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => onLoginClick(UserRole.INVESTOR)}
                className="px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#724a2c] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                id="investor_workflow_cta"
              >
                Start Backing Verified Farms
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>100% Escrow backed with live clinical audits</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border border-amber-900/10 shadow-lg group">
              <img
                src="/public/images/pedigree_cow_livestock_1789547947480.jpg"
                alt="Pedigree dairy cow registered on ShambaLoop"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="px-2.5 py-1 bg-amber-600 text-[10px] font-extrabold uppercase tracking-wider rounded-md w-fit mb-2">
                  Investor Safeguards
                </span>
                <h3 className="text-xl font-bold font-display">Verifiable Biological Assets</h3>
                <p className="text-xs text-slate-200 mt-1">
                  Tag-tracked Friesian & Ayrshire dairy cows inspected weekly by Kenya Veterinary Board registered officers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
