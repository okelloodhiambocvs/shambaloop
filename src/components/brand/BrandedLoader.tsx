import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

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
        <div
          className={`animate-spin rounded-full border-t-[#D4A017] border-r-transparent border-b-[#1F6B3D] border-l-transparent ${sizeClasses[size]}`}
          id="branded_spinner_element"
        />
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
