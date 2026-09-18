import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  category: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'Platform & Cooperative',
    question: 'What is ShambaLoop and how does it empower the agricultural sector in Kenya?',
    answer: 'ShambaLoop is a digital agricultural trust ecosystem and cooperative registered under Cap 490 of Kenya. We connect smallholder farmers with idle or underutilized land with capital investors and Kenya Veterinary Board (KVB) licensed veterinarians. Through real-time production telemetry and escrow custody, we remove systemic trust barriers and unlock agricultural productivity across Kenya.'
  },
  {
    category: 'Platform & Cooperative',
    question: 'How do the different roles (Farmer, Investor, Veterinarian, Admin) interact?',
    answer: 'Farmers list land and manage day-to-day dairy or crop operations through the Farm Management System (FMS). Investors deploy capital to fund herds or inputs under escrow protection and receive automated revenue splits. Veterinarians conduct scheduled and emergency clinical audits, uploading official health records. Administrators supervise deed validations, regulatory compliance, and dispute arbitrations.'
  },
  {
    category: 'Farmers & Landowners',
    question: 'How does ShambaLoop protect landowners from informal land claims under Kenya law?',
    answer: 'All land lease agreements created on ShambaLoop comply strictly with Section 12 of the Kenya Land Act. The tripartite contract establishes a formal, time-bound tenancy with explicit non-ownership stipulations, protecting titled landowners against adverse possession and boundary creep while granting tenant farmers security of tenure throughout their crop or dairy production cycle.'
  },
  {
    category: 'Farmers & Landowners',
    question: 'What records must farmers maintain on the Farm Management System (FMS)?',
    answer: 'Farmers record daily milk production (morning, midday, and evening yields in Liters), animal feed and mineral supplements, vaccination events, and mortality or calving events. These logs establish transparent, verified production trails that build farmer creditworthiness and ensure accurate revenue distributions.'
  },
  {
    category: 'Investors & Capital Partners',
    question: 'How does Safaricom M-Pesa escrow protect investor capital?',
    answer: 'When an investor finances a herd or parcel proposal, funds are deposited into an isolated escrow custody account powered by Safaricom Daraja M-Pesa integration. Capital is not handed over in lump sum; it is disbursed incrementally based on verified milestone completions, such as land tilling, certified pedigree heifer delivery, or veterinary health clearance.'
  },
  {
    category: 'Investors & Capital Partners',
    question: 'How are production yields and revenue returns calculated and paid out?',
    answer: 'Milk and produce revenues are valued based on prevailing cooperative benchmark rates (e.g., KES 58 per Liter of chilled milk). The revenue is automatically divided according to the contractual split agreed in the partnership proposal (typically 60% to the farmer operator and 40% to the investor). Yield payouts are credited directly to user digital wallets with one-click M-Pesa withdrawals.'
  },
  {
    category: 'Veterinarians & Animal Health',
    question: 'What are the qualifications required for veterinarians on ShambaLoop?',
    answer: 'All participating veterinarians must be registered and in good standing with the Kenya Veterinary Board (KVB) and hold a valid retention certificate. Clinicians upload their KVB registration number, academic credentials, and national ID for administrative verification before they can be assigned clinical audit jobs.'
  },
  {
    category: 'Veterinarians & Animal Health',
    question: 'What triggers an automatic veterinary dispatch or anomaly alert?',
    answer: 'The ShambaLoop telemetry engine calculates a rolling 7-day moving average and standard deviation for milk yields. If an individual cow or herd exhibits a production drop exceeding 15% from its baseline, an automated Anomaly Alert is dispatched to both the investor and a regional veterinary officer for immediate clinical inspection.'
  },
  {
    category: 'Security, Disputes & Compliance',
    question: 'What happens if there is a dispute between a farmer and an investor?',
    answer: 'Either party can open a formal dispute in the ShambaLoop Dispute Room. This automatically halts escrow releases and payout distributions for the affected agreement. The system assigns a neutral regional agricultural supervisor to review photographic proof, telemetry logs, and on-ground reports to deliver a binding resolution within 72 hours.'
  },
  {
    category: 'Security, Disputes & Compliance',
    question: 'How does ShambaLoop protect user data and personal identity?',
    answer: 'ShambaLoop is registered with and strictly adheres to the Office of the Data Protection Commissioner (ODPC) under the Kenya Data Protection Act of 2019. Sensitive data, including National IDs and Title Deed records, are encrypted both in transit and at rest with strict role-based access control.'
  }
];

export const FAQModalContent: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans max-h-[75vh] overflow-y-auto pr-2" id="faq_modal_content">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
          Cooperative Knowledgebase
        </span>
        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 font-display">
          Frequently Asked Questions (FAQ)
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Detailed answers on land leases, M-Pesa escrow, animal health governance, and revenue splits.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-all shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                    {faq.category}
                  </span>
                  <h5 className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                    {faq.question}
                  </h5>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="p-3.5 pt-0 text-[11.5px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800/60 mt-1 leading-relaxed bg-slate-50/50 dark:bg-slate-850/30">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
        <div>
          <span className="font-bold text-emerald-900 dark:text-emerald-300 block">Have additional questions?</span>
          <span>Our Kisumu Regional Support Hub is available 7 days a week: +254 728 606 684</span>
        </div>
        <a
          href="tel:+254728606684"
          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider shrink-0 transition"
        >
          Call Support
        </a>
      </div>
    </div>
  );
};
