import React from 'react';
import { Cookie, Shield, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export const CookieModalContent: React.FC = () => {
  return (
    <div className="space-y-6 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-sans max-h-[75vh] overflow-y-auto pr-2" id="cookie_modal_content">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono">
          Transparency & Consent Charter
        </span>
        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg mt-2 font-display">
          Cookie & Local Storage Policy
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Effective: September 2026 | Compliant with ODPC Guidelines and ePrivacy Standards
        </p>
      </div>

      {/* Preamble */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-[11.5px] space-y-2">
        <p className="font-semibold text-slate-900 dark:text-white">
          HOW SHAMBALOOP UTILIZES COOKIES & CLIENT STORAGE
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          ShambaLoop uses small data files stored on your device—including HTTP cookies, browser LocalStorage, and SessionStorage—to maintain your authenticated session, remember your regional county filters, safeguard financial escrow commands against CSRF attacks, and ensure the reliable operation of the Farm Management System (FMS).
        </p>
      </div>

      {/* Cookie Categories */}
      <div className="space-y-3">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Cookie className="w-3.5 h-3.5 text-emerald-600" />
          Categories of Storage Technologies Employed
        </h5>

        <div className="space-y-2.5">
          {/* Strictly Necessary */}
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900 dark:text-white text-xs font-bold">
                1. Strictly Necessary & Security Tokens (Mandatory)
              </strong>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                Always Active
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Essential for logging into your account, verifying cryptographic JWT tokens, securing Safaricom Daraja M-Pesa sessions, preventing cross-site request forgery, and keeping the audit trail uncompromised. The platform cannot function without these.
            </p>
          </div>

          {/* Functional & Preferences */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900 dark:text-white text-xs font-bold">
                2. Preference & Customization Storage
              </strong>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                Configurable
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Preserves user interface settings such as Dark/Light theme mode, preferred Kenyan county view (e.g. Kisumu, Nakuru, Nyandarua), table sorting preferences, and draft inputs in livestock registration forms.
            </p>
          </div>

          {/* Performance & Telemetry */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-slate-900 dark:text-white text-xs font-bold">
                3. Platform Performance & Telemetry Monitoring
              </strong>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                Configurable
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Measures page loading latencies across mobile cellular networks (Safaricom, Airtel), tracks API response times during milk telemetry submissions, and helps diagnose connection drops in remote farming clusters.
            </p>
          </div>
        </div>
      </div>

      {/* Managing Preferences */}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          How to Manage or Clear Cookies
        </h5>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed pl-2">
          You can adjust your browser settings (Chrome, Safari, Firefox, Edge) to block or delete cookies at any time. Note that disabling strictly necessary cookies will prevent successful login, wallet balance querying, and lease signing on ShambaLoop.
        </p>
      </div>

      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
        <strong className="block text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider">
          Inquiries Regarding Cookies
        </strong>
        <p>
          If you have questions regarding our cookie implementation, please email our security operations team at <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">privacy@shambaloop.com</span>.
        </p>
      </div>
    </div>
  );
};
