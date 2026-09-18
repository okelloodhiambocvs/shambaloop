import React from 'react';
import { UploadCloud, CheckCircle2, Sprout, DollarSign, FileCheck } from 'lucide-react';
import { UserRole } from '../../types';

interface FarmerWorkflowProps {
  onLoginClick: (role?: UserRole) => void;
}

export const FarmerWorkflow: React.FC<FarmerWorkflowProps> = ({ onLoginClick }) => {
  const steps = [
    {
      step: '01',
      title: 'Register & Upload Land or Farm Documentation',
      desc: 'Create your verified farm profile. Upload supporting documents including land ownership/lease deeds, soil analysis assays, or animal ear-tag registers.',
      icon: UploadCloud,
      tag: 'KYC & Verification'
    },
    {
      step: '02',
      title: 'Submit Structured Production Proposal',
      desc: 'Define your agricultural plan: whether dairy cow management, macadamia planting, or drip horticulture. State exact capital needs and revenue split.',
      icon: FileCheck,
      tag: 'Agri-Proposals'
    },
    {
      step: '03',
      title: 'Sign Smart Tripartite Deed & Unlock Escrow',
      desc: 'Match with interested diaspora or urban capital backers. Capital is locked into safe M-Pesa Escrow and drawn down against verified stage milestones.',
      icon: Sprout,
      tag: 'Milestone Escrow'
    },
    {
      step: '04',
      title: 'Log Operations & Automate Profit Payouts',
      desc: 'Use Farm Management System (FMS) to log feed purchases, veterinary visits, and milk harvest liters. Produce revenues auto-disburse to your M-Pesa.',
      icon: DollarSign,
      tag: 'Instant Settlement'
    }
  ];

  return (
    <section className="py-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-emerald-900/10 shadow-lg group">
              <img
                src="/images/african_farmer_portrait_1789549028340.jpg"
                alt="Kenyan farmer managing crops with ShambaLoop"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="px-2.5 py-1 bg-emerald-600 text-[10px] font-extrabold uppercase tracking-wider rounded-md w-fit mb-2">
                  Farmer Pathway
                </span>
                <h3 className="text-xl font-bold font-display">Zero Collateral Capital Access</h3>
                <p className="text-xs text-slate-200 mt-1">
                  Back your hands-on agricultural labor with verified capital partners without predatory interest rates.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">
                For Farmers & Smallholders
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                Turn Idle Land & Farm Labor into High-Yield Ventures
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
                Gain verified capital backing, input support, and clinical veterinary advice while retaining operational control of your shamba.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:border-emerald-500/40 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400">
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
                onClick={() => onLoginClick(UserRole.FARMER)}
                className="px-5 py-2.5 bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                id="farmer_workflow_cta"
              >
                Launch Your Farm Project
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supports dairy, crops, goat herds & leaseholds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
