import React from 'react';

interface LandDetailsFieldsProps {
  acreage: number;
  setAcreage: (val: number) => void;
  soilType: string;
  setSoilType: (val: string) => void;
  waterSource: string;
  setWaterSource: (val: string) => void;
  accessibility: string;
  setAccessibility: (val: string) => void;
  idealCropInput: string;
  setIdealCropInput: (val: string) => void;
  idealCrops: string[];
  setIdealCrops: React.Dispatch<React.SetStateAction<string[]>>;
}

export const LandDetailsFields: React.FC<LandDetailsFieldsProps> = ({
  acreage,
  setAcreage,
  soilType,
  setSoilType,
  waterSource,
  setWaterSource,
  accessibility,
  setAccessibility,
  idealCropInput,
  setIdealCropInput,
  idealCrops,
  setIdealCrops,
}) => {
  const handleAddCrop = () => {
    if (idealCropInput && !idealCrops.includes(idealCropInput)) {
      setIdealCrops([...idealCrops, idealCropInput]);
      setIdealCropInput('');
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Acreage (Acres)</label>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={acreage}
            onChange={(e) => setAcreage(Number(e.target.value))}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Soil Quality / Type</label>
          <input
            type="text"
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Water Infrastructure</label>
          <input
            type="text"
            value={waterSource}
            onChange={(e) => setWaterSource(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Road & Grid Access</label>
          <input
            type="text"
            value={accessibility}
            onChange={(e) => setAccessibility(e.target.value)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Optimal Crops</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={idealCropInput}
            onChange={(e) => setIdealCropInput(e.target.value)}
            placeholder="Type e.g., Maize, French Beans"
            className="flex-1 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
          <button
            type="button"
            onClick={handleAddCrop}
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-bold hover:bg-emerald-700 text-xs"
          >
            Add
          </button>
        </div>
        {idealCrops.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {idealCrops.map((c) => (
              <span key={c} className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                <span>{c}</span>
                <button type="button" onClick={() => setIdealCrops(idealCrops.filter((i) => i !== c))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
