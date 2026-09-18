import React from 'react';

interface TrustBadgeProps {
  type: 'kvb' | 'land' | 'escrow' | 'agreement' | 'trust';
  showLabel?: boolean;
  className?: string;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  type,
  showLabel = true,
  className = ''
}) => {
  const badgeConfig = {
    kvb: {
      label: 'KVB Veterinary Certified',
      colorClass: 'bg-[#e3f5ea] dark:bg-[#0d2c19]/30 text-[#14532d] dark:text-[#2a8c52] border-[#1f6b3d]/10',
    },
    land: {
      label: 'Title Deed Cleared',
      colorClass: 'bg-[#e3f5ea] dark:bg-[#0d2c19]/30 text-[#14532d] dark:text-[#2a8c52] border-[#1f6b3d]/10',
    },
    agreement: {
      label: 'Secure Digital Deed',
      colorClass: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    },
    escrow: {
      label: 'Escrow Protected',
      colorClass: 'bg-amber-50 dark:bg-[#e3b639]/10 text-[#8B5E3C] dark:text-[#e3b639] border-[#8B5E3C]/20 dark:border-[#e3b639]/20',
    },
    trust: {
      label: 'ShambaLoop Verified',
      colorClass: 'bg-gradient-to-r from-[#e3f5ea] to-amber-50 dark:from-[#0d2c19]/20 dark:to-amber-950/10 text-slate-800 dark:text-slate-200 border-emerald-600/20',
    }
  };

  const config = badgeConfig[type] || badgeConfig.trust;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border leading-none select-none ${config.colorClass} ${className}`}
      id={`trust_badge_${type}`}
    >
      {showLabel && <span>{config.label}</span>}
    </span>
  );
};
