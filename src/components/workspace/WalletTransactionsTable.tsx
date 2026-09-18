import React from 'react';
import { Filter } from 'lucide-react';
import type { LedgerTransaction } from '../../types';

interface WalletTransactionsTableProps {
  transactions: LedgerTransaction[];
  filterPurpose: string;
  onFilterChange: (purpose: string) => void;
}

export const WalletTransactionsTable: React.FC<WalletTransactionsTableProps> = ({
  transactions,
  filterPurpose,
  onFilterChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Ledger Transactions ({transactions.length})
        </h4>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterPurpose}
            onChange={(e) => onFilterChange(e.target.value)}
            className="p-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="ALL">All Categories</option>
            <option value="INVESTMENT">Investment Capital</option>
            <option value="FEED">Feed / Inputs</option>
            <option value="VETERINARY">Veterinary</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-500 border-b dark:border-slate-800">
            <tr>
              <th className="p-2.5">Reference</th>
              <th className="p-2.5">Type</th>
              <th className="p-2.5">Amount</th>
              <th className="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-2.5 font-mono text-[11px] text-slate-500">{t.reference}</td>
                <td className="p-2.5 font-bold">{t.type}</td>
                <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                  KES {t.amountKES?.toLocaleString()}
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
