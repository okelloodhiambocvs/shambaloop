import ParticipantWorkspace from './ParticipantWorkspace';
import React, { useEffect, useState, useMemo } from 'react';
import { 
  AlertCircle, CheckCircle2, Download, FileText, Filter, 
  MessageSquareQuote, Plus, ShieldCheck, Star, UploadCloud, Wallet 
} from 'lucide-react';
import type { FarmRecord, LivestockPartnership, User, UploadedFile, Review, LedgerTransaction } from '../types';
import { farmerWorkspaceApi, fileAsBase64 } from '../services/farmerWorkspaceService';
import ReviewModal from './ReviewModal';

type Props = { 
  user: User; 
  partnerships: LivestockPartnership[]; 
  mode: 'fms' | 'wallet' | 'disputes' | 'reviews'; 
};

const farmId = (user: User) => `farm_${user.id}`;
const formatDate = (v: string) => new Date(v).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

export default function FarmerOperations({ user, partnerships, mode }: Props) {
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [wallet, setWallet] = useState<any>();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reviewData, setReviewData] = useState<{ received: Review[]; written: Review[]; averageRating: number } | null>(null);
  const [eligible, setEligible] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Review modal trigger
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Wallet purpose state
  const [depositPurpose, setDepositPurpose] = useState('FEED_PURCHASE');
  const [filterPurpose, setFilterPurpose] = useState('ALL');

  const reload = async () => {
    setError('');
    if (mode === 'fms') {
      const [r, d] = await Promise.all([
        farmerWorkspaceApi.records(),
        farmerWorkspaceApi.documents(farmId(user))
      ]);
      if (r.data) setRecords(r.data);
      if (d.data) setDocuments(d.data);
      if (r.error || d.error) setError(r.error || d.error || 'Unable to load farm records.');
    }
    if (mode === 'wallet') {
      const r = await farmerWorkspaceApi.wallet();
      if (r.data) setWallet(r.data);
      else setError(r.error || 'Unable to load wallet summary.');
    }
    if (mode === 'disputes') {
      const r = await farmerWorkspaceApi.disputes();
      if (r.data) setDisputes(r.data);
      else setError(r.error || 'Unable to load disputes.');
    }
    if (mode === 'reviews') {
      const [r, e] = await Promise.all([
        farmerWorkspaceApi.reviews(),
        farmerWorkspaceApi.eligibleReviews()
      ]);
      if (r.data) setReviewData(r.data);
      if (e.data) setEligible(e.data);
      if (r.error || e.error) setError(r.error || e.error || 'Unable to load reviews.');
    }
  };

  useEffect(() => {
    void reload();
  }, [mode, user.id]);

  const action = async (work: () => Promise<void>, msg?: string) => {
    setBusy(true);
    setError('');
    setSuccessMsg('');
    try {
      await work();
      if (msg) setSuccessMsg(msg);
      await reload();
    } catch (e: any) {
      setError(e.message || 'Action failed.');
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
      <section className="space-y-6" id="farmer_fms_view">
        <div>
          <h3 className="text-sm font-bold dark:text-white">Farm Management System (FMS)</h3>
          <p className="text-xs text-slate-500">Record daily farm activities and upload certified documentation.</p>
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

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form 1: Activity Record */}
          <form
            className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void action(async () => {
                const result = await farmerWorkspaceApi.createRecord({
                  farmId: farmId(user),
                  recordType: String(f.get('recordType')) as FarmRecord['recordType'],
                  description: String(f.get('description')),
                  quantity: Number(f.get('quantity')),
                  unit: String(f.get('unit') || ''),
                  date: String(f.get('date') || new Date().toISOString().slice(0, 10)),
                  notes: String(f.get('notes') || '')
                });
                if (result.error) throw new Error(result.error);
                e.currentTarget.reset();
              }, 'Farm record saved successfully.');
            }}
          >
            <strong className="block text-xs font-bold dark:text-white">Record Farm Activity</strong>
            <select
              name="recordType"
              defaultValue="FEED"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            >
              <option value="FEED">FEED — Fodder, Silage & Concentrates</option>
              <option value="VACCINATION">VACCINATION — Immunization & Disease Prevention</option>
              <option value="PRODUCTION">PRODUCTION — Milk Harvest or Crop Yield</option>
              <option value="EXPENSE">EXPENSE — Fuel, Labor, Seeds & Inputs</option>
              <option value="EVENT">EVENT — Calving, Tillage, Insemination</option>
              <option value="OTHER">OTHER — General Field Activity</option>
            </select>
            <input
              required
              name="description"
              placeholder="e.g., Morning silage feed (50kg Napier) + mineral lick"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                name="quantity"
                type="number"
                min="0"
                step="0.01"
                placeholder="Quantity"
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
              />
              <input
                name="unit"
                placeholder="Unit (kg, Liters, Bales)"
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
              />
            </div>
            <input
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <textarea
              name="notes"
              rows={2}
              placeholder="Operational observation (e.g. animal response, batch number)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <button disabled={busy} className="action-primary w-full">
              {busy ? 'Saving...' : 'Save Activity Record'}
            </button>
          </form>

          {/* Form 2: Document Upload */}
          <form
            className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const file = f.get('file') as File;
              void action(async () => {
                if (!file?.size) throw new Error('Please select a document or photograph to upload.');
                const base64 = await fileAsBase64(file);
                const result = await farmerWorkspaceApi.upload({
                  fileName: file.name,
                  mimeType: file.type,
                  base64Data: base64,
                  farmId: farmId(user),
                  documentType: f.get('documentType'),
                  description: f.get('description')
                });
                if (result.error) throw new Error(result.error);
                e.currentTarget.reset();
              }, 'Document uploaded and securely archived.');
            }}
          >
            <div className="flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-emerald-600" />
              <strong className="text-xs font-bold dark:text-white">Upload Farm Documentation</strong>
            </div>
            <p className="text-[11px] text-slate-500">
              Investors and clinical veterinarians can review verified title deeds, health papers, and feed receipts.
            </p>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Document Type</span>
              <select
                name="documentType"
                defaultValue="VACCINATION_REPORT"
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
              >
                <option value="VACCINATION_REPORT">Vaccination & Immunization Certificate</option>
                <option value="LAND_TITLE_DEED">Land Title Deed / Lease Agreement</option>
                <option value="VETERINARY_REPORT">Veterinary Clinical Health Report</option>
                <option value="PEDIGREE_CERTIFICATE">Livestock Breed / Pedigree Card</option>
                <option value="FEED_RECEIPT">Feed & Concentrates Purchase Receipt</option>
                <option value="PAYMENT_RECEIPT">Escrow & Financial Ledger Receipt</option>
                <option value="FARM_PHOTO">Farm Shamba / Livestock Photo</option>
                <option value="EVENT_DOCUMENT">Inspection / Cooperative Audit Paper</option>
                <option value="OTHER">Other Certified Record</option>
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Select File (PDF, JPEG, PNG)</span>
              <input
                required
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800 cursor-pointer"
              />
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
              name="description"
              placeholder="Note or reference (e.g. Kiambu County Vet vaccination batch #88)"
            />
            <button disabled={busy} className="action-primary w-full">
              {busy ? 'Archiving File...' : 'Upload Securely to Cloud'}
            </button>
          </form>
        </div>

        {/* Display Documents */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
            <h4 className="text-xs font-bold dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Authorized Farm Documentation ({documents.length})
            </h4>
          </div>
          {documents.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2"
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
            <p className="py-4 text-center text-xs text-slate-500">
              No documents have been uploaded yet. Upload deeds, vet certificates, or feed receipts above.
            </p>
          )}
        </section>

        {/* Display Activity Records */}
        <section className="space-y-3">
          <h4 className="text-xs font-bold dark:text-white">Recent Activity Records ({records.length})</h4>
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
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
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
  /* MODE 2: WALLET WITH PURPOSE DROPDOWNS                                    */
  /* ========================================================================= */
  if (mode === 'wallet') return <ParticipantWorkspace user={user} partnerships={partnerships} mode="wallet" />;

  if (mode === 'disputes') {
    const partner = partnerships[0];
    return (
      <section className="space-y-4" id="farmer_disputes_view">
        <div>
          <h3 className="text-sm font-bold dark:text-white">Escrow & Governance Dispute Room</h3>
          <p className="text-xs text-slate-500">Mediation and milestone arbitration room.</p>
        </div>
        {partner ? (
          <form
            className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-xs bg-slate-50/50 dark:bg-slate-900/50"
            onSubmit={e => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void action(async () => {
                const r = await farmerWorkspaceApi.raiseDispute({
                  respondentId: partner.investorId,
                  title: f.get('title'),
                  reason: f.get('reason'),
                  partnershipId: partner.id
                });
                if (r.error) throw new Error(r.error);
                e.currentTarget.reset();
              }, 'Dispute case opened with arbitration council.');
            }}
          >
            <strong className="block text-xs font-bold dark:text-white">Open a Governance Dispute</strong>
            <input
              required
              name="title"
              placeholder="Case summary (e.g. Delayed feed disbursement milestone)"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <textarea
              required
              name="reason"
              rows={3}
              placeholder="Factual description of the breach or issue and proposed resolution..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-xs bg-white dark:bg-slate-800"
            />
            <button disabled={busy} className="action-primary">
              {busy ? 'Registering...' : 'File Dispute'}
            </button>
          </form>
        ) : (
          <p className="text-xs text-slate-500">An active partnership is required before opening a formal arbitration case.</p>
        )}

        <div className="space-y-2">
          <h4 className="text-xs font-bold dark:text-white">Active & Past Dispute Cases</h4>
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
                  {d.resolutionNotes && (
                    <p className="text-emerald-700 dark:text-emerald-400 mt-1 text-[11px]">
                      Resolution: {d.resolutionNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-3">No dispute records involving your farm.</p>
          )}
        </div>
      </section>
    );
  }

  /* ========================================================================= */
  /* MODE 4: REVIEWS SYSTEM (GIVING & RECEIVING)                              */
  /* ========================================================================= */
  return (
    <section className="space-y-6" id="farmer_reviews_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold dark:text-white flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-amber-500" />
            Cooperative Partner Reviews
          </h3>
          <p className="text-xs text-slate-500">
            Submit reviews for your capital investors or clinical veterinarians to build platform reputation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReviewModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 px-4 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 transition shadow-xs cursor-pointer"
          id="btn_open_review_modal_farmer_tab"
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

      {/* Overview Metric */}
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
          <p className="text-[10px] text-slate-400 mt-0.5">Based on verified collaborator reviews</p>
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
        <h4 className="text-xs font-bold dark:text-white">Reviews Received by Your Farm</h4>
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
                  <span>Reviewer: {r.reviewerRole}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-slate-500 border rounded-xl dark:border-slate-800">
            No reviews received yet. Partner with investors or engage veterinarians to receive evaluations.
          </p>
        )}
      </div>

      {/* Reviews Submitted */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold dark:text-white">Reviews You Submitted for Partners</h4>
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
                    <span className="text-[10px] text-slate-400">Target Role: {r.targetRole || 'Collaborator'}</span>
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
            You haven't submitted any partner reviews yet. Click "Give a Review" above to review your partners.
          </p>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        currentUser={user}
        onReviewSubmitted={() => void reload()}
      />
    </section>
  );
}
