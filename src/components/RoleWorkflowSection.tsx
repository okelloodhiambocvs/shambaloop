import React, { useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Compass,
  Lock,
  LineChart,
  Wallet,
  Sprout,
  FileText,
  Banknote,
  Stethoscope,
  Award,
  Briefcase,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Layers,
  HeartPulse,
  TrendingUp,
  Clock,
  CircleDollarSign
} from 'lucide-react';
import { UserRole } from '../types';

export type WorkflowRole = 'investor' | 'farmer' | 'veterinary';

interface StepItem {
  stepNumber: string;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  description: string;
  highlights?: string[];
  statusStates?: { label: string; tone: 'neutral' | 'amber' | 'emerald' | 'rose' }[];
  tags?: string[];
}

interface RoleWorkflowData {
  role: WorkflowRole;
  label: string;
  eyebrow: string;
  title: string;
  summary: string;
  userRoleTarget: UserRole;
  steps: StepItem[];
}

const WORKFLOW_DATA: Record<WorkflowRole, RoleWorkflowData> = {
  investor: {
    role: 'investor',
    label: 'Investor',
    eyebrow: 'Capital Partner Journey',
    title: 'How Investors Fund & Grow With Shamba Loop',
    summary: 'Deploy capital securely into verified Kenyan agribusinesses, track verified operational progress in real time, and receive automated yield dividends via M-Pesa escrow.',
    userRoleTarget: UserRole.INVESTOR,
    steps: [
      {
        stepNumber: '01',
        icon: UserPlus,
        heading: 'Create Your Investor Account',
        description: 'Create a free Shamba Loop account in minutes and set up your investor profile.',
        tags: ['Quick Onboarding', 'Diaspora & Local', 'Free Setup']
      },
      {
        stepNumber: '02',
        icon: ShieldCheck,
        heading: 'Get Verified',
        description: 'Complete the required identity and KYC verification checks before participating in agricultural investment opportunities.',
        statusStates: [
          { label: 'Not Started', tone: 'neutral' },
          { label: 'Pending', tone: 'amber' },
          { label: 'Verified', tone: 'emerald' },
          { label: 'Requires Attention', tone: 'rose' }
        ]
      },
      {
        stepNumber: '03',
        icon: Compass,
        heading: 'Create or Select a Farm Opportunity',
        description: 'Submit an investment request or explore available verified farm opportunities and select one that matches your agricultural investment objectives.',
        highlights: [
          'Filter by dairy cattle, horticulture, poultry, or land lease',
          'Review farmer proposals and competitive quotations',
          'Compare risk profiles, location, and projected yields'
        ]
      },
      {
        stepNumber: '04',
        icon: Lock,
        heading: 'Review, Select & Fund',
        description: 'Review farmer proposals, select the appropriate farmer or farm opportunity, agree on the scope, budget and milestones, and fund the investment through Shamba Loop\'s escrow workflow.',
        highlights: [
          'Funds held in controlled escrow, not handed over in lump sum',
          'Milestone allocations: livestock, feed, vet care, inputs, and ops',
          'Expenses benchmarked against recommended market retail prices'
        ]
      },
      {
        stepNumber: '05',
        icon: LineChart,
        heading: 'Track Your Farm',
        description: 'Monitor the farm from the investor dashboard and follow verified progress throughout the investment lifecycle.',
        highlights: [
          'Setup, feed purchases, veterinary visits, and vaccinations',
          'Breeding, pregnancy scans, births, growth, and production logs',
          'Timestamped photographic evidence and certified veterinary reports'
        ]
      },
      {
        stepNumber: '06',
        icon: Wallet,
        heading: 'Earn From Your Farm',
        description: 'When the farm generates verified income or reaches the agreed commercial outcome, the investor\'s applicable earnings are credited to their Shamba Loop wallet according to the investment agreement.',
        highlights: [
          'Transparent accounting: Capital Invested, Allocated, and Used',
          'Audited metrics: Farm Revenue, Costs, and Net Return',
          'Real-time Investor Earnings and Available Wallet Balance'
        ]
      }
    ]
  },
  farmer: {
    role: 'farmer',
    label: 'Farmer',
    eyebrow: 'Agricultural Operator Journey',
    title: 'How Smallholders Scale With Shamba Loop',
    summary: 'Access verified institutional capital, receive input backing, manage production with structured milestones, and get paid predictably for verified farm milestones.',
    userRoleTarget: UserRole.FARMER,
    steps: [
      {
        stepNumber: '01',
        icon: UserPlus,
        heading: 'Create Your Farmer Profile',
        description: 'Create a free account and complete your farmer/provider profile, including relevant farming experience, location, farming category and operational capabilities.',
        tags: ['Free Registration', 'Experience Profile', 'Land & Skills']
      },
      {
        stepNumber: '02',
        icon: ShieldCheck,
        heading: 'Complete Verification',
        description: 'Complete the required identity, farm and applicable accreditation checks so investors can confidently work with verified farmers.',
        highlights: [
          'National ID & Phone verification',
          'Farm & GPS perimeter location check',
          'Farming track record & compliant payment setup'
        ]
      },
      {
        stepNumber: '03',
        icon: FileText,
        heading: 'Find Opportunities & Submit Proposals',
        description: 'View eligible investor requests or agricultural opportunities, submit proposals or quotations, and provide the required scope, budget, timeline and farm plan.',
        highlights: [
          'Browse open investor capital briefs across your county',
          'Submit detailed scope, input needs, and production timelines',
          'Direct agreement on fair 60/40 or custom revenue splits'
        ]
      },
      {
        stepNumber: '04',
        icon: Sprout,
        heading: 'Manage the Farm',
        description: 'Once selected and the investment is funded, manage the agricultural project according to the agreed farm plan, budget and milestones.',
        highlights: [
          'Log daily milk, egg, or crop harvest production records',
          'Submit expense requests and input requirements for approval',
          'Request on-demand veterinary care and upload milestone photos'
        ]
      },
      {
        stepNumber: '05',
        icon: Banknote,
        heading: 'Complete Milestones & Get Paid',
        description: 'As approved work, milestones or agreed commercial outcomes are verified, eligible payments are released according to the agreed terms.',
        highlights: [
          'Milestone payouts: Pending, Approved, and Released Payments',
          'Strict separation of operational farm funds from personal earnings',
          'Direct disbursement to M-Pesa or cooperative bank accounts'
        ]
      }
    ]
  },
  veterinary: {
    role: 'veterinary',
    label: 'Veterinary',
    eyebrow: 'Clinical Professional Journey',
    title: 'How Veterinary Professionals Protect Herd Welfare',
    summary: 'Deliver licensed veterinary oversight, conduct mandatory clinical audits, submit immutable health records, and receive guaranteed milestone payments upon verified care.',
    userRoleTarget: UserRole.VETERINARIAN,
    steps: [
      {
        stepNumber: '01',
        icon: Award,
        heading: 'Create Your Veterinary Profile',
        description: 'Create a free veterinary professional account and provide the required professional and contact information.',
        tags: ['KVB Accredited', 'Animal Health', 'Professional Setup']
      },
      {
        stepNumber: '02',
        icon: FileCheck2,
        heading: 'Verify Your Credentials',
        description: 'Complete identity and professional accreditation verification before becoming eligible to provide veterinary services through Shamba Loop.',
        highlights: [
          'Kenya Veterinary Board (KVB) license authentication',
          'Professional liability and clinical practice credentials',
          'Vetted registry listing preventing unauthorized practice'
        ]
      },
      {
        stepNumber: '03',
        icon: Briefcase,
        heading: 'Find Veterinary Jobs',
        description: 'View veterinary service requests connected to farms within Shamba Loop and submit a quotation or accept eligible assignments depending on the existing marketplace workflow.',
        highlights: [
          'Clinical check-ups, vaccinations, and pregnancy diagnosis',
          'Nutritional audits, breeding services, and health certifications',
          'Emergency intervention dispatch for high-severity herd alerts'
        ]
      },
      {
        stepNumber: '04',
        icon: Stethoscope,
        heading: 'Deliver Veterinary Services',
        description: 'Perform the agreed veterinary work and submit the appropriate evidence and professional report.',
        highlights: [
          'Permanent animal RFID tag record & diagnostic documentation',
          'Medication, treatments, vaccination serials, and recommendations',
          'Tamper-evident reports protected against farmer or investor modification'
        ]
      },
      {
        stepNumber: '05',
        icon: Wallet,
        heading: 'Complete the Job & Get Paid',
        description: 'After the veterinary service is completed and verified according to the agreed workflow, the applicable payment is released to the veterinary professional.',
        highlights: [
          'Clear visibility: Assigned, Open Quotes, Scheduled, and Completed',
          'Automated escrow release upon verified report submission',
          'Instant withdrawal to M-Pesa wallet balance'
        ]
      }
    ]
  }
};

const LIFECYCLE_STAGES = [
  { label: 'Invest', desc: 'Investor selects or creates opportunity' },
  { label: 'Farm', desc: 'Farmer submits proposal & manages farm' },
  { label: 'Verify', desc: 'Vet inspects & verifies livestock health' },
  { label: 'Track', desc: 'Telemetry & milestones recorded' },
  { label: 'Produce', desc: 'Harvest & commercial yield generated' },
  { label: 'Earn', desc: 'Settlement & wallet payouts released' }
];

interface RoleWorkflowSectionProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  isDarkMode?: boolean;
}

export default function RoleWorkflowSection({
  onLoginClick,
  isDarkMode = false
}: RoleWorkflowSectionProps) {
  const [activeRole, setActiveRole] = useState<WorkflowRole>('investor');
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(0);

  const currentWorkflow = WORKFLOW_DATA[activeRole];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const roles: WorkflowRole[] = ['investor', 'farmer', 'veterinary'];
    const currentIndex = roles.indexOf(activeRole);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % roles.length;
      setActiveRole(roles[nextIndex]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + roles.length) % roles.length;
      setActiveRole(roles[prevIndex]);
    }
  };

  return (
    <section
      className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-card-bg transition-colors duration-300"
      id="landing_how_it_works_section"
      aria-label="How Shamba Loop Works"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Heading & Intro */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Transparent, Tripartite Model
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight">
            How Shamba Loop Works
          </h2>

          <p className="text-sm sm:text-base md:text-lg font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            One connected agricultural investment ecosystem protecting every shilling, every animal, and every hectare.
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Shamba Loop seamlessly coordinates three primary participants—<strong className="text-slate-800 dark:text-slate-200">Investor</strong>, <strong className="text-slate-800 dark:text-slate-200">Farmer</strong>, and <strong className="text-slate-800 dark:text-slate-200">Veterinary Professional</strong>—into an accountable, milestone-funded agricultural lifecycle.
          </p>
        </div>

        {/* Segmented Control / Tab Switcher */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            role="tablist"
            aria-label="Workflow participant roles"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            className="w-full max-w-md p-1.5 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-3 gap-1 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="how_it_works_role_switcher"
          >
            {(['investor', 'farmer', 'veterinary'] as WorkflowRole[]).map((roleKey) => {
              const isSelected = activeRole === roleKey;
              const roleData = WORKFLOW_DATA[roleKey];
              return (
                <button
                  key={roleKey}
                  role="tab"
                  id={`tab-${roleKey}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${roleKey}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setActiveRole(roleKey)}
                  className={`relative py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 select-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-[#1F6B3D] dark:text-emerald-400 shadow-md ring-1 ring-black/5 dark:ring-white/10 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <span>{roleData.label}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Select a role to view their specific step-by-step pathway.
          </p>
        </div>

        {/* Active Role Header Banner */}
        <div
          role="tabpanel"
          id={`panel-${currentWorkflow.role}`}
          aria-labelledby={`tab-${currentWorkflow.role}`}
          className="space-y-8 animate-fadeIn"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 p-6 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                {currentWorkflow.eyebrow} · {currentWorkflow.steps.length} Key Steps
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white">
                {currentWorkflow.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {currentWorkflow.summary}
              </p>
            </div>

            <button
              onClick={() => onLoginClick(currentWorkflow.userRoleTarget)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#1F6B3D] hover:bg-[#185530] text-white text-xs font-extrabold uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              id={`join_as_${currentWorkflow.role}_btn`}
            >
              <span>Join as {currentWorkflow.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Workflow Steps Grid */}
          <div
            className={`grid gap-5 ${
              currentWorkflow.steps.length === 6
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
            }`}
          >
            {currentWorkflow.steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={`${currentWorkflow.role}-step-${step.stepNumber}`}
                  className="relative p-5 sm:p-6 rounded-2xl border border-border-base bg-bg-base hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-200 shadow-xs flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Step Number & Icon */}
                    <div className="flex items-center justify-between">
                      <span className="mono-display text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Step {step.stepNumber}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Step Content */}
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white font-display tracking-tight leading-snug">
                      {step.heading}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      {step.description}
                    </p>

                    {/* Optional Verification Status States */}
                    {step.statusStates && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                          Supported KYC States:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {step.statusStates.map((st) => {
                            const toneClasses = {
                              neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                              amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                              emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                              rose: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }[st.tone];
                            return (
                              <span
                                key={st.label}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${toneClasses}`}
                              >
                                {st.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Highlights Bullet List */}
                    {step.highlights && (
                      <ul className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        {step.highlights.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold shrink-0 leading-none mt-0.5">•</span>
                            <span className="leading-tight">{point}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Quick Tags */}
                    {step.tags && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {step.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unified Tripartite Lifecycle Connector: The Integrated Model */}
        <div className="rounded-3xl border border-border-base bg-gradient-to-b from-slate-50/70 to-white dark:from-slate-900/80 dark:to-slate-950 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-base pb-5">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Connected Lifecycle
              </span>
              <h3 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-white mt-0.5">
                INVEST → FARM → VERIFY → TRACK → PRODUCE → EARN
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
                A single unified lifecycle connecting the Investor, Farmer, and Veterinary Professional with milestone-based funds, transparent evidence, and automated returns.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Model:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                Tripartite Escrow
              </span>
            </div>
          </div>

          {/* Lifecycle sequence bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {LIFECYCLE_STAGES.map((stage, sIdx) => (
              <div
                key={stage.label}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black mono-display text-emerald-600 dark:text-emerald-400">
                    0{sIdx + 1}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  {stage.label}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {stage.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Architectural Tripartite Relationship Diagram */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>How The Tripartite Agreement Connects On-Chain & In Escrow</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-1">
                <div className="font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider text-[10px]">
                  1. Capital Provider (Investor)
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Commits working capital into the M-Pesa escrow vault. Capital cannot be drained at once—it unlocks in phased tranches as verified milestones are achieved.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 space-y-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
                  2. Farm Manager (Farmer)
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Provides arable land, daily labor, and animal care. Logs daily production telemetry and submits milestone completion evidence for independent review.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/40 space-y-1">
                <div className="font-bold text-teal-900 dark:text-teal-300 uppercase tracking-wider text-[10px]">
                  3. Clinical Validator (Veterinary)
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  Licensed KVB professionals perform unannounced or scheduled audits, certify vaccination serials, and submit signed reports that authorize milestone releases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
