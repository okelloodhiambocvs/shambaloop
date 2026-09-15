import React, { useState, useRef, useEffect } from 'react';
import { UserRole, ListingType } from '../types';

interface WorkflowTooltipProps {
  role: UserRole;
  actionType: 'propose_lease' | 'partner_equity' | 'pitch_investor' | 'propose_tenant_lease' | 'submit_listing';
  align?: 'left' | 'right' | 'center';
  className?: string;
  buttonLabel?: string;
}

export const WorkflowTooltip: React.FC<WorkflowTooltipProps> = ({
  role,
  actionType,
  align = 'right',
  className = '',
  buttonLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getWorkflowData = () => {
    switch (actionType) {
      case 'propose_lease':
        return {
          title: 'Lease Agreement Workflow',
          subtitle: `Role context: ${role} initiating a Land Lease`,
          badge: 'Escrow Protected',
          steps: [
            {
              title: '1. Secure Lease Holding',
              desc: 'Select acreage and propose your rental period. Funds equal to the contract value are locked in ShambaLoop’s secure M-pesa Escrow.'
            },
            {
              title: '2. Boundary Handover verification',
              desc: 'Landowner reviews the proposal, logs the physical deed certificate, and transfers actual farming rights.'
            },
            {
              title: '3. Graduated Milestone Disbursements',
              desc: 'Funds are disburse to the landowner in scheduled installments (e.g. 50% post-handover, 50% on harvest registration).'
            }
          ],
          roleGuide: role === UserRole.FARMER 
            ? '💡 Pro Tip: Your crop yield predictions are analyzed by our automated AI model to optimize land selections.' 
            : '💡 Pro Tip: Investors can finance leaseholds and hire vetted farmers for direct management.'
        };

      case 'partner_equity':
        return {
          title: 'Livestock Partnership Workflow',
          subtitle: `Role context: ${role} funding shared veterinary assets`,
          badge: 'Continuous Yield Tracking',
          steps: [
            {
              title: '1. Livestock Registration',
              desc: 'Browse pedigrees matching strict veterinary certifications. ShambaLoop audit logs confirm herd health indices.'
            },
            {
              title: '2. Programmatic Equity Splits',
              desc: 'Define split agreements (e.g. 40% Investor, 60% Farmer). System locks joint signatures mathematically.'
            },
            {
              title: '3. Micro-Payout Pipelining',
              desc: 'As raw dairy or beef registers into milk sheds, profits disburse instantly via automated Safaricom M-Pesa.'
            }
          ],
          roleGuide: role === UserRole.INVESTOR
            ? '📈 This ensures direct, transparent exposure to Kenya’s booming food security growth without farming labor.'
            : '💪 Farmers receive guaranteed working capital for feed concentrates and superior veterinary medicines.'
        };

      case 'pitch_investor':
        return {
          title: 'Investor Pitching Workflow',
          subtitle: 'Active business matchmaking',
          badge: 'Capital Infusion Link',
          steps: [
            {
              title: '1. Showcase Specialties',
              desc: 'Submit seed varieties, daily cattle logs, and regional microclimate metrics to the target investor.'
            },
            {
              title: '2. Secure Capital Allocation',
              desc: 'Upon review, interested investors approve the budget, locking specialized funds for land or herd expansion.'
            },
            {
              title: '3. Handshake Execution',
              desc: 'Shared contracts activate, releasing veterinary/input funds to your dashboard to boost yields.'
            }
          ],
          roleGuide: '💡 Tip: Highly complete, verified farmer portfolios achieve 4.5x faster backing rates.'
        };

      case 'propose_tenant_lease':
        return {
          title: 'Lease Proposal Workflow',
          subtitle: 'From Landowner to Tenant',
          badge: 'Secure Idle Land Monetization',
          steps: [
            {
              title: '1. Disclose Fertile Acres',
              desc: 'Select your registered plot and trigger a custom sub-lease pitch directly to searching tenants or capital pools.'
            },
            {
              title: '2. Cryptographical Signature',
              desc: 'Tenants review soil health, water logs, and bind rent deposits via secure M-Pesa escrow structures.'
            },
            {
              title: '3. Secure Residual Income',
              desc: 'Enjoy verified, timely lease payments guaranteed by ShambaLoop holding trusts during cultivation.'
            }
          ],
          roleGuide: '💡 Keep in mind: Registered lands with a verified status receive premium pricing.'
        };

      case 'submit_listing':
        return {
          title: 'Asset Registration Workflow',
          subtitle: 'Adding items to the trust registry',
          badge: 'Title Deed & Health Verifications',
          steps: [
            {
              title: '1. Enter Comprehensive Metrics',
              desc: 'Upload KRA map indexes, plot coordinates, soil pH, or individual livestock ID tag certifications.'
            },
            {
              title: '2. Surveyor & Vet Auditing',
              desc: 'ShambaLoop officers review land records or inspect bovine wellness. Status advances to "Title Deed Cleared".'
            },
            {
              title: '3. Marketplace Activation',
              desc: 'Cleared listings populate the public feed, allowing matching partners to initiate investment instantly.'
            }
          ],
          roleGuide: '🔐 Security Note: All sensitive owner data remains encrypted and is only shared with funded counterparties.'
        };

      default:
        return {
          title: 'ShambaLoop Trust System',
          subtitle: 'Connecting Kenyan Agri-Ecosystems',
          badge: 'Safaricom M-Pesa Integrated',
          steps: [
            {
              title: '1. Escrow Lock',
              desc: 'Funds are securely locked in custody to confirm transactional capability and partnership intent.'
            },
            {
              title: '2. On-the-Ground Audits',
              desc: 'Physical title deeds, soil samples, and livestock tags are checked by ShambaLoop county agents.'
            },
            {
              title: '3. Safe Disbursals',
              desc: 'Installments clear as verification stages complete or production metrics are logged.'
            }
          ],
          roleGuide: '💡 Trust is the seed from which yields grow.'
        };
    }
  };

  const data = getWorkflowData();

  return (
    <div className={`relative inline-block ${className}`} ref={tooltipRef} id={`workflow_tooltip_${actionType}`}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 p-1 px-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 self-center text-xs font-bold"
          title="See workflow guide"
        >
          <span className="text-[11px] font-bold">Guide</span>
          {buttonLabel && <span className="text-[10px] font-bold uppercase tracking-wider">{buttonLabel}</span>}
        </button>
      </div>

      {isOpen && (
        <div 
          className={`absolute z-50 mt-2 w-72 sm:w-85 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all text-slate-800 dark:text-slate-100 ${
            align === 'right' ? 'right-0 origin-top-right' : align === 'left' ? 'left-0 origin-top-left' : 'left-1/2 -translate-x-1/2 origin-top'
          }`}
          style={{ top: '100%' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[8.5px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full dark:bg-emerald-950/50 dark:text-emerald-300">
                {data.badge}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 uppercase tracking-tight font-display">{data.title}</h4>
              <p className="text-[9.5px] text-slate-500 font-mono leading-none mt-0.5">{data.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-bold"
            >
              Close
            </button>
          </div>

          {/* Steps List */}
          <div className="space-y-3 my-3">
            {data.steps.map((step, index) => (
              <div key={index} className="flex gap-2.5 items-start">
                <div className="w-4 h-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] rounded-full flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800">
                  {index + 1}
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[10px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">{step.title}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Role specific guide banner Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 pt-2 text-[10px] text-slate-600 dark:text-slate-350 italic leading-relaxed">
            {data.roleGuide}
          </div>
          
          <div className="mt-1 pb-1 flex justify-end">
            <span className="text-[8px] text-slate-400 font-mono tracking-wider flex items-center gap-1">
              Powered by ShambaLoop Trust
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
