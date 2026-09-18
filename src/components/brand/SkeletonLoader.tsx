import React from 'react';

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
