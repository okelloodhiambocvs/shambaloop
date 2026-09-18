import React from 'react';
import { Scale, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TermsModalContent: React.FC = () => {
  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans max-h-[75vh] overflow-y-auto pr-2" id="terms_modal_content">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
          Statutory Framework • Cap 490 & Land Act Compliant
        </span>
        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 font-display">
          Terms & Conditions of Service (ShambaLoop Kenya)
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Effective Date: January 1, 2026 | Last Amended: September 2026 | Document Ref: SL-TOC-KEN-V4
        </p>
      </div>

      {/* Preamble */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-[11.5px] space-y-2">
        <p className="font-semibold text-slate-900 dark:text-white">
          PREAMBLE & BINDING JURISDICTION
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          These Terms and Conditions constitute a legally binding tripartite agreement between ShambaLoop Agricultural Cooperative ("ShambaLoop", "Platform", "we"), registered under the <strong>Cooperative Societies Act (Cap 490, Laws of Kenya)</strong>, and registered platform participants, including smallholder farmers ("Operators"), capital investors ("Financiers"), licensed veterinarians ("Auditors"), and land titleholders ("Landowners"). By creating an account or executing any digital transaction, you consent to and agree to be governed by these terms under the Laws of the Republic of Kenya.
        </p>
      </div>

      {/* Section 1 */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          1. Land Tenancy, Title Deeds & Section 12 Land Act Compliance
        </h5>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <p>
            1.1. <strong>Verification of Title:</strong> All agricultural parcels submitted for leasehold or partnership must be accompanied by valid Title Deeds, Certificates of Lease, or formal Letters of Allotment issued by the Ministry of Lands and Physical Planning. ShambaLoop conducts independent checks against the national land information registry.
          </p>
          <p>
            1.2. <strong>Protection from Adverse Possession:</strong> Pursuant to Section 12 of the Kenya Land Act (No. 6 of 2012), land made available through ShambaLoop is subject to explicit, time-delimited contractual tenancy. Neither the tenant farmer nor the capital partner shall acquire any proprietary right, equity interest, or prescriptive adverse possession claim over the underlying freehold or leasehold land parcel.
          </p>
          <p>
            1.3. <strong>Prohibition of Subletting:</strong> Farmers are strictly prohibited from assigning, subletting, or mortgaging leased parcels to unauthorized third parties without prior written approval from the Landowner and ShambaLoop Registry Administrators.
          </p>
        </div>
      </div>

      {/* Section 2 */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          2. Capital Escrow Custody, Funding Milestones & M-Pesa Rails
        </h5>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <p>
            2.1. <strong>Escrow Isolation:</strong> In accordance with Central Bank of Kenya guidelines and the National Payment System Act, all investor funds deposited for livestock, seed capital, or operational infrastructure are held in dedicated, insolvency-remote escrow custody accounts powered by Safaricom Daraja M-Pesa.
          </p>
          <p>
            2.2. <strong>Phased Milestone Disbursements:</strong> Escrow capital is never released in a lump sum. Release occurs strictly in verified tranches: (a) Initial land preparation and soil treatment; (b) Procurement of ear-tagged, vaccinated heifers or certified seeds; (c) Ongoing maintenance upon positive clinical verification.
          </p>
          <p>
            2.3. <strong>Refund Guarantees:</strong> In the event that a land title check reveals an active encumbrance, court caveat, or boundary dispute, or if purchased dairy livestock fails veterinary inspection within 7 days, 100% of escrowed capital is automatically refunded to the investor's registered M-Pesa account.
          </p>
        </div>
      </div>

      {/* Section 3 */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          3. Farm Management Telemetry, Revenue Splits & Distributions
        </h5>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <p>
            3.1. <strong>Truth in Telemetry:</strong> Farmers agree to log honest, accurate daily milk yields (in Liters) and crop harvest metrics into the Farm Management System (FMS). Falsification or willful misrepresentation of production numbers constitutes a breach of contract and grounds for immediate termination of tenancy.
          </p>
          <p>
            3.2. <strong>Benchmark Milk Pricing:</strong> Dairy outputs are valued according to official Kenya Dairy Board (KDB) regional cooperative collection benchmarks (standard baseline of KES 55–62/L).
          </p>
          <p>
            3.3. <strong>Automated Ledger Settlement:</strong> Production revenues are automatically distributed according to agreed contract terms (standard default: 60% to operating Farmer, 40% to capital Financier, less cooperative maintenance fee of 2.5%). Distributions settle electronically to user wallets and M-Pesa.
          </p>
        </div>
      </div>

      {/* Section 4 */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-emerald-600" />
          4. Veterinary Audits, Animal Welfare & Biosecurity Standards
        </h5>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <p>
            4.1. <strong>KVB Mandate:</strong> Only surgeons and paravets registered with the Kenya Veterinary Board (KVB) under the Veterinary Surgeons and Veterinary Para-Professionals Act (Cap 366) are licensed to submit clinical diagnoses on ShambaLoop.
          </p>
          <p>
            4.2. <strong>Mandatory 14-Day Audits:</strong> All funded dairy cattle must undergo physical inspection every 14 days. Failure by the custodian farmer to grant access to designated veterinarians shall result in an immediate operational warning and potential escrow freeze.
          </p>
          <p>
            4.3. <strong>Humane Husbandry:</strong> Farmers must adhere to the Prevention of Cruelty to Animals Act (Cap 71). Animals must have access to potable water, balanced roughage/dairy meal rations, tick control dipping/spraying, and disease isolation units.
          </p>
        </div>
      </div>

      {/* Section 5 */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          5. Dispute Resolution & Arbitration
        </h5>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] pl-2">
          <p>
            5.1. <strong>Internal Dispute Room:</strong> Any operational or financial discrepancy must first be submitted to the ShambaLoop Dispute Arbitration Room. Payouts for the disputed contract are frozen during inquiry.
          </p>
          <p>
            5.2. <strong>Binding Arbitration:</strong> Unresolved disputes shall be referred to arbitration in Kisumu or Nairobi under the Arbitration Act (No. 4 of 1995) or the Nairobi Centre for International Arbitration (NCIA), conducted by a single arbitrator appointed by the Cooperative Tribunal of Kenya.
          </p>
        </div>
      </div>
    </div>
  );
};
