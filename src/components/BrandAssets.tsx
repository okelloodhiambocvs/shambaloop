import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'symbol' | 'full' | 'footer';
  isDarkMode?: boolean;
}

/**
 * ShambaLoop Official Vector Logo & Branding Symbol
 * - Design concept: Interlooping circular rings signifying connected ecosystems (Loop)
 * - Woven together with a fresh sprout (Shamba) for agriculture & land
 * - Embedded with a glowing seed of opportunity in Gold
 * - Identical and vibrant in both Light and Dark mode for consistent brand identity
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  variant = 'full',
  isDarkMode = false
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const greenGradId = `logo_green_${uniqueId}`;
  const brownGradId = `logo_brown_${uniqueId}`;
  const goldGradId = `logo_gold_${uniqueId}`;

  const isDark = isDarkMode || variant === 'footer';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`} id="shambaloop_brand_logo_comp">
      {/* SVG Emblem Mark - High-contrast theme-aware styling */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105 drop-shadow-xs"
        id="shambaloop_logo_svg"
        role="img"
        aria-label="ShambaLoop Logo"
      >
        <defs>
          <linearGradient id={greenGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#34d399" : "#1F6B3D"} />
            <stop offset="100%" stopColor={isDark ? "#10b981" : "#2E774A"} />
          </linearGradient>
          <linearGradient id={brownGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? "#fbbf24" : "#8B5E3C"} />
            <stop offset="100%" stopColor={isDark ? "#f59e0b" : "#A2784D"} />
          </linearGradient>
          <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>
        </defs>

        {/* Outer Organic Land/Crop Circle (Shamba) in theme-aware brand Green */}
        <path
          d="M 50 12 C 73 12, 88 28, 88 50 C 88 72, 72 88, 50 88 C 28 88, 12 72, 12 50 C 12 28, 27 12, 50 12 Z"
          stroke={`url(#${greenGradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Moebius-Inspired Connection Loop (Ecosystem Loop) in theme-aware brand Earth/Gold */}
        <path
          d="M 32 50 C 32 36, 46 36, 50 50 C 54 64, 68 64, 68 50 C 68 36, 54 36, 50 50 C 46 64, 32 64, 32 50 Z"
          stroke={`url(#${brownGradId})`}
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Central Connecting Node of Opportunity in glowing brand Warm Gold */}
        <circle
          cx="50"
          cy="50"
          r="8.5"
          fill={`url(#${goldGradId})`}
        />

        {/* Small rising sprout helper leaf on the top-right */}
        <path
          d="M 72 28 C 76 18, 86 14, 86 14 C 86 14, 80 23, 70 26 Z"
          fill={`url(#${goldGradId})`}
        />
      </svg>

      {/* Typography Layout with strict contrast */}
      {variant !== 'symbol' && (
        <div className="flex flex-col leading-none text-left">
          <div className="flex items-baseline gap-0.5" id="logo_title_words">
            <span className={`text-xl font-extrabold font-display tracking-tight ${isDark ? 'text-emerald-400' : 'text-[#1F6B3D]'}`}>
              Shamba
            </span>
            <span className={`text-xl font-bold font-display tracking-tight ${isDark ? 'text-amber-400' : 'text-[#8B5E3C]'}`}>
              Loop
            </span>
          </div>
          <span className={`text-[9px] font-bold tracking-wider uppercase mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {variant === 'footer' ? 'Connecting people, land, and opportunity.' : 'Ecosystem Trust Marketplace'}
          </span>
        </div>
      )}
    </div>
  );
};

interface VerifiedBadgeProps {
  type: 'landowner' | 'livestock' | 'listing' | 'agreement' | 'escrow' | 'trust';
  showLabel?: boolean;
  className?: string;
}

/**
 * Verified Badges signifying high trust across landowners, listings, and assets.
 */
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  type,
  showLabel = true,
  className = ''
}) => {
  const badgeConfig = {
    landowner: {
      label: 'Verified Landowner',
      colorClass: 'bg-[#e3f5ea] dark:bg-[#0d2c19]/30 text-[#1F6B3D] border-[#1F6B3D]/20',
    },
    farmer: {
      label: 'Verified Member',
      colorClass: 'bg-[#e3f5ea] dark:bg-[#0d2c19]/30 text-[#1F6B3D] border-[#1F6B3D]/20',
    },
    livestock: {
      label: 'Verified Asset',
      colorClass: 'bg-[#e3f5ea] dark:bg-[#0d2c19]/30 text-[#1F6B3D] border-[#1F6B3D]/20',
    },
    listing: {
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

interface EmptyStateProps {
  type: 'listings' | 'livestock' | 'land' | 'partnerships' | 'transactions';
  message?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

/**
 * Branded empty states styled with appropriate colors and symbols
 */
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
      defaultDescription: 'Your simulated M-PESA escrow statements and yield payout histories will appear here as soon as they compile.',
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

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * Branded loader showing crop loop animation with brand primary colors
 */
export const BrandedLoader: React.FC<LoaderProps> = ({
  size = 'md',
  label = 'Loading ShambaLoop Ecosystem...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 text-center ${className}`} id="branded_loader_wrapper">
      <div className="relative flex items-center justify-center">
        {/* Spinner ring (Green with Gold indicator) */}
        <div
          className={`animate-spin rounded-full border-t-[#D4A017] border-r-transparent border-b-[#1F6B3D] border-l-transparent ${sizeClasses[size]}`}
          id="branded_spinner_element"
        />
        {/* Mini centered logo node */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60">
          <div className="w-2.5 h-2.5 bg-[#8B5E3C] rounded-full" />
        </div>
      </div>
      {label && (
        <span className="mt-3.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
          {label}
        </span>
      )}
    </div>
  );
};

/**
 * Skeleton Loader UI elements for smooth state changes without content jumping
 */
export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-4 w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 animate-pulse" id="branded_stub_skeleton">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
        </div>
      </div>
      <div className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/5" />
      </div>
    </div>
  );
};
