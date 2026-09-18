import React, { useState, useMemo } from 'react';
import { Wallet, Smartphone, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, LedgerTransaction } from '../../types';
import { sharedWorkspaceApi } from '../../services/sharedWorkspaceService';
import { WalletTransactionsTable } from './WalletTransactionsTable';

interface WalletTabProps {
  user: User;
  wallet: any;
  busy: boolean;
  act: (fn: () => Promise<void>, msg?: string) => Promise<void>;
}

export const WalletTab: React.FC<WalletTabProps> = ({ user, wallet, busy, act }) => {
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositPhone, setDepositPhone] = useState(user.phone || '');
  const [withdrawPhone, setWithdrawPhone] = useState(user.phone || '');
  const [filterPurpose, setFilterPurpose] = useState('ALL');
  const [stkPromptOpen, setStkPromptOpen] = useState(false);
  const [stkData, setStkData] = useState<{ amount: number; phone: string; receipt?: string } | null>(null);

  const transactions: LedgerTransaction[] = wallet?.transactions || [];

  const filteredTransactions = useMemo(() => {
    if (filterPurpose === 'ALL') return transactions;
    return transactions.filter(t => (t.purpose || '').includes(filterPurpose));
  }, [transactions, filterPurpose]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount < 10) return;
    await act(async () => {
      const res = await sharedWorkspaceApi.depositIntent(
        amount,
        `dep_${Date.now()}`,
        'INVESTMENT_CAPITAL',
        depositPhone,
        true
      );
      if (res.error) throw new Error(res.error);
      setStkData({ amount, phone: depositPhone, receipt: res.data?.mpesaReceipt || res.data?.transaction?.reference });
      setStkPromptOpen(true);
      setDepositAmount('');
    }, 'STK Push sent to phone.');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < 10) return;
    await act(async () => {
      const res = await sharedWorkspaceApi.payout(amount, withdrawPhone, true);
      if (res.error) throw new Error(res.error);
      setWithdrawAmount('');
    }, 'Withdrawal request processed to M-Pesa.');
  };

  return (
    <section className="space-y-6" id="participant_wallet_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <span>Safaricom M-Pesa Escrow Wallet</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time balance, instant B2C disbursements, and immutable ledger transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Available Balance</span>
            <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100 font-mono">
              KES {wallet?.balanceKES?.toLocaleString() ?? 0}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">Escrow Locked</span>
            <span className="text-base font-extrabold text-amber-900 dark:text-amber-100 font-mono">
              KES {wallet?.escrowLockedKES?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <button
              onClick={() => setWalletTab('deposit')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                walletTab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Deposit Funds
            </button>
            <button
              onClick={() => setWalletTab('withdraw')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                walletTab === 'withdraw'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Withdraw Funds
            </button>
          </div>

          {walletTab === 'deposit' ? (
            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Deposit Amount (KES)
                </label>
                <input
                  type="number"
                  min="10"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Initiate STK Push Deposit</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Withdrawal Amount (KES)
                </label>
                <input
                  type="number"
                  min="10"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 2500"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Recipient M-Pesa Phone
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full p-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>Request M-Pesa B2C Withdrawal</span>
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Escrow Security & Guarantee</span>
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Investor funds deposited are held in central cooperative escrow until milestones (veterinary check, yield distribution) are verified on-chain and through cooperative audit.
            </p>
          </div>

          {stkPromptOpen && stkData && (
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">STK Push Dispatched</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Prompt for KES {stkData.amount.toLocaleString()} dispatched to {stkData.phone}.
              </p>
              <button
                onClick={() => setStkPromptOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      <WalletTransactionsTable
        transactions={filteredTransactions}
        filterPurpose={filterPurpose}
        onFilterChange={setFilterPurpose}
      />
    </section>
  );
};
