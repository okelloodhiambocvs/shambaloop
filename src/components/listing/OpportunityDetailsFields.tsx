import React from 'react';

interface OpportunityDetailsFieldsProps {
  durationMonths: number;
  setDurationMonths: (val: number) => void;
  expectedWorkforce: number;
  setExpectedWorkforce: (val: number) => void;
  compensationType: 'Salary' | 'Profit-Share' | 'Mixed';
  setCompensationType: (val: 'Salary' | 'Profit-Share' | 'Mixed') => void;
  skillInput: string;
  setSkillInput: (val: string) => void;
  requiredSkills: string[];
  setRequiredSkills: React.Dispatch<React.SetStateAction<string[]>>;
}

export const OpportunityDetailsFields: React.FC<OpportunityDetailsFieldsProps> = ({
  durationMonths,
  setDurationMonths,
  expectedWorkforce,
  setExpectedWorkforce,
  compensationType,
  setCompensationType,
  skillInput,
  setSkillInput,
  requiredSkills,
  setRequiredSkills,
}) => {
  const handleAddSkill = () => {
    if (skillInput && !requiredSkills.includes(skillInput)) {
      setRequiredSkills([...requiredSkills, skillInput]);
      setSkillInput('');
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Duration (Months)</label>
          <input
            type="number"
            min="1"
            value={durationMonths}
            onChange={(e) => setDurationMonths(Number(e.target.value))}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Workforce Needed</label>
          <input
            type="number"
            min="1"
            value={expectedWorkforce}
            onChange={(e) => setExpectedWorkforce(Number(e.target.value))}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Payout Model</label>
          <select
            value={compensationType}
            onChange={(e) => setCompensationType(e.target.value as any)}
            className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          >
            <option value="Salary">Fixed Salaried / Wages</option>
            <option value="Profit-Share">Pure Profit-Sharing</option>
            <option value="Mixed">Mixed (Salary + Bonus)</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Required Skills / Experience</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="Type e.g., Poultry vaccination, irrigation"
            className="flex-1 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 font-bold hover:bg-emerald-700 text-xs"
          >
            Add
          </button>
        </div>
        {requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {requiredSkills.map((s) => (
              <span key={s} className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <span>{s}</span>
                <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter((i) => i !== s))}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
