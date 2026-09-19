import React from 'react';
import { Stethoscope, FileText, CheckCircle2, ShieldCheck, Camera } from 'lucide-react';
import { UserRole } from '../../types';

interface VetWorkflowProps {
  onLoginClick: (role?: UserRole) => void;
}

export const VetWorkflow: React.FC<VetWorkflowProps> = ({ onLoginClick }) => {
  const steps = [
    {
      step: '01',
      title: 'KVB License Verification',
      desc: 'Register with your Kenya Veterinary Board (KVB) accreditation number and national ID to unlock verified veterinarian privileges.',
      icon: ShieldCheck,
    },
    {
      step: '02',
      title: 'Accept Clinical & Health Check Requests',
      desc: 'Get dispatched to local farms for routine vaccination audits, pregnancy ultrasound scans, or emergency livestock care in your county.',
      icon: Stethoscope,
    },
    {
      step: '03',
      title: 'Write Structured Reports & Upload Documentation',
      desc: 'File immutable clinical reports directly from the field. Upload diagnostic photos, treatment prescriptions, and laboratory documentation.',
      icon: Camera,
    },
    {
      step: '04',
      title: 'Authorize Milestones & Receive Instant Fees',
      desc: 'Your clinical sign-off unlocks corresponding milestone capital releases for the farmer, and professional vet service fees disburse immediately.',
      icon: FileText,
    }
  ];

  return (
    <section className="py-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-emerald-900/10 shadow-lg group">
              <img
                src="/images/dairy_calf_baby_1789547904840.jpg"
                alt="Veterinary clinical care for dairy calf on ShambaLoop"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                <span className="px-2.5 py-1 bg-emerald-700 text-[10px] font-extrabold uppercase tracking-wider rounded-md w-fit mb-2">
                  Clinical Oversight
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display">Independent Clinical Governance</h3>
                <p className="text-sm sm:text-base md:text-lg text-slate-200 mt-1">
                  Veterinarians act as independent neutral guardians of animal welfare and biological asset security.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">
                For Veterinary Officers & Field Specialists
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-slate-900 dark:text-white">
                Monetize Clinical Expertise & Safeguard Regional Herd Health
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Deliver digital health audits, prescribe certified treatments, and ensure agricultural partnerships adhere to national veterinary standards.
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
                    <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </div>
                    <p className="text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => onLoginClick(UserRole.VETERINARIAN)}
                className="px-5 py-2.5 bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                id="vet_workflow_cta"
              >
                Join Certified Vet Network
              </button>
              <div className="flex items-center gap-1.5 text-sm sm:text-base md:text-lg text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>KVB-integrated licensing and direct M-Pesa clinical disbursements</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
