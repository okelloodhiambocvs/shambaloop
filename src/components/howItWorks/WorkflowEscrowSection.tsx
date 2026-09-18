import React from 'react';
import { Lock, Scale, CheckCircle2, Shield } from 'lucide-react';
import { UserRole } from '../../types';

interface WorkflowEscrowSectionProps {
  onLoginClick: (role?: UserRole) => void;
}

export const WorkflowEscrowSection: React.FC<WorkflowEscrowSectionProps> = ({ onLoginClick }) => {
  return (
    <section className="py-16 bg-gradient-to-br from-emerald-950 via-[#123821] to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Escrow & Digital Governance Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight">
            How The Three Roles Unite Under Protected Escrow
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-sans">
            Every shilling committed through Safaricom Daraja STK is ring-fenced. No capital is released
            until all tripartite conditions are met and backed by verified documentary evidence.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-emerald-900/40 border border-emerald-700/40 backdrop-blur-sm space-y-3">
            <div className="p-3 bg-emerald-800/80 rounded-2xl w-fit text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white">1. Milestone Locking</h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Investors deposit capital into an escrow vault. Farmers know capital is guaranteed and cannot be arbitrarily withdrawn.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-900/40 border border-emerald-700/40 backdrop-blur-sm space-y-3">
            <div className="p-3 bg-emerald-800/80 rounded-2xl w-fit text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white">2. Multi-Party Signoff</h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Release requires farmer milestone proof (receipts, photos) combined with independent KVB veterinarian health validation.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-900/40 border border-emerald-700/40 backdrop-blur-sm space-y-3">
            <div className="p-3 bg-emerald-800/80 rounded-2xl w-fit text-amber-300">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold font-display text-white">3. Neutral Dispute Room</h3>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              If an unexpected weather event or disagreement arises, any participant can open a dispute room and submit document evidence for mediation.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onLoginClick()}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            id="escrow_section_cta"
          >
            Access Your ShambaLoop Portal
          </button>
        </div>
      </div>
    </section>
  );
};
