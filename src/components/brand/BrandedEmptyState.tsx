import React from 'react';
import { Logo } from './Logo';

interface EmptyStateProps {
  type: 'listings' | 'livestock' | 'land' | 'partnerships' | 'transactions';
  message?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const BrandedEmptyState: React.FC<EmptyStateProps> = ({
  type,
  message,
  ctaText,
  onCtaClick,
  className = ''
}) => {
  const contentMap = {
    listings: {
      title: 'No Market Listings Available',
      defaultDescription: 'We couldn’t find any active farm listings matching your preferences. Check back soon for newly cleared listings.',
    },
    livestock: {
      title: 'No Verified Livestock Assets',
      defaultDescription: 'There are currently no livestock partnerships open in this county. Sponsoring opportunities arise after regular veterinary logs are completed.',
    },
    land: {
      title: 'No Cropland Available for Lease',
      defaultDescription: 'All verified plots in this region are currently under active lease agreements. Submit a custom request to landowners.',
    },
    partnerships: {
      title: 'No Joint Ventures Yet',
      defaultDescription: 'You will see active co-ownerships and yield logs here once you secure a partnership or back an animal profile.',
    },
    transactions: {
      title: 'No Escrow Payments Found',
      defaultDescription: 'Your M-PESA escrow statements and yield payout histories will appear here as soon as they compile.',
    }
  };

  const { title, defaultDescription } = contentMap[type] || contentMap.listings;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-md ${className}`}
      id={`branded_empty_state_${type}`}
    >
      <div className="mb-4 p-3.5 bg-[#f4fcf7] dark:bg-[#0d2c19]/30 rounded-2xl border border-[#1F6B3D]/10">
        <Logo size={42} variant="symbol" />
      </div>
      
      <h4 className="text-sm font-extrabold font-display text-slate-800 dark:text-slate-100 tracking-tight">
        {title}
      </h4>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        {message || defaultDescription}
      </p>

      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F6B3D] hover:bg-[#195631] text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
          id={`btn_cta_empty_state_${type}`}
        >
          <span>{ctaText}</span>
        </button>
      )}
    </div>
  );
};
