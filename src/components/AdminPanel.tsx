import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, FileSearch, Scale, Search, ShieldCheck, X } from 'lucide-react';
import { Dispute, LeaseAgreement, Listing, LivestockPartnership, TripartiteMatch, User, UserRole, VerificationRequest } from '../types';

type View = 'overview' | 'kyc' | 'users' | 'listings' | 'matches' | 'disputes' | 'analytics' | 'audit';
type VerificationDecision = 'APPROVED' | 'REJECTED' | 'MORE_INFO';
type ListingDecision = 'APPROVED' | 'REJECTED' | 'SUSPENDED';

interface AdminPanelProps {
  allListings: Listing[];
  verificationRequests: VerificationRequest[];
  activeLeases: LeaseAgreement[];
  usersList: User[];
  disputes: Dispute[];
  partnerships: LivestockPartnership[];
  matches: TripartiteMatch[];
  analytics: { activeListings: number; registeredUsersCount: number; pendingVerificationsCount: number; pendingListingsCount?: number; openDisputesCount?: number; activeCollaborationsCount?: number; totalEscrowKES: number };
  onReviewVerification: (requestId: string, status: VerificationDecision, note?: string) => Promise<void>;
  onModerateListing: (listingId: string, status: ListingDecision, note?: string) => Promise<void>;
  onApproveUser: (userId: string, status: 'APPROVED' | 'REJECTED') => Promise<void>;
  onResolveDispute: (disputeId: string, resolution: 'refund_farmer' | 'disburse_landowner', reason: string) => Promise<void>;
  onCreateTripartiteMatch: (match: Pick<TripartiteMatch, 'investorId' | 'farmerId' | 'veterinarianId' | 'sector' | 'allocatedCapitalKES' | 'agreedTerms'>) => Promise<void>;
}

const isOpenDispute = (dispute: Dispute) => dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';
const statusStyle = (status: string) => status === 'APPROVED' || status === 'ACTIVE' || status === 'RELEASED' || status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-800' : status === 'PENDING' || status === 'MORE_INFO' || status === 'OPEN' || status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800';
const Status = ({ value }: { value: string; key?: React.Key }) => <span className={`rounded px-2 py-1 text-[10px] font-bold tracking-wide ${statusStyle(value)}`}>{value.replaceAll('_', ' ')}</span>;

export default function AdminPanel(props: AdminPanelProps) {
  const [view, setView] = useState<View>('overview');
  const [query, setQuery] = useState('');
  const [kycStatus, setKycStatus] = useState('PENDING');
  const [listingStatus, setListingStatus] = useState('PENDING');
  const [userRole, setUserRole] = useState('ALL');
  const [selectedKyc, setSelectedKyc] = useState<VerificationRequest | null>(null);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState<'refund_farmer' | 'disburse_landowner'>('refund_farmer');
  const [working, setWorking] = useState(false);
  const [match, setMatch] = useState({ investorId: '', farmerId: '', veterinarianId: '', sector: 'Dairy', allocatedCapitalKES: 0, agreedTerms: '' });

  const pendingKyc = props.verificationRequests.filter(item => item.status === 'PENDING' || item.status === 'MORE_INFO');
  const pendingListings = props.allListings.filter(item => (item.moderationStatus || (item.verified ? 'APPROVED' : 'PENDING')) === 'PENDING');
  const openDisputes = props.disputes.filter(isOpenDispute);
  const activeCollaborations = props.activeLeases.filter(item => item.status === 'SIGNED').length + props.partnerships.filter(item => item.status === 'ACTIVE').length + props.matches.filter(item => item.status === 'ACTIVE' || item.status === 'PROPOSED').length;
  const filterText = (value: string) => !query || value.toLowerCase().includes(query.trim().toLowerCase());
  const filteredKyc = useMemo(() => props.verificationRequests.filter(item => (kycStatus === 'ALL' || item.status === kycStatus) && filterText(`${item.userName} ${item.userRole} ${item.documentType}`)), [props.verificationRequests, kycStatus, query]);
  const filteredUsers = useMemo(() => props.usersList.filter(item => (userRole === 'ALL' || item.role === userRole) && filterText(`${item.name} ${item.phone} ${item.county}`)), [props.usersList, userRole, query]);
  const filteredListings = useMemo(() => props.allListings.filter(item => (listingStatus === 'ALL' || (item.moderationStatus || (item.verified ? 'APPROVED' : 'PENDING')) === listingStatus) && filterText(`${item.title} ${item.ownerName} ${item.locationCounty}`)), [props.allListings, listingStatus, query]);
  const choose = (next: View) => { setView(next); setQuery(''); setNote(''); };
  const run = async (action: () => Promise<void>) => { setWorking(true); try { await action(); } finally { setWorking(false); } };
  const reviewKyc = async (decision: VerificationDecision) => { if (!selectedKyc || (decision === 'MORE_INFO' && !note.trim())) return; await run(async () => { await props.onReviewVerification(selectedKyc.id, decision, note.trim() || undefined); setSelectedKyc(null); setNote(''); }); };
  const moderate = async (decision: ListingDecision) => { if (!selectedListing) return; await run(async () => { await props.onModerateListing(selectedListing.id, decision, note.trim() || undefined); setSelectedListing(null); setNote(''); }); };
  const resolve = async () => { if (!selectedDispute || !note.trim()) return; await run(async () => { await props.onResolveDispute(selectedDispute.id, resolution, note.trim()); setSelectedDispute(null); setNote(''); }); };
  const createMatch = async (event: React.FormEvent) => { event.preventDefault(); await run(async () => { await props.onCreateTripartiteMatch(match); setMatch({ investorId: '', farmerId: '', veterinarianId: '', sector: 'Dairy', allocatedCapitalKES: 0, agreedTerms: '' }); }); };
  const nav: { id: View; label: string; count?: number }[] = [
    { id: 'overview', label: 'Requires attention', count: pendingKyc.length + pendingListings.length + openDisputes.length },
    { id: 'kyc', label: 'KYC', count: pendingKyc.length },
    { id: 'users', label: 'Users' },
    { id: 'listings', label: 'Listings', count: pendingListings.length },
    { id: 'matches', label: 'Matches' },
    { id: 'disputes', label: 'Disputes', count: openDisputes.length },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit', label: 'Audit Log' }
  ];

  return (
    <section id="admin_dashboard" className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Admin workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Hello, Administrator</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Welcome to your cooperative admin workspace. Administer member identity verifications, marketplace listings, escrow dispute resolutions, and platform audits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2" aria-label="Admin workspace views">
            {nav.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => choose(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  view === item.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{item.label}</span>
                {item.count ? (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    view === item.id ? 'bg-emerald-800 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {item.count}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="KYC awaiting action" value={pendingKyc.length} note="Identity verification requests" alert={pendingKyc.length > 0} onClick={() => choose('kyc')} />
        <Metric label="Listings awaiting review" value={pendingListings.length} note="Unmoderated marketplace items" alert={pendingListings.length > 0} onClick={() => choose('listings')} />
        <Metric label="Open disputes" value={openDisputes.length} note="Escrow-linked conflicts" alert={openDisputes.length > 0} onClick={() => choose('disputes')} />
        <Metric label="Active collaborations" value={activeCollaborations} note="Across leases, livestock & matches" onClick={() => choose('analytics')} />
      </div>

      <main className="space-y-4">
        {view !== 'overview' && view !== 'analytics' && view !== 'audit' && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-52 flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                aria-label="Search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search records, names, or locations..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            {view === 'kyc' && <Select value={kycStatus} setValue={setKycStatus} values={['ALL', 'PENDING', 'MORE_INFO', 'APPROVED', 'REJECTED']} />}
            {view === 'listings' && <Select value={listingStatus} setValue={setListingStatus} values={['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']} />}
            {view === 'users' && <Select value={userRole} setValue={setUserRole} values={['ALL', UserRole.FARMER, UserRole.INVESTOR, UserRole.VETERINARIAN]} />}
          </div>
        )}

        {view === 'overview' && (
          <AttentionRows pendingKyc={pendingKyc} pendingListings={pendingListings} openDisputes={openDisputes} onChoose={choose} />
        )}

        {view === 'kyc' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">KYC Verification Queue</h2>
            </div>
            <QueueTable
              empty="No KYC records match this filter."
              headers={['Applicant', 'Document', 'Submitted', 'Status', '']}
              rows={filteredKyc.map(item => [
                <div key="applicant">
                  <strong className="text-slate-900 dark:text-white">{item.userName}</strong>
                  <span className="block text-[10px] text-slate-500">{item.userRole}</span>
                </div>,
                `${item.documentType.replaceAll('_', ' ')} · ${item.documentNumber}`,
                new Date(item.submittedAt).toLocaleDateString(),
                <Status key="status" value={item.status} />,
                <button
                  key="review"
                  onClick={() => {
                    setSelectedKyc(item);
                    setNote(item.adminNote || '');
                  }}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Review
                </button>
              ])}
            />
          </section>
        )}

        {view === 'users' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Platform Users Directory</h2>
            </div>
            <QueueTable
              empty="No users match this filter."
              headers={['User', 'Role', 'County', 'Status', '']}
              rows={filteredUsers.map(user => [
                <div key="user">
                  <strong className="text-slate-900 dark:text-white">{user.name}</strong>
                  <span className="block text-[10px] text-slate-500">{user.email || user.phone}</span>
                </div>,
                user.role,
                user.county,
                <Status key="status" value={user.verified ? 'APPROVED' : 'PENDING'} />,
                user.role !== UserRole.ADMIN ? (
                  <button
                    key="action"
                    disabled={working}
                    onClick={() => run(() => props.onApproveUser(user.id, user.verified ? 'REJECTED' : 'APPROVED'))}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer disabled:opacity-60"
                  >
                    {user.verified ? 'Mark unverified' : 'Verify'}
                  </button>
                ) : null
              ])}
            />
          </section>
        )}

        {view === 'listings' && (
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Marketplace Listings Moderation</h2>
            </div>
            <QueueTable
              empty="No listings match this filter."
              headers={['Listing', 'Owner', 'County', 'Status', '']}
              rows={filteredListings.map(item => [
                <div key="listing">
                  <strong className="text-slate-900 dark:text-white">{item.title}</strong>
                  <span className="block text-[10px] text-slate-500">KES {item.priceKES.toLocaleString()}</span>
                </div>,
                item.ownerName,
                item.locationCounty,
                <Status key="status" value={item.moderationStatus || (item.verified ? 'APPROVED' : 'PENDING')} />,
                <button
                  key="review"
                  onClick={() => {
                    setSelectedListing(item);
                    setNote(item.moderationNote || '');
                  }}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 text-xs font-semibold text-white transition cursor-pointer"
                >
                  Review
                </button>
              ])}
            />
          </section>
        )}

        {view === 'matches' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <MatchWorkspace users={props.usersList} matches={props.matches} match={match} setMatch={setMatch} submit={createMatch} working={working} />
          </section>
        )}

        {view === 'disputes' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <DisputeWorkspace disputes={props.disputes} leases={props.activeLeases} users={props.usersList} selected={selectedDispute} select={item => { setSelectedDispute(item); setNote(item.resolutionNotes || ''); }} />
          </section>
        )}

        {view === 'analytics' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <Analytics analytics={props.analytics} collaborations={activeCollaborations} />
          </section>
        )}

        {view === 'audit' && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <AuditWorkspace />
          </section>
        )}
      </main>

      {selectedKyc && (
        <ActionDialog title={`Review KYC: ${selectedKyc.userName}`} close={() => setSelectedKyc(null)} note={note} setNote={setNote} busy={working}>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {selectedKyc.documentType.replaceAll('_', ' ')} · {selectedKyc.documentNumber}. Sensitive document details are only available through the protected record API.
          </p>
          <div className="flex flex-wrap gap-2">{selectedKyc.documentIds?.map((id, index) => <button type="button" key={id} className="underline text-xs" onClick={async () => {
            const response = await fetch(`/api/uploads/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('sl_token') || ''}` } });
            if (!response.ok) { window.alert('Unable to download this document.'); return; }
            const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || `identity-document-${index + 1}`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}>Download document {index + 1}</button>)}</div>
          <History entries={selectedKyc.history || []} />
          <div className="flex flex-wrap gap-2">
            <button disabled={working} onClick={() => reviewKyc('APPROVED')} className="action-primary flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Approve</span>
            </button>
            <button disabled={working} onClick={() => reviewKyc('MORE_INFO')} className="action-secondary flex items-center gap-1.5">
              <FileSearch className="h-3.5 w-3.5" />
              <span>Request information</span>
            </button>
            <button disabled={working} onClick={() => reviewKyc('REJECTED')} className="action-danger flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </ActionDialog>
      )}

      {selectedListing && (
        <ActionDialog title={`Moderate: ${selectedListing.title}`} close={() => setSelectedListing(null)} note={note} setNote={setNote} busy={working}>
          <div className="flex flex-wrap gap-2">
            <button disabled={working} onClick={() => moderate('APPROVED')} className="action-primary flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Approve</span>
            </button>
            <button disabled={working} onClick={() => moderate('SUSPENDED')} className="action-secondary">
              Suspend
            </button>
            <button disabled={working} onClick={() => moderate('REJECTED')} className="action-danger flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          </div>
        </ActionDialog>
      )}

      {selectedDispute && (
        <ActionDialog title={`Resolve dispute ${selectedDispute.id}`} close={() => setSelectedDispute(null)} note={note} setNote={setNote} busy={working}>
          <select value={resolution} onChange={event => setResolution(event.target.value as typeof resolution)} className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800">
            <option value="refund_farmer">Refund escrow to farmer</option>
            <option value="disburse_landowner">Release escrow to landowner</option>
          </select>
          <History entries={selectedDispute.history || []} />
          <button disabled={working || !note.trim()} onClick={resolve} className="action-primary flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            <span>Record resolution</span>
          </button>
        </ActionDialog>
      )}
    </section>
  );
}

function Metric({ label, value, note, alert = false, onClick }: { label: string; value: number; note?: string; alert?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`border-l-4 border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 ${
        onClick ? 'cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/60' : ''
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? 'text-amber-700 dark:text-amber-400' : 'text-slate-950 dark:text-white'}`}>
        {value}
      </p>
      {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

function Select({ value, setValue, values }: { value: string; setValue: (value: string) => void; values: string[] }) { return <select value={value} onChange={event => setValue(event.target.value)} className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">{values.map(item => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item.replaceAll('_', ' ')}</option>)}</select>; }

function AttentionRows({ pendingKyc, pendingListings, openDisputes, onChoose }: { pendingKyc: VerificationRequest[]; pendingListings: Listing[]; openDisputes: Dispute[]; onChoose: (view: View) => void }) {
  const rows = [
    { label: 'KYC reviews', description: 'Verification submissions need a decision.', count: pendingKyc.length, view: 'kyc' as View },
    { label: 'Listing reviews', description: 'New listings are not public until approved.', count: pendingListings.length, view: 'listings' as View },
    { label: 'Dispute resolutions', description: 'Escrow-linked cases require a documented outcome.', count: openDisputes.length, view: 'disputes' as View }
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Requires attention</h2>
        <p className="text-xs text-slate-500">Platform queues requiring administrative intervention or moderation.</p>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map(row => (
          <button
            key={row.view}
            onClick={() => onChoose(row.view)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <AlertTriangle className={`h-4 w-4 ${row.count ? 'text-amber-500' : 'text-slate-300'}`} />
            <div className="flex-1">
              <strong className="text-xs text-slate-900 dark:text-white">{row.label}</strong>
              <span className="block text-[11px] text-slate-500">{row.description}</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.count ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {row.count}
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </button>
        ))}
      </div>
    </section>
  );
}

function QueueTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-4 py-2.5 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-middle text-slate-700 dark:text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="py-10 text-center text-xs text-slate-500">{empty}</p>
  );
}
function ActionDialog({ title, close, note, setNote, busy, children }: { title: string; close: () => void; note: string; setNote: (value: string) => void; busy: boolean; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900"><div className="flex items-center justify-between"><h3 className="text-sm font-bold dark:text-white">{title}</h3><button onClick={close} aria-label="Close" className="text-slate-500"><X className="h-4 w-4"/></button></div>{children}<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} placeholder="Internal decision note" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800" disabled={busy}/></div></div>; }
function History({ entries }: { entries: { at: string; action: string; note?: string }[] }) { return entries.length ? <ol className="space-y-1 border-l border-slate-200 pl-3 text-[11px] text-slate-500 dark:border-slate-700">{entries.map((entry, index) => <li key={`${entry.at}-${index}`}><strong>{entry.action.replaceAll('_', ' ')}</strong> · {new Date(entry.at).toLocaleString()}{entry.note ? ` — ${entry.note}` : ''}</li>)}</ol> : null; }
function MatchWorkspace({ users, matches, match, setMatch, submit, working }: { users: User[]; matches: TripartiteMatch[]; match: { investorId: string; farmerId: string; veterinarianId: string; sector: string; allocatedCapitalKES: number; agreedTerms: string }; setMatch: React.Dispatch<React.SetStateAction<{ investorId: string; farmerId: string; veterinarianId: string; sector: string; allocatedCapitalKES: number; agreedTerms: string }>>; submit: (event: React.FormEvent) => Promise<void>; working: boolean }) { const select = (key: 'investorId' | 'farmerId' | 'veterinarianId', role: UserRole, label: string) => <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}<select required value={match[key]} onChange={event => setMatch(current => ({ ...current, [key]: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 font-normal dark:border-slate-700 dark:bg-slate-800"><option value="">Select {label.toLowerCase()}</option>{users.filter(user => user.role === role).map(user => <option key={user.id} value={user.id}>{user.name} · {user.county}</option>)}</select></label>; return <div className="space-y-5"><div><h3 className="text-sm font-bold dark:text-white">Create a proposed match</h3><p className="text-xs text-slate-500">All three roles are validated by the server before the proposal is created.</p></div><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{select('investorId', UserRole.INVESTOR, 'Investor')}{select('farmerId', UserRole.FARMER, 'Farmer')}{select('veterinarianId', UserRole.VETERINARIAN, 'Veterinarian')}<label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sector<input required value={match.sector} onChange={event => setMatch(current => ({ ...current, sector: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Capital (KES)<input required min="1" type="number" value={match.allocatedCapitalKES || ''} onChange={event => setMatch(current => ({ ...current, allocatedCapitalKES: Number(event.target.value) }))} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><label className="sm:col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Terms<textarea required maxLength={2000} value={match.agreedTerms} onChange={event => setMatch(current => ({ ...current, agreedTerms: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-200 p-2 font-normal dark:border-slate-700 dark:bg-slate-800"/></label><button disabled={working} className="action-primary w-fit">Create proposal</button></form><QueueTable empty="No tripartite matches have been created." headers={['Investor', 'Farmer', 'Veterinarian', 'Status']} rows={matches.map(item => [item.investorName, item.farmerName, item.veterinarianName || 'Not assigned', <Status key="status" value={item.status} />])}/></div>; }
function DisputeWorkspace({ disputes, leases, users, selected, select }: { disputes: Dispute[]; leases: LeaseAgreement[]; users: User[]; selected: Dispute | null; select: (dispute: Dispute) => void }) { const active = disputes.filter(isOpenDispute); const parties = selected?.leaseId ? (() => { const lease = leases.find(item => item.id === selected.leaseId); if (!lease) return `Lease ${selected.leaseId}`; const name = (id: string) => users.find(user => user.id === id)?.name || id; return `${name(lease.landownerId)} and ${name(lease.farmerId)}`; })() : selected?.partnershipId ? `Partnership ${selected.partnershipId}` : 'Not linked'; return <div className="grid gap-5 lg:grid-cols-2"><div><h3 className="mb-3 text-sm font-bold dark:text-white">Open cases</h3><QueueTable empty="No open disputes." headers={['Filed by', 'Issue', 'Status', '']} rows={active.map(item => [item.creatorName, <span key="reason" className="line-clamp-2">{item.reason}</span>, <Status key="status" value={item.status}/>, <button key="open" onClick={() => select(item)} className="link-action">Open</button>])}/></div>{selected ? <aside className="space-y-3 rounded-lg border border-slate-200 p-4 text-xs dark:border-slate-800"><div className="flex justify-between"><h4 className="font-bold dark:text-white">Case details</h4><Status value={selected.status}/></div><p><strong>Filed by:</strong> {selected.creatorName}</p><p><strong>Parties:</strong> {parties}</p><p><strong>Issue:</strong> {selected.reason}</p>{selected.evidenceText ? <p><strong>Evidence:</strong> {selected.evidenceText}</p> : <p className="text-slate-500">No evidence text supplied.</p>}<History entries={selected.history || []}/></aside> : <aside className="text-xs text-slate-500">Select an open case to view its parties, issue, evidence, and history.</aside>}</div>; }
function Analytics({ analytics, collaborations }: { analytics: AdminPanelProps['analytics']; collaborations: number }) { return <div><h3 className="text-sm font-bold dark:text-white">Decision metrics</h3><p className="mt-1 text-xs text-slate-500">Only operational counts and escrow value are shown here.</p><dl className="mt-4 grid grid-cols-2 divide-x divide-y border border-slate-200 text-xs sm:grid-cols-3 dark:divide-slate-800 dark:border-slate-800">{[['Approved listings', analytics.activeListings], ['Registered users', analytics.registeredUsersCount], ['KYC queue', analytics.pendingVerificationsCount], ['Listing queue', analytics.pendingListingsCount || 0], ['Open disputes', analytics.openDisputesCount || 0], ['Active collaborations', analytics.activeCollaborationsCount ?? collaborations], ['Escrow reconciled', `KES ${analytics.totalEscrowKES.toLocaleString()}`]].map(([label, value]) => <div key={String(label)} className="p-3"><dt className="text-slate-500">{label}</dt><dd className="mt-1 text-sm font-bold text-slate-950 dark:text-white">{value}</dd></div>)}</dl></div>; }

function AuditWorkspace() {
  const [logs, setLogs] = useState<{ timestamp: string; actor: string; action: string; resource: string; ip_address?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('sl_token');
    fetch('/api/admin/audit-logs?limit=100', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.logs)) setLogs(data.logs);
      })
      .catch(err => console.error('Failed to load audit logs', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(item =>
    !filter ||
    (item.action && item.action.toLowerCase().includes(filter.toLowerCase())) ||
    (item.actor && item.actor.toLowerCase().includes(filter.toLowerCase())) ||
    (item.resource && item.resource.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-950 dark:text-white">Immutable Security Audit Logs</h3>
          <p className="text-xs text-slate-500">Append-only audit trail recording sensitive actions, verification decisions, and transactions.</p>
        </div>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter audit logs..."
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      {loading ? (
        <p className="py-8 text-center text-xs text-slate-500">Loading audit records...</p>
      ) : filtered.length ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((entry, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="px-3 py-2 font-mono text-[11px] font-semibold text-slate-900 dark:text-slate-100">{entry.actor}</td>
                  <td className="px-3 py-2"><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-800 dark:bg-slate-800 dark:text-slate-200">{entry.action}</span></td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-300">{entry.resource}</td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">{entry.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-xs text-slate-500">No audit log entries match your filter.</p>
      )}
    </div>
  );
}
