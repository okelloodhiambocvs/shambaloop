import React from 'react';
import { UserRole } from '../../types';

interface LandingAboutSectionProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  onOpenDoc: (title: string) => void;
  onNavigateAbout?: () => void;
}

export const LandingAboutSection: React.FC<LandingAboutSectionProps> = ({
  onLoginClick,
  onOpenDoc,
  onNavigateAbout,
}) => {
  const handleAboutClick = () => {
    if (onNavigateAbout) {
      onNavigateAbout();
    } else {
      onOpenDoc('About Us');
    }
  };

  return (
    <section
      className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-slate-900/60"
      id="landing_about_section"
    >
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            Pioneering Kenya's Agricultural Trust & Productivity Ecosystem
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            ShambaLoop is an enterprise agricultural trust and cooperative digitization infrastructure engineered in Kenya. We eliminate structural friction across East Africa’s agricultural value chains by connecting verified rural farmland, skilled farming operators, urban and diaspora investors, and licensed veterinary professionals into a transparent, high-integrity economic loop.
          </p>
        </div>

        {/* Platform Roles: Admin, Farmer, Investor, Veterinary */}
        <div>
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-medium font-display text-slate-900 dark:text-white mt-1">
              Core Values & Governance
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-amber-500 transition-all space-y-3 shadow-xs">
              <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Transparency
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Registry Supervisors authenticate Land Titles, verify GPS perimeter beacons, manage identity KYC, and supervise escrow milestones.
              </p>
              <ul className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <li>• Title Deed & registry verification</li>
                <li>• Escrow milestone authorization</li>
                <li>• Neutral dispute arbitration</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-emerald-500 transition-all space-y-3 shadow-xs">
              <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Empowerment
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Skilled agricultural operators secure fertile leasehold land, access capital, log production in the FMS, and maintain herd welfare.
              </p>
              <ul className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <li>• Daily yield & harvest telemetry (FMS)</li>
                <li>• On-demand veterinary dispatch</li>
                <li>• Fair revenue distribution</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-amber-500 transition-all space-y-3 shadow-xs">
              <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Security
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Capital Investors provide asset financing for certified dairy herds with automated M-Pesa returns and real-time anomaly alerts.
              </p>
              <ul className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <li>• Verified livestock assets</li>
                <li>• Automated dividend payouts</li>
                <li>• Daraja escrow safeguards</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-teal-500 transition-all space-y-3 shadow-xs">
              <h3 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Integrity
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Kenya Veterinary Board licensed surgeons audit herd health, perform clinical examinations, and certify production baselines.
              </p>
              <ul className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                <li>• Bi-weekly clinical visits</li>
                <li>• Permanent life-event trails</li>
                <li>• KVB licensed practitioner network</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="rounded-3xl p-6 sm:p-10 bg-slate-900 dark:bg-slate-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
              Transforming Kenyan Agriculture
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black font-display">
              Ready to lease arable land or invest in verified dairy livestock?
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed">
              Join thousands of Kenyan farmers, landowners, and investors building sustainable agricultural wealth through verified smart contracts and Daraja M-Pesa escrow.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onLoginClick('dashboard')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
              >
                Access Cooperative Portal
              </button>
              <button
                onClick={handleAboutClick}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-emerald-600"
              >
                About Us & Cooperative Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
