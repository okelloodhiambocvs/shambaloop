import React from 'react';
import { Sun, Moon, LogIn, ArrowRight } from 'lucide-react';
import { Logo } from './BrandAssets';
import { UserRole } from '../types';
import HeroAvatarLoop from './HeroAvatarLoop';
import RoleWorkflowSection from './RoleWorkflowSection';

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

      <section className={`relative overflow-hidden py-8 md:py-12 px-4 sm:px-6 lg:px-8 border-b border-border-base min-h-[500px] lg:min-h-[560px] flex flex-col justify-center ${isDarkMode ? 'bg-[#0a120d] text-white' : 'bg-gradient-to-b from-emerald-50/60 via-white to-emerald-50/20 text-slate-900'}`}>
        {/* Subtle background radial glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#8B5E3C]/10 dark:bg-[#8B5E3C]/5 rounded-full blur-3xl" />
        </div>

        {/* Hero Container with Evenly Flanked Avatars on Both Sides of the Writings */}
        <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[480px] lg:min-h-[540px]">
          {/* Evenly distributed avatars on BOTH sides of the writings */}
          <HeroAvatarLoop />

          {/* Center Hero Content Container - perfectly flanked on both sides */}
          <div className="relative z-20 max-w-2xl lg:max-w-2xl xl:max-w-3xl mx-auto text-center space-y-4 pt-2 pb-1 px-4">

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-medium font-display tracking-tight leading-[1.12] text-slate-900 dark:text-white">
                The Agricultural Cooperative
              </h1>
              <p className="text-2xl sm:text-4xl md:text-5xl font-medium font-display tracking-tight">
                <span className="text-emerald-600 dark:text-emerald-400">Lease.</span>{' '}
                <span className="text-[#8B5E3C] dark:text-amber-400">Partner.</span>{' '}
                <span className="text-amber-600 dark:text-amber-300">Grow.</span>
              </p>
            </div>

            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-normal leading-relaxed text-slate-600 dark:text-slate-300">
              Connecting Kenyan smallholders, diaspora investors, and fertile shamba into an automated asset-sharing marketplace. Fund verified livestock, lease productive land, and secure yield dividends via M-Pesa escrow.
            </p>

            {/* Action CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <button
                onClick={() => onLoginClick('dashboard')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#1F6B3D] hover:bg-[#185530] text-white text-base font-bold tracking-wide shadow-md transition-all cursor-pointer text-center"
                id="hero_cta_join_free_btn"
              >
                <span>Explore Marketplace</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('landing_how_it_works_section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  else onOpenDoc('How It Works');
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-base font-bold tracking-wide shadow-sm transition-all cursor-pointer text-center"
                id="hero_cta_how_it_works_btn"
              >
                How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Interactive How Shamba Loop Works Section */}
      <RoleWorkflowSection onLoginClick={onLoginClick} isDarkMode={isDarkMode} />

      {/* Consolidated & Detailed About Us Section */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8 border-b border-border-base bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-slate-900/60" id="landing_about_section">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-3 max-w-3xl mx-auto">
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
              <h3 className="text-lg sm:text-xl font-medium font-display text-slate-900 dark:text-white mt-1">
                Core Values
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Role 1: Admin */}
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-amber-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Transparency
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
                  Trust
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
              <div className="p-6 rounded-2xl border border-border-base bg-card-bg hover:border-amber-500 transition-all space-y-3 shadow-xs">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Shared Prosperity
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
                  Accountability
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
                  Tripartite & Escrow Binding
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Parties formulate legally binding agricultural contracts backed by Kenya Land Act Section 12. Investor funds are locked safely in Safaricom Daraja M-Pesa escrow buffers, protected against unauthorized disbursement until verified milestones are approved.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Daily FMS & Telemetry
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Farmers record daily milk, crop, and input entries via our mobile Farm Management System. Our algorithmic engine benchmarks yield volumes against 7-day rolling moving averages, alerting stakeholders immediately to any anomalous drop.
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Clinical Audits & Settlement
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

      {/* Landing page footer with 3 short links on the left of the logo and 3 short links on the right */}
      <footer className={`mt-auto border-t py-8 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`} id="landing_footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            {/* Left 3 short links: About Us, FAQs, How It Works */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start sm:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onOpenDoc('About Us')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_about_us"
              >
                About Us
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenDoc('FAQ')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_faq"
              >
                FAQs
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenDoc('How It Works')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_how_it_works"
              >
                How It Works
              </button>
            </div>

            {/* Center Logo */}
            <div className="flex items-center justify-center shrink-0">
              <Logo size={40} variant="symbol" isDarkMode={isDarkMode} />
            </div>

            {/* Right 3 short links: Terms and Conditions, Privacy Policy, Cookie Tracking */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onOpenDoc('Terms and Conditions')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_terms_conditions"
              >
                Terms and Conditions
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenDoc('Privacy Notice')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_privacy_policy"
              >
                Privacy Policy
              </button>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenDoc('Cookies Notice')}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                id="footer_shortlink_cookie_tracking"
              >
                Cookie Tracking
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400 dark:text-slate-500">
            © 2026 ShambaLoop. Kenya's Agricultural Asset-Sharing Marketplace · Cap 490 & ODPC Compliant
          </div>
        </div>
      </footer>
    </div>
  );
}
