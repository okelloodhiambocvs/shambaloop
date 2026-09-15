import React from 'react';
import { Sun, Moon, LogIn, ArrowRight } from 'lucide-react';
import { Logo } from './BrandAssets';
import { UserRole } from '../types';

interface LandingPageProps {
  onLoginClick: (role?: UserRole | 'dashboard') => void;
  onOpenDoc: (title: string) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function LandingPage({
  onLoginClick,
  onOpenDoc,
  isDarkMode = false,
  toggleTheme,
}: LandingPageProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-all duration-300 bg-bg-base text-text-base" id="shambaloop_landing_page">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-30 border-b transition-all duration-300 bg-card-bg/95 backdrop-blur-md border-border-base text-text-base">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={44} variant="full" isDarkMode={isDarkMode} />
          </div>

          {/* Quick short links in header for desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <button
              onClick={() => {
                const el = document.getElementById('landing_about_section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  onOpenDoc('About Us');
                }
              }}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              id="nav_about_us"
            >
              About Us
            </button>
            <button
              onClick={() => onOpenDoc('How It Works')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              id="nav_how_it_works"
            >
              How It Works
            </button>
            <button
              onClick={() => onOpenDoc('FAQ')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              id="nav_faq"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
                  isDarkMode
                    ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700 hover:border-amber-400/50'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-slate-400'
                }`}
                title="Toggle Light / Dark Theme"
                id="landing_theme_toggle_btn"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => onLoginClick('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-[#1F6B3D] text-[#1F6B3D] bg-emerald-50/90 hover:bg-emerald-100 dark:border-emerald-400 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              id="landing_header_login_btn"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => onLoginClick('dashboard')}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#1F6B3D] hover:bg-[#185530] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
              id="landing_header_get_started_btn"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </header>

      <section className={`relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-border-base ${isDarkMode ? 'bg-slate-900/60 text-white' : 'bg-gradient-to-b from-emerald-50/50 to-white text-slate-900'}`}>
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest">
            Kenya's Premier Agritech Cooperative
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-[1.15] text-slate-900 dark:text-white">
            Connecting People, Land, <br className="hidden sm:inline" />
            <span className="text-[#8B5E3C] dark:text-amber-400">Livestock</span>, and{' '}
            <span className="text-[#1F6B3D] dark:text-emerald-400">Opportunity</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Eliminating structural friction for Kenyan smallholders and diaspora investors. Lease idle fertile shamba, fund high-pedigree dairy herds, and enjoy automated yield splits secured by M-Pesa trust escrow.
          </p>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-14 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-card-bg" id="landing_how_it_works_section">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
              Transparent Tri-Partite Model
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
              How ShambaLoop Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Three seamless steps protecting every shilling and hectare of land.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                01
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Discover Verified Assets
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Landowners list verified arable land with certified soil reports. Farmers list animal tags and production yields for open sponsorship.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                02
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                M-Pesa Escrow Protection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Investors and tenant farmers commit funds safely into the trust escrow. Capital is only released once title deeds and livestock health are verified.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                03
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Automated Yield Splits
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Daily milk and harvest metrics are logged in the immutable ledger. Payouts automatically credit both the farmer's and investor's accounts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Consolidated & Detailed About Us Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-slate-900/60" id="landing_about_section">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[11px] uppercase font-extrabold tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
              About ShambaLoop Kenya
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-display text-slate-900 dark:text-white tracking-tight">
              Pioneering Kenya's Agricultural Trust & Productivity Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              ShambaLoop is an enterprise agricultural trust and cooperative digitization infrastructure engineered in Kenya. We eliminate structural friction across East Africa’s agricultural value chains by connecting verified rural farmland, skilled farming operators, urban and diaspora investors, and licensed veterinary professionals into a transparent, high-integrity economic loop.
            </p>
          </div>

          {/* Platform Roles: Admin, Farmer, Investor, Veterinary */}
          <div>
            <div className="text-center mb-6">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                Four Dedicated Trust Roles
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
                Role-Based Architecture & Operational Responsibilities
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Role 1: Admin */}
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-amber-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  1. Platform Administrator
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Registry Supervisors and District Cooperative Officers who authenticate Land Titles, verify GPS perimeter beacons, manage identity KYC, oversee tripartite agreements, and disburse escrow capital milestones.
                </p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <li>• Title Deed & registry verification</li>
                  <li>• Escrow milestone authorization</li>
                  <li>• Neutral dispute arbitration</li>
                </ul>
              </div>

              {/* Role 2: Farmer */}
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-emerald-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  2. Smallholder Farmer
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Skilled agricultural operators and livestock custodians who secure fertile leasehold land, access institutional working capital, log daily production telemetry in the FMS, and maintain herd welfare.
                </p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <li>• Daily yield & harvest telemetry (FMS)</li>
                  <li>• On-demand veterinary dispatch</li>
                  <li>• Fair 60/40 revenue distribution</li>
                </ul>
              </div>

              {/* Role 3: Investor */}
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-purple-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  3. Capital Investor
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Urban and diaspora capital partners who fund high-yielding dairy herds (Friesian, Ayrshire) and commercial horticulture. Track real-time production analytics and receive automated M-Pesa dividends.
                </p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <li>• Escrow-protected capital allocations</li>
                  <li>• 7-day moving-average yield monitors</li>
                  <li>• Direct automated M-Pesa payouts</li>
                </ul>
              </div>

              {/* Role 4: Veterinary */}
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-teal-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  4. Certified Veterinarian
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Kenya Veterinary Board (KVB) licensed doctors and animal health technicians who receive dispatch alerts, conduct bi-weekly clinical audits, certify herd health, and record life events like calving and vaccinations.
                </p>
                <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <li>• Rapid clinical emergency dispatch</li>
                  <li>• Mandatory bi-weekly health audits</li>
                  <li>• Immutable life-event health records</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Core Collaborative Processes */}
          <div className="bg-card-bg p-8 rounded-3xl border border-border-base space-y-6 shadow-xs">
            <div className="border-b border-border-base pb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                Workflow Orchestration
              </span>
              <h3 className="text-xl font-extrabold font-display text-slate-900 dark:text-white mt-1">
                Core Collaborative Processes
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                How ShambaLoop coordinates transactions, verification, and yield distribution across Kenya.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  1. Tripartite & Escrow Binding
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Parties formulate legally binding agricultural contracts backed by Kenya Land Act Section 12. Investor funds are locked safely in Safaricom Daraja M-Pesa escrow buffers, protected against unauthorized disbursement until verified milestones are approved.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  2. Daily FMS & Telemetry
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Farmers record daily milk, crop, and input entries via our mobile Farm Management System. Our algorithmic engine benchmarks yield volumes against 7-day rolling moving averages, alerting stakeholders immediately to any anomalous drop.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  3. Clinical Audits & Settlement
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Accredited veterinarians inspect herds every 14 days, verifying biosecurity and animal health. Cooperative proceeds are calculated systematically and paid directly to member M-Pesa accounts based on agreed revenue-share ratios.
                </p>
              </div>
            </div>
          </div>

          {/* Trust & Architecture Banner */}
          <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-700">
                National Compliance & Governance
              </span>
              <h4 className="text-lg font-bold font-display text-white">
                Governed by Kenya Cooperative Laws & Safaricom Daraja Escrow
              </h4>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Headquartered in Milimani, Kisumu with regional coordination desks across Nyandarua, Nakuru, and Kiambu. We operate strictly in accordance with the Kenya Cooperative Societies Act (Cap 490) and the Office of the Data Protection Commissioner (ODPC Act of 2019).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={() => onLoginClick('dashboard')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow"
              >
                Access Cooperative Portal
              </button>
              <button
                onClick={() => onOpenDoc('About Us')}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer border border-emerald-600"
              >
                Read Official Charter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Page Short Links Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-bg-base" id="landing_short_links_section">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border-base gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Platform Policies & Quick Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore our cooperative documentation and legal governance guidelines.
              </p>
            </div>
            <span className="text-[10px] font-mono text-brand-green dark:text-brand-green-300 font-bold uppercase">
              Kenya ODPC & Cap 490 Compliant
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            {/* 1. About Us */}
            <button
              onClick={() => onOpenDoc('About Us')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_about_us"
            >
              <span>About Us</span>
              <span className="text-[9px] font-normal text-slate-400">Our mission</span>
            </button>

            {/* 2. FAQ */}
            <button
              onClick={() => onOpenDoc('FAQ')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_faq"
            >
              <span>FAQ</span>
              <span className="text-[9px] font-normal text-slate-400">Questions answered</span>
            </button>

            {/* 3. How It Works */}
            <button
              onClick={() => onOpenDoc('How It Works')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_how_it_works"
            >
              <span>How It Works</span>
              <span className="text-[9px] font-normal text-slate-400">Step-by-step</span>
            </button>

            {/* 4. Terms and Conditions */}
            <button
              onClick={() => onOpenDoc('Terms and Conditions')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_terms_conditions"
            >
              <span>Terms & Conditions</span>
              <span className="text-[9px] font-normal text-slate-400">Legal agreement</span>
            </button>

            {/* 5. Privacy Policy */}
            <button
              onClick={() => onOpenDoc('Privacy Notice')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_privacy_policy"
            >
              <span>Privacy Policy</span>
              <span className="text-[9px] font-normal text-slate-400">Data protection</span>
            </button>

            {/* 6. Cookies and Tracking Policy */}
            <button
              onClick={() => onOpenDoc('Cookies Notice')}
              className="p-3.5 rounded-xl border border-border-base bg-card-bg hover:border-emerald-500 hover:shadow-xs transition-all text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex flex-col items-center justify-center gap-1"
              id="shortlink_cookies_policy"
            >
              <span>Cookies & Tracking</span>
              <span className="text-[9px] font-normal text-slate-400">Cookie notice</span>
            </button>
          </div>
        </div>
      </section>

      {/* Policy links remain above; the landing footer is intentionally logo-only. */}
      <footer className={`mt-auto border-t py-6 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`} id="landing_footer">
        <div className="mx-auto flex max-w-7xl justify-center px-4 sm:px-6 lg:px-8">
          <Logo size={36} variant="symbol" isDarkMode={isDarkMode} />
        </div>
        {false && <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <Logo size={42} variant="full" isDarkMode={isDarkMode} />
              <p className={`text-xs leading-relaxed font-sans mt-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Connecting people, land, and opportunity across Kenya. Milimani Estate, Kisumu & Lakeside Basin hubs.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>4-Way Cooperative Ecosystem Live</span>
              </div>
            </div>

            {/* Col 2: About ShambaLoop */}
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>About ShambaLoop</h4>
              <ul className={`space-y-2 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li>
                  <button
                    onClick={() => onOpenDoc('About Us')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    About Us & Our Mission
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenDoc('How It Works')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenDoc('FAQ')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition cursor-pointer text-left"
                  >
                    Frequently Asked Questions (FAQ)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Need Help */}
            <div className="space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Support & Contact</h4>
              <ul className={`space-y-2 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <li>
                  <button
                    onClick={() => onOpenDoc('Chat with us')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Chat with Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenDoc('Help Center')}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Help Center & Disputes
                  </button>
                </li>
                <li className="pt-1">
                  <span className={`text-[10px] uppercase font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Direct Hotline</span>
                  <a href="tel:+254728606684" className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition">
                    +254728606684
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Login Roles */}
            <div className={`space-y-3 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Member Dashboards
              </h4>
              <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Access your dedicated agricultural workspace:
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => onLoginClick(UserRole.ADMIN)}
                  className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer text-left flex justify-between items-center"
                >
                  <span>1. Admin & KYC</span>
                  <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">Supervisor</span>
                </button>
                <button
                  onClick={() => onLoginClick(UserRole.FARMER)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer text-left flex justify-between items-center"
                >
                  <span>2. Farmer Dashboard</span>
                  <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.5 rounded">FMS</span>
                </button>
                <button
                  onClick={() => onLoginClick(UserRole.INVESTOR)}
                  className="py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer text-left flex justify-between items-center"
                >
                  <span>3. Investor Dashboard</span>
                  <span className="text-[9px] bg-purple-800 text-white px-1.5 py-0.5 rounded">Capital</span>
                </button>
                <button
                  onClick={() => onLoginClick(UserRole.VETERINARIAN)}
                  className="py-1.5 px-3 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer text-left flex justify-between items-center"
                >
                  <span>4. Veterinarian Dashboard</span>
                  <span className="text-[9px] bg-teal-800 text-white px-1.5 py-0.5 rounded">Clinical</span>
                </button>
              </div>
            </div>
          </div>

          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between text-[11px] gap-3 ${isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
            <p>© 2026 ShambaLoop. All Rights Reserved. Kenya's Premier Agritech Trust Ecosystem.</p>
            <p className="font-bold uppercase tracking-wider">
              Connecting People, Land, Livestock, and Opportunity
            </p>
          </div>
        </div>
        </>}
      </footer>
    </div>
  );
}
