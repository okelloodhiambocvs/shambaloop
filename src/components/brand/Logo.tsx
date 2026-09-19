import React, { useId } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'symbol' | 'full' | 'footer';
  isDarkMode?: boolean;
}

/**
 * ShambaLoop Official Vector Logo & Branding Symbol
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

        <path
          d="M 50 12 C 73 12, 88 28, 88 50 C 88 72, 72 88, 50 88 C 28 88, 12 72, 12 50 C 12 28, 27 12, 50 12 Z"
          stroke={`url(#${greenGradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />

        <path
          d="M 32 50 C 32 36, 46 36, 50 50 C 54 64, 68 64, 68 50 C 68 36, 54 36, 50 50 C 46 64, 32 64, 32 50 Z"
          stroke={`url(#${brownGradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        <circle
          cx="50"
          cy="50"
          r="6.5"
          fill={`url(#${goldGradId})`}
          className="animate-pulse"
        />

        <path
          d="M 48 38 C 48 32, 52 26, 57 24 C 57 29, 54 35, 48 38 Z"
          fill={isDark ? "#34d399" : "#1F6B3D"}
        />
      </svg>

      {variant !== 'symbol' && (
        <div className="flex flex-col tracking-tight leading-none">
          <div className="flex items-baseline">
            <span className={`font-extrabold text-lg sm:text-xl font-display ${isDark ? 'text-emerald-200' : 'text-emerald-800 dark:text-emerald-400'}`}>
              Shamba
            </span>
            <span className={`font-black text-lg sm:text-xl font-display ${isDark ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`}>
              Loop
            </span>
            <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold font-mono tracking-wider uppercase border ${isDark ? 'bg-emerald-950/80 text-emerald-200 border-emerald-600/70' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-800'}`}>
              KE
            </span>
          </div>
          <span className={`text-[9px] uppercase font-bold tracking-widest font-sans mt-0.5 ${isDark ? 'text-emerald-100/80' : 'text-slate-500 dark:text-slate-400'}`}>
            Agricultural Trust
          </span>
        </div>
      )}
    </div>
  );
};
