import React from 'react';
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={44} variant="full" isDarkMode={isDarkMode} />
          </div>

          {/* Quick short links in header for desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <button
              onClick={() => onOpenDoc('About Us')}
              className="hover:text-brand-green dark:hover:text-brand-green transition-colors cursor-pointer"
              id="nav_about_us"
            >
              About Us
            </button>
            <button
              onClick={() => onOpenDoc('How It Works')}
              className="hover:text-brand-green dark:hover:text-brand-green transition-colors cursor-pointer"
              id="nav_how_it_works"
            >
              How It Works
            </button>
            <button
              onClick={() => onOpenDoc('FAQ')}
              className="hover:text-brand-green dark:hover:text-brand-green transition-colors cursor-pointer"
              id="nav_faq"
            >
              FAQ
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition cursor-pointer text-[11px] uppercase font-bold tracking-wider ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Toggle Light/Dark Theme"
                id="landing_theme_toggle_btn"
              >
                {isDarkMode ? 'Light' : 'Dark'}
              </button>
            )}

            <button
              onClick={() => onLoginClick('dashboard')}
              className="px-4 py-2.5 rounded-xl border border-brand-green/40 text-brand-green hover:bg-brand-green-50 dark:text-brand-green dark:hover:bg-brand-green/10 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              id="landing_header_login_btn"
            >
              Sign In
            </button>

            <button
              onClick={() => onLoginClick(UserRole.FARMER)}
              className="px-4 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow transition-all cursor-pointer"
              id="landing_header_get_started_btn"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section className={`relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-border-base ${isDarkMode ? 'bg-[#2e774a] text-white' : 'bg-white text-black'}`}>
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'border-white/20 bg-white/10 text-white' : 'border-black/15 bg-black/5 text-black'}`}>
            Kenya's Premier Agritech Cooperative
          </div>

          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-black font-display tracking-tight leading-[1.15] ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Connecting People, Land, <br className="hidden sm:inline" />
            <span className={isDarkMode ? 'text-white' : 'text-black'}>Livestock</span>, and{' '}
            <span className={isDarkMode ? 'text-[#c2ffb5]' : 'text-[#1f6b3d]'}>Opportunity</span>
          </h1>

          <p className={`max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-medium leading-relaxed ${isDarkMode ? 'text-white/85' : 'text-black/75'}`}>
            Eliminating structural friction for Kenyan smallholders and diaspora investors. Lease idle fertile shamba, fund high-pedigree dairy herds, and enjoy automated yield splits secured by M-Pesa trust escrow.
          </p>

        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-14 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-border-base ${isDarkMode ? 'bg-[#2e774a]' : 'bg-white'}`} id="landing_how_it_works_section">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-green dark:text-brand-green-300">
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
            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Discover Verified Assets
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Landowners list verified arable land with certified soil reports. Farmers list animal tags and production yields for open sponsorship.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                M-Pesa Escrow Protection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Investors and tenant farmers commit funds safely into the trust escrow. Capital is only released once title deeds and livestock health are verified.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border-base bg-bg-base space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
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

      {/* Landing Page Short Links Section (Explicit User Requirement) */}
      <section className={`py-12 px-4 sm:px-6 lg:px-8 border-b border-border-base ${isDarkMode ? 'bg-[#2e774a]' : 'bg-white'}`} id="landing_short_links_section">
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

      {/* Footer */}
      <footer className={`mt-auto pt-10 pb-8 border-t ${isDarkMode ? 'bg-[#2e774a] text-white border-white/20' : 'bg-white text-black border-black/15'}`} id="landing_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <Logo size={40} variant="symbol" />
              <div className="text-xl font-bold font-display">
                Shamba<span className="text-amber-500">Loop</span>
              </div>
              <p className={`text-xs leading-relaxed font-sans ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                Connecting people, land, and opportunity across Kenya. Milimani Estate, Kisumu & Lakeside Basin.
              </p>
            </div>

            {/* Col 2: About Shambaluke */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider">About Shambaluke</h4>
              <ul className={`space-y-2 text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                <li>
                  <button
                    onClick={() => onOpenDoc('About Us')}
                    className="hover:text-brand-green transition cursor-pointer text-left"
                  >
                    About Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenDoc('FAQ')}
                    className="text-brand-green font-bold hover:text-brand-green-600 transition cursor-pointer text-left"
                  >
                    Frequently Asked Questions (FAQ)
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Need Help */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider">Need Help?</h4>
              <ul className={`space-y-2 text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-black/70'}`}>
                <li>
                  <button
                    onClick={() => onOpenDoc('Chat with us')}
                    className="hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Chat with Us
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onOpenDoc('Help Center')}
                    className="hover:text-emerald-400 transition cursor-pointer text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li className="pt-1">
                  <span className="text-[10px] uppercase font-bold block">Support Hotline</span>
                  <a href="tel:+254728606684" className="font-mono text-xs hover:text-emerald-400 transition">
                    +254728606684
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Quick Login Roles */}
            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Member Access</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Log in directly into your specific workspace role.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => onLoginClick(UserRole.INVESTOR)}
                  className="py-1.5 px-3 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer text-left"
                >
                  Log in as Investor
                </button>
                <button
                  onClick={() => onLoginClick(UserRole.FARMER)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer text-left"
                >
                  Log in as Farmer
                </button>
                <button
                  onClick={() => onLoginClick('dashboard')}
                  className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer text-left"
                >
                  Log in as Dashboard
                </button>
                <button
                  onClick={() => onLoginClick(UserRole.VETERINARIAN)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider transition cursor-pointer text-left"
                >
                  Log in as Veterinarian
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
            <p>© 2026 ShambaLoop. All Rights Reserved. Kenya's Premier Agritech Trust Ecosystem.</p>
            <p className="font-bold uppercase tracking-wider">
              Connecting People, Land, and Opportunity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
