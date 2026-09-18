import React, { useEffect, useMemo, useState } from 'react';
import { 
  AlertCircle, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Download, FileText, Filter, 
  MessageSquareQuote, PhoneCall, Plus, ShieldCheck, Smartphone, Star, UploadCloud, Wallet, Zap 
} from 'lucide-react';
import type { LivestockPartnership, User, UploadedFile, Review, LedgerTransaction } from '../types';
import { sharedWorkspaceApi, readFileAsBase64 } from '../services/sharedWorkspaceService';
import ReviewModal from './ReviewModal';
import { MpesaLinkPanel } from './MpesaLinkPanel';

type Mode = 'fms' | 'wallet' | 'disputes' | 'reviews';

const formatDate = (v: string) => new Date(v).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

export default function ParticipantWorkspace({ 
  user, 
  partnerships, 
  mode 
}: { 
  user: User; 
  partnerships: LivestockPartnership[]; 
  mode: Mode;
}) {
  const [records, setRecords] = useState<any[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [wallet, setWallet] = useState<any>();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviewData, setReviewData] = useState<{ received: Review[]; written: Review[]; averageRating: number } | null>(null);
  const [eligible, setEligible] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Wallet purpose & M-Pesa state
  const defaultPurpose = user.role === 'investor' ? 'INVESTMENT_CAPITAL' : 'CLINICAL_SUPPLIES';
  const [walletTab, setWalletTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositPurpose, setDepositPurpose] = useState(defaultPurpose);
  const [depositPhone, setDepositPhone] = useState(user.phone || '');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState(user.phone || '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [stkPromptOpen, setStkPromptOpen] = useState(false);
  const [stkData, setStkData] = useState<{ amount: number; phone: string; receipt?: string } | null>(null);
  const [filterPurpose, setFilterPurpose] = useState('ALL');

  const participantFarmIds = useMemo(() => {
    return Array.from(new Set(partnerships.map(p => `farm_${p.farmerId}`)));
  }, [partnerships]);

  const load = async () => {
    setError('');
    if (mode === 'fms') {
      const recordsResult = await sharedWorkspaceApi.records();
      const docResults = await Promise.all(participantFarmIds.map(id => sharedWorkspaceApi.documents(id)));
      if (recordsResult.data) setRecords(recordsResult.data);
      setDocuments(docResults.flatMap(r => r.data || []));
      if (recordsResult.error || docResults.some(r => r.error)) {
        setError(recordsResult.error || docResults.find(r => r.error)?.error || 'Unable to load farm management records.');
      }
    }
    if (mode === 'wallet') {
      const r = await sharedWorkspaceApi.wallet();
      if (r.data) setWallet(r.data);
      else setError(r.error || 'Unable to load wallet summary.');
    }
    if (mode === 'disputes') {
      const r = await sharedWorkspaceApi.disputes();
      if (r.data) setDisputes(r.data);
      else setError(r.error || 'Unable to load disputes.');
    }
    if (mode === 'reviews') {
      const [r, e] = await Promise.all([
        sharedWorkspaceApi.reviews(),
        sharedWorkspaceApi.eligibleReviews()
      ]);
      if (r.data) setReviewData(r.data);
      if (e.data) setEligible(e.data);
      if (r.error || e.error) setError(r.error || e.error || 'Unable to load reviews.');
    }
  };

  useEffect(() => {
    void load();
  }, [mode, user.id, participantFarmIds.join(':')]);

  const act = async (fn: () => Promise<void>, msg?: string) => {
    setBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      await fn();
      if (msg) setSuccessMsg(msg);
      await load();
    } catch (e: any) {
      setError(e.message || 'Action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  // Filtered transactions for wallet
  const filteredTransactions = useMemo(() => {
    const list: LedgerTransaction[] = wallet?.recentTransactions || [];
    if (filterPurpose === 'ALL') return list;
    return list.filter(t => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      const p = ((t as any).purpose || '').toLowerCase();
      const target = filterPurpose.toLowerCase();
      return desc.includes(target) || cat.includes(target) || p.includes(target);
    });
  }, [wallet, filterPurpose]);

  /* ========================================================================= */
  /* MODE 1: FARM MANAGEMENT SYSTEM (FMS)                                     */
  /* ========================================================================= */
  if (mode === 'fms') {
    return (
      <section className="space-y-6" id="participant_fms_view">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold dark:text-white">Farm Management System & Documentation</h3>
            <p className="text-xs text-slate-500">
              Access certified livestock records, vaccination reports, deeds, and field logs.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Form for Collaborators */}
        {participantFarmIds.length > 0 && (
          <form
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const file = f.get('file') as File;
              const targetFarm = String(f.get('targetFarm') || participantFarmIds[0]);
              void act(async () => {
                if (!file?.size) throw new Error('Please select a file to upload.');
                const base64 = await readFileAsBase64(file);
                const res = await sharedWorkspaceApi.upload({
                  fileName: file.name,
                  mimeType: file.type,
                  base64Data: base64,
                  farmId: targetFarm,
                  documentType: f.get('documentType'),
                  description: f.get('description')
                });
                if (res.error) throw new Error(res.error);
                e.currentTarget.reset();
              }, 'Document uploaded to farm archive.');
            }}
          >
            <div className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-emerald-600" />
              <strong className="text-xs font-bold dark:text-white">
                Upload Authorized Inspection / Audit Document
              </strong>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Target Farm</span>
                <select
                  name="targetFarm"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
                >
                  {participantFarmIds.map(id => (
                    <option key={id} value={id}>Partner Farm ({id})</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Document Type</span>
                <select
                  name="documentType"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
                >
                  <option value="VETERINARY_REPORT">Veterinary Health & Clinical Report</option>
                  <option value="VACCINATION_REPORT">Vaccination & Immunization Certificate</option>
                  <option value="EVENT_DOCUMENT">Inspection Audit & Compliance Report</option>
                  <option value="FEED_RECEIPT">Feed / Financial Disbursement Receipt</option>
                  <option value="LAND_TITLE_DEED">Land Title Deed / Lease Addendum</option>
                  <option value="OTHER">Other Partner Documentation</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Select File</span>
                <input
                  required
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800 cursor-pointer"
                />
              </label>
            </div>
            <input
              name="description"
              placeholder="Note or certified reference (e.g. Semi-annual clinical audit check)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <button disabled={busy} className="action-primary">
              {busy ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        )}

        {/* Authorized Documents Section */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold dark:text-white flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-emerald-600" />
            <span>Authorized Documentation ({documents.length})</span>
          </h4>
          {documents.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2"
                >
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {(doc.documentType || 'DOCUMENT').replaceAll('_', ' ')}
                    </span>
                    <h5 className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.originalName}>
                      {doc.originalName}
                    </h5>
                    {doc.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                    <span>{formatDate(doc.createdAt)}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-slate-500 border rounded-xl dark:border-slate-800">
              No authorized documents have been shared for your collaborations yet.
            </p>
          )}
        </section>

        {/* Authorized Activity Records */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold dark:text-white">Partner Farm Activity Logs ({records.length})</h4>
          {records.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-500 border-b dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Quantity</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">{r.date}</td>
                      <td className="p-2.5 font-bold">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800">
                          {r.recordType}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200">{r.description}</td>
                      <td className="p-2.5 font-medium">{r.quantity} {r.unit}</td>
                      <td className="p-2.5 text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-slate-500">No farm activities recorded yet.</p>
          )}
        </section>
      </section>
    );
  }

  /* ========================================================================= */
  /* MODE 2: WALLET WITH M-PESA DARAJA INTEGRATION                             */
  /* ========================================================================= */
  if (mode === 'wallet') {
    return (
      <section className="space-y-6" id="participant_wallet_view">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold dark:text-white">Cooperative Wallet & M-Pesa Escrow</h3>
            <p className="text-xs text-slate-500">
              Direct Safaricom Daraja integration for instant escrow deposits, payouts, and ledger settlements.
            </p>
          </div>
          {/* Daraja API live status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Daraja Gateway: Paybill 4128901 • Active</span>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Balance</span>
            <strong className="mt-1 block text-xl text-emerald-700 dark:text-emerald-400 font-extrabold">
              KES {(wallet?.availableBalanceKES || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-400">Withdrawable / Escrow capital</span>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {user.role === 'investor' ? 'Disbursed Investment & Returns' : 'Clinical & Farm Earnings'}
            </span>
            <strong className="mt-1 block text-xl text-amber-700 dark:text-amber-400 font-extrabold">
              KES {((wallet?.returnsKES || wallet?.earningsKES || wallet?.farmerEarningsKES) || 0).toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-400">Total ledger transactions</span>
          </div>
        </div>

        {/* M-Pesa Daraja Actions: Deposit vs Withdraw Tabs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWalletTab('deposit')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  walletTab === 'deposit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                id="tab_wallet_mpesa_deposit"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" />
                <span>M-Pesa STK Deposit</span>
              </button>
              <button
                type="button"
                onClick={() => setWalletTab('withdraw')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  walletTab === 'withdraw'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                id="tab_wallet_mpesa_withdraw"
              >
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                <span>M-Pesa B2C Withdrawal</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Instant settlement via Safaricom API
            </span>
          </div>

          {/* TAB 1: M-PESA STK DEPOSIT */}
          {walletTab === 'deposit' && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                const amount = Number(depositAmount);
                if (!amount || amount < 100) {
                  setError('Minimum deposit is KES 100.');
                  return;
                }
                const phone = depositPhone.trim() || user.phone;
                setBusy(true);
                setError('');
                void act(async () => {
                  const r = await sharedWorkspaceApi.depositIntent(amount, crypto.randomUUID(), depositPurpose, phone, true);
                  setBusy(false);
                  if (r.error) {
                    throw new Error(r.error);
                  }
                  setDepositAmount('');
                  setStkData({
                    amount,
                    phone,
                    receipt: r.data?.mpesaReceipt
                  });
                  setStkPromptOpen(true);
                }, `M-Pesa STK Push initiated for KES ${amount.toLocaleString()}`);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Kenyan Mobile Number</span>
                  <input
                    required
                    type="text"
                    value={depositPhone}
                    onChange={e => setDepositPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
                    id="mpesa_deposit_phone"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Amount (KES)</span>
                  <input
                    required
                    min="100"
                    type="number"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="e.g. 5,000"
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800 font-bold"
                    id="mpesa_deposit_amount"
                  />
                </label>

                <label className="block">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Purpose</span>
                  <select
                    value={depositPurpose}
                    onChange={e => setDepositPurpose(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800 font-medium"
                    id="participant_select_deposit_purpose"
                  >
                    {user.role === 'investor' ? (
                      <>
                        <option value="INVESTMENT_CAPITAL">Milestone Capital Allocation</option>
                        <option value="FEED_PURCHASE">Livestock Feed & Nutrition</option>
                        <option value="VETERINARY_FEES">Veterinary Care Retainer</option>
                        <option value="LAND_LEASE">Agricultural Land Lease Escrow</option>
                        <option value="ESCROW_SECURITY">Cooperative Escrow Guarantee</option>
                      </>
                    ) : (
                      <>
                        <option value="CLINICAL_SUPPLIES">Clinical Supplies & Vaccines</option>
                        <option value="EQUIPMENT_LEASE">Diagnostic Equipment Lease</option>
                        <option value="TRAVEL_AUDIT">Travel & Farm Inspection Fee</option>
                        <option value="ESCROW_SECURITY">Cooperative Escrow Guarantee</option>
                      </>
                    )}
                  </select>
                </label>
              </div>

              {/* Quick amount presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-medium">Quick Amount:</span>
                {[1000, 5000, 20000, 50000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(String(amt))}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                  >
                    +KES {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                disabled={busy}
                type="submit"
                className="action-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider"
                id="participant_btn_initiate_stk_push"
              >
                <Smartphone className="h-4 w-4" />
                <span>{busy ? 'Connecting to Daraja...' : 'Initiate M-Pesa STK Push'}</span>
              </button>
            </form>
          )}

          {/* TAB 2: M-PESA B2C WITHDRAWAL */}
          {walletTab === 'withdraw' && (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                const amount = Number(withdrawAmount);
                if (!amount || amount < 50) {
                  setError('Minimum withdrawal is KES 50.');
                  return;
                }
                const available = wallet?.availableBalanceKES || 0;
                if (amount > available) {
                  setError(`Amount exceeds your available balance of KES ${available.toLocaleString()}.`);
                  return;
                }
                const phone = withdrawPhone.trim() || user.phone;
                setBusy(true);
                setError('');
                void act(async () => {
                  const r = await sharedWorkspaceApi.payout(amount, phone, true);
                  setBusy(false);
                  if (r.error) {
                    throw new Error(r.error);
                  }
                  setWithdrawAmount('');
                }, `M-Pesa B2C Payout of KES ${amount.toLocaleString()} disbursed to ${phone}.`);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Recipient Mobile Number</span>
                  <input
                    required
                    type="text"
                    value={withdrawPhone}
                    onChange={e => setWithdrawPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
                    id="mpesa_withdraw_phone"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Withdraw Amount (KES)</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(wallet?.availableBalanceKES || 0))}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Max: KES {(wallet?.availableBalanceKES || 0).toLocaleString()}
                    </button>
                  </div>
                  <input
                    required
                    min="50"
                    max={wallet?.availableBalanceKES || 0}
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 2,500"
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800 font-bold"
                    id="mpesa_withdraw_amount"
                  />
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
                Disbursements are processed in real-time to the recipient's Safaricom M-Pesa line via Daraja B2C Bulk API. Standard network carrier charges apply.
              </div>

              <button
                disabled={busy || !wallet?.availableBalanceKES || (Number(withdrawAmount) > (wallet?.availableBalanceKES || 0))}
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
                id="participant_btn_disburse_mpesa_payout"
              >
                <ArrowUpFromLine className="h-4 w-4" />
                <span>{busy ? 'Processing Disbursement...' : 'Disburse to M-Pesa (B2C)'}</span>
              </button>
            </form>
          )}
        </div>

        {/* STK Push Feedback Modal */}
        {stkPromptOpen && stkData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">M-Pesa STK Prompt Sent</h4>
                <p className="text-xs text-slate-500 mt-1">
                  A payment prompt for <strong className="text-slate-900 dark:text-white">KES {stkData.amount.toLocaleString()}</strong> has been sent to subscriber <strong className="text-slate-900 dark:text-white">{stkData.phone}</strong>.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 text-left space-y-1 font-mono">
                <div className="flex justify-between"><span>Merchant:</span><strong>ShambaLoop Escrow</strong></div>
                <div className="flex justify-between"><span>Paybill:</span><strong>4128901</strong></div>
                <div className="flex justify-between"><span>Receipt:</span><strong>{stkData.receipt || 'NL9384K78'}</strong></div>
                <div className="flex justify-between"><span>Status:</span><strong className="text-emerald-600">SETTLED</strong></div>
              </div>
              <button
                onClick={() => setStkPromptOpen(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close & Return to Ledger
              </button>
            </div>
          </div>
        )}

        {/* Transaction History with Filter Dropdown */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 dark:border-slate-800">
            <h4 className="text-xs font-bold dark:text-white flex items-center gap-1.5">
              <span>Transaction History</span>
              <span className="text-[10px] text-slate-400 font-normal">({filteredTransactions.length} records)</span>
            </h4>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={filterPurpose}
                onChange={e => setFilterPurpose(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                id="participant_filter_transactions_by_purpose"
              >
                <option value="ALL">All Purpose Categories</option>
                <option value="INVESTMENT">Investment Capital</option>
                <option value="FEED">Livestock Feed & Nutrition</option>
                <option value="VETERINARY">Veterinary Services</option>
                <option value="CLINICAL">Clinical Supplies</option>
                <option value="ESCROW">Escrow Allocations</option>
              </select>
            </div>
          </div>

          {filteredTransactions.length ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-500 border-b dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Reference</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Purpose / Description</th>
                    <th className="p-2.5">Amount</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">{t.reference}</td>
                      <td className="p-2.5 font-bold">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800">
                          {t.type}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700 dark:text-slate-300">
                        {t.purpose ? (
                          <span className="inline-block mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {t.purpose}
                          </span>
                        ) : null}
                        <span>{t.description}</span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        KES {t.amountKES?.toLocaleString()}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                          t.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-slate-500">
              No transactions match the selected filter.
            </p>
          )}
        </div>
      </section>
    );
  }

  /* ========================================================================= */
  /* MODE 3: DISPUTES                                                         */
  /* ========================================================================= */
  if (mode === 'disputes') {
    const partnership = partnerships[0];
    const counterpart = user.role === 'investor' ? partnership?.farmerId : partnership?.investorId;
    return (
      <section className="space-y-4" id="participant_disputes_view">
        <div>
          <h3 className="text-sm font-bold dark:text-white">Escrow Dispute Room</h3>
          <p className="text-xs text-slate-500">Arbitration and formal resolution room.</p>
        </div>
        {partnership && counterpart ? (
          <form
            className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void act(async () => {
                const r = await sharedWorkspaceApi.raiseDispute({
                  respondentId: counterpart,
                  partnershipId: partnership.id,
                  title: f.get('title'),
                  reason: f.get('reason')
                });
                if (r.error) throw new Error(r.error);
                e.currentTarget.reset();
              }, 'Dispute registered with cooperative committee.');
            }}
          >
            <strong className="block text-xs font-bold dark:text-white">Raise a Partnership Dispute</strong>
            <input
              required
              name="title"
              placeholder="Case summary"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <textarea
              required
              name="reason"
              rows={3}
              placeholder="Issue details and evidence summary..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <button disabled={busy} className="action-primary">
              {busy ? 'Registering...' : 'File Dispute'}
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-500">No linked partnership is currently active for arbitration.</p>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold dark:text-white">Your Cases</h4>
          {disputes.length ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl dark:border-slate-800">
              {disputes.map((d, i) => (
                <div key={d.id || i} className="p-3 text-xs">
                  <div className="flex justify-between items-start">
                    <strong className="dark:text-white">{d.title}</strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1">{d.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">No dispute records involving your account.</p>
          )}
        </div>
      </section>
    );
  }

  /* ========================================================================= */
  /* MODE 4: REVIEWS SYSTEM (GIVING & RECEIVING)                              */
  /* ========================================================================= */
  return (
    <section className="space-y-6" id="participant_reviews_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold dark:text-white flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-amber-500" />
            Cooperative Partner Reviews
          </h3>
          <p className="text-xs text-slate-500">
            {user.role === 'veterinarian'
              ? 'Evaluate farmers and project investors based on clinical collaboration and animal welfare.'
              : 'Evaluate partner farmers and clinical veterinarians based on performance and transparency.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReviewModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 px-4 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 transition shadow-xs cursor-pointer"
          id="btn_open_review_modal_participant_tab"
        >
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          <span>Give a Review</span>
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Rating Received</span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center text-amber-400">
              <Star className="h-5 w-5 fill-amber-400" />
            </div>
            <strong className="text-2xl text-slate-900 dark:text-white font-black">
              {reviewData?.averageRating ? reviewData.averageRating.toFixed(1) : '5.0'}
            </strong>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Based on verified collaborator evaluations</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reviews Submitted</span>
          <strong className="text-2xl text-slate-900 dark:text-white font-black mt-1 block">
            {reviewData?.written?.length || 0}
          </strong>
          <p className="text-[10px] text-slate-400 mt-0.5">Peer evaluations contributed</p>
        </div>
      </div>

      {/* Reviews Received */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold dark:text-white">Reviews Received by You</h4>
        {reviewData?.received?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewData.received.map(r => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900 shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {r.rating}.0
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{r.comment}"</p>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <span>Reviewer Role: {r.reviewerRole}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-slate-500 border rounded-xl dark:border-slate-800">
            No reviews received yet. As you engage with partner farmers and collaborators, reviews will appear here.
          </p>
        )}
      </div>

      {/* Reviews Submitted */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold dark:text-white">Reviews You Submitted</h4>
        {reviewData?.written?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {reviewData.written.map(r => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 bg-white dark:bg-slate-900 shadow-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-xs dark:text-white block">{r.targetUserName || 'Partner'}</strong>
                    <span className="text-[10px] text-slate-400">Target Role: {r.targetRole || 'Partner'}</span>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{r.comment}"</p>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Published on {formatDate(r.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-slate-500 border rounded-xl dark:border-slate-800">
            You haven't submitted any reviews yet. Click "Give a Review" above to review your partners.
          </p>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        currentUser={user}
        onReviewSubmitted={() => void load()}
      />
    </section>
  );
}
