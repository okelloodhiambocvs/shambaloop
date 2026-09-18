import React from 'react';

interface LivestockDetailsFieldsProps {
  species: 'dairy' | 'poultry' | 'goat';
  setSpecies: (val: 'dairy' | 'poultry' | 'goat') => void;
  breed: string;
  setBreed: (val: string) => void;
  tagId: string;
  setTagId: (val: string) => void;
  expectedYield: string;
  setExpectedYield: (val: string) => void;
  revenueSplitPercent: number;
  setRevenueSplitPercent: (val: number) => void;
  revenueShareConfig: string;
  setRevenueShareConfig: (val: string) => void;
}

export const LivestockDetailsFields: React.FC<LivestockDetailsFieldsProps> = ({
  species,
  setSpecies,
  breed,
  setBreed,
  tagId,
  setTagId,
  expectedYield,
  setExpectedYield,
  revenueSplitPercent,
  setRevenueSplitPercent,
  revenueShareConfig,
  setRevenueShareConfig,
}) => {
  return (
    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Species</label>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value as any)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          >
            <option value="dairy">Dairy Cattle</option>
            <option value="goat">Dairy Goats</option>
            <option value="poultry">Layer/Broiler Poultry</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Breed / Pedigree</label>
          <input
            type="text"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Ear Tag Identifier</label>
          <input
            type="text"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Target Output / Yield</label>
          <input
            type="text"
            value={expectedYield}
            onChange={(e) => setExpectedYield(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
            Investor Payout Share ({revenueSplitPercent}%)
          </label>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={revenueSplitPercent}
            onChange={(e) => setRevenueSplitPercent(Number(e.target.value))}
            className="w-full mt-2 accent-emerald-600"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">
            Distribution Model Notes
          </label>
          <input
            type="text"
            value={revenueShareConfig}
            onChange={(e) => setRevenueShareConfig(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>
    </div>
  );
};
