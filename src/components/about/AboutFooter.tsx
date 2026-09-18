import React from 'react';
import { Logo } from '../BrandAssets';
import { Phone, Mail, Clock, MapPin } from 'lucide-react';

export interface AboutFooterProps {
  onBack: () => void;
  onOpenDoc: (doc: string) => void;
  isDarkMode?: boolean;
  onNavigateAbout?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateFaq?: () => void;
}

export const AboutFooter: React.FC<AboutFooterProps> = ({
  onBack,
  onOpenDoc,
  onNavigateAbout,
  onNavigateHowItWorks,
  onNavigateFaq,
}) => {
  return (
    <footer className="bg-[#123821] text-emerald-50 border-t border-emerald-900/60 pt-14 pb-8 font-sans" id="site_universal_footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-emerald-800/50">
          <div className="lg:col-span-4 space-y-4">
            <Logo size={42} variant="full" isDarkMode={true} />
            <p className="text-xs text-emerald-200/80 leading-relaxed max-w-sm">
              Connecting landowners, livestock investors, and smallholder farmers across Kenya.
              Our mission is to unlock idle land, protect herds through clinical governance, and
              build resilient agricultural wealth through automated M-Pesa escrow.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-emerald-900/60 border border-emerald-700/50 rounded-full text-[10px] font-mono font-bold text-amber-300">
                Registered Under Kenya Cap 490 & ODPC Act 2019
              </span>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-display">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-emerald-200/90">
              <li>
                <button onClick={onBack} className="hover:text-white transition cursor-pointer text-left">
                  Marketplace Feed
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateAbout ? onNavigateAbout() : onOpenDoc('About Us')} className="hover:text-white transition cursor-pointer text-left">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateHowItWorks ? onNavigateHowItWorks() : onOpenDoc('How It Works')} className="hover:text-white transition cursor-pointer text-left">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateFaq ? onNavigateFaq() : onOpenDoc('FAQ')} className="hover:text-white transition cursor-pointer text-left">
                  Platform FAQs
                </button>
              </li>
              <li>
                <button onClick={() => onOpenDoc('Cooperative Charter')} className="hover:text-white transition cursor-pointer text-left">
                  Cooperative Charter
                </button>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-display">
              Contact Us
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-200/90">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>+254 728 606 684</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>info@shambaloop.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Milimani Innovation Hub, Kisumu</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Mon - Fri: 8:00 AM - 5:00 PM EAT<br/>Sat: 9:00 AM - 1:00 PM</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-display">
              Regional Agricultural Hubs
            </h4>
            <ul className="space-y-2 text-xs text-emerald-200/90">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Nyandarua Hub:</strong> Ol Kalou Agri-Center</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Nakuru Hub:</strong> Pipeline Agricultural Complex</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Kiambu Hub:</strong> Ruiru Produce Exchange</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Kisumu Hub:</strong> Kibos Sugar & Dairy Depot</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-emerald-300/70">
          <p>© {new Date().getFullYear()} ShambaLoop Kenya Co-operative Trust. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 text-emerald-300/90">
            <button onClick={() => onOpenDoc('Terms of Service')} className="hover:text-white transition cursor-pointer">
              Terms of Service
            </button>
            <span>•</span>
            <button onClick={() => onOpenDoc('Privacy Policy')} className="hover:text-white transition cursor-pointer">
              Privacy Policy (ODPC)
            </button>
            <span>•</span>
            <button onClick={() => onOpenDoc('Cookie Policy')} className="hover:text-white transition cursor-pointer">
              Cookie Preferences
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
