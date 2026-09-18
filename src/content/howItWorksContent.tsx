import React from 'react';
import { UserCheck, Shield, Sprout, Coins, Stethoscope, FileCheck, CheckCircle2 } from 'lucide-react';

export const HowItWorksModalContent: React.FC = () => {
  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans max-h-[75vh] overflow-y-auto pr-2" id="how_it_works_modal_content">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
          Operational Architecture Guide
        </span>
        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 font-display">
          How ShambaLoop Works: Complete Step-by-Step Guide
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          A seamless digital ecosystem connecting smallholder farmers, capital investors, and veterinary professionals across Kenya.
        </p>
      </div>

      {/* Role 1: Smallholder Farmer Journey */}
      <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
            <Sprout className="w-4 h-4" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-sm font-display">
            1. For Farmers (Custodians of Production)
          </h5>
        </div>
        <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Profile & Land Verification:</strong> Sign up with National ID and verify land title deeds or allotment letters under Section 12 of the Kenya Land Act to protect tenure security.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Funding Proposals:</strong> Submit capital requests specifying herd breeds (Friesian, Ayrshire) or horticultural inputs with farmer labor and resource commitments.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Daily Telemetry (FMS):</strong> Record morning and evening milk yields, feed consumption, and vaccinations through the mobile-friendly Farm Management System.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Transparent Payouts:</strong> Retain the agreed operational revenue split (e.g. 60%) sent directly to your Safaricom M-Pesa phone number upon milk collection.</span>
          </li>
        </ul>
      </div>

      {/* Role 2: Capital Investor Journey */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-600 text-white">
            <Coins className="w-4 h-4" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-sm font-display">
            2. For Investors (Capital & Oversight Partners)
          </h5>
        </div>
        <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Browse Vetted Opportunities:</strong> Explore verified agricultural parcels, pedigree dairy cattle, and farmer proposals across 47 Kenyan counties.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Escrow Capital Custody:</strong> Fund opportunities securely via Safaricom Daraja M-Pesa. Capital remains in escrow and disburses strictly against verified farm milestones.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Live Production Telemetry:</strong> Track real-time liters produced, revenue charts, and statistical rolling 7-day anomaly indicators from your investor portal.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span><strong>Automated Yield Dividends:</strong> Receive transparent revenue distributions directly into your digital wallet, with instant M-Pesa withdrawals available anytime.</span>
          </li>
        </ul>
      </div>

      {/* Role 3: Veterinarian Clinical Governance */}
      <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-600 text-white">
            <Stethoscope className="w-4 h-4" />
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white text-sm font-display">
            3. For Veterinarians (Clinical & Health Auditors)
          </h5>
        </div>
        <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span><strong>KVB Professional Certification:</strong> Register with Kenya Veterinary Board license and national accreditation to join the verified clinician network.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span><strong>Clinical Service Dispatch:</strong> Accept on-demand clinical inspection requests, emergency call-outs, vaccination drives, and AI breeding services.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span><strong>Verified Diagnostic Reports:</strong> Upload diagnostic findings, treatment records, and photographic proof directly to animal health ledgers.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <span><strong>Automated Professional Fees:</strong> Consultation and service fees are guaranteed by escrow and released upon report publication.</span>
          </li>
        </ul>
      </div>

      {/* Tripartite Agreement & Escrow Architecture */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Legal Tripartite Structure & Dispute Protection
        </h5>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Every partnership on ShambaLoop is bound by a tripartite legal agreement legally registered under the Kenya Cooperative Societies Act (Cap 490) and the Kenya Land Act. The platform acts as an impartial escrow agent and telemetry recorder. In the event of an anomaly or yield discrepancy, our built-in Dispute Room pauses payout schedules and dispatches an independent agricultural extension officer to inspect on-ground reality before funds are settled.
        </p>
      </div>
    </div>
  );
};
