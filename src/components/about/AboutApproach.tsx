import React from 'react';
import { Check } from 'lucide-react';

const APPROACH_CHECKPOINTS = [
  'Certified Title Deed and beacon boundary verification under Section 12 of the Kenya Land Act',
  'Licensed Kenya Veterinary Board (KVB) clinical health audits and genealogical tagging',
  'Automated Safaricom Daraja M-Pesa escrow protection for all lease & capital payments',
  'Transparent daily milk and harvest telemetry with automated 7-day rolling anomaly alerts',
  'Equitable revenue-split contracts with automated electronic settlements to mobile wallets',
];

export const AboutApproach: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left approach text and checkmarks */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
            Our Approach
          </h2>

          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            At ShambaLoop, we believe in transparent, legally anchored, and collaborative
            practices that safeguard landowners, livestock investors, and smallholder
            farmers alike. We work closely with certified surveyors, registered Kenya
            Veterinary Board clinicians, and Safaricom Daraja M-Pesa infrastructure,
            ensuring that every acre is cultivated productively and every animal is
            clinically protected.
          </p>

          <ul className="space-y-3.5 pt-2">
            {APPROACH_CHECKPOINTS.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </span>
                <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right side farmer in field image */}
        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <img
              src="/images/kenyan_woman_farmer_1789547975438.jpg"
              alt="Kenyan agriculturalist inspecting lush crop production and livestock forage"
              className="w-full h-80 sm:h-96 object-cover hover:scale-102 transition-transform duration-500"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
