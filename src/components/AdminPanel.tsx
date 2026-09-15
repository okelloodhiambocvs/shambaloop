import React, { useState } from 'react';
import { 
  User, Listing, VerificationRequest, LeaseAgreement, UserRole, 
  Dispute, TripartiteMatch, LivestockPartnership 
} from '../types';
import { 
  ShieldCheck, AlertTriangle, Users, TrendingUp, Scale, 
  CheckCircle, XCircle, Search, RefreshCw, Layers, DollarSign, 
  FileText, Activity, MapPin, Stethoscope, Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface AdminPanelProps {
  unverifiedListings: Listing[];
  allListings?: Listing[];
  verificationRequests: VerificationRequest[];
  activeLeases: LeaseAgreement[];
  usersList: User[];
  disputes?: Dispute[];
  partnerships?: LivestockPartnership[];
  onApproveListing: (listingId: string) => void;
  onApproveVerification: (requestId: string, status: 'APPROVED' | 'REJECTED') => void;
  onDisburseEscrow: (leaseId: string) => void;
  onApproveUser: (userId: string, status: 'APPROVED' | 'REJECTED') => void;
  onDeleteListing?: (listingId: string) => void;
  onResolveDispute?: (disputeId: string, resolution: 'refund_farmer' | 'disburse_landowner', reason: string) => void;
  onCreateTripartiteMatch?: (match: Omit<TripartiteMatch, 'id' | 'createdAt'>) => void;
}

const SECTOR_COLORS = ['#059669', '#8b5cf6', '#f59e0b', '#0284c7', '#e11d48'];

export default function AdminPanel({
  unverifiedListings,
  allListings = [],
  verificationRequests,
  activeLeases,
  usersList,
  disputes = [],
  partnerships = [],
  onApproveListing,
  onApproveVerification,
  onDisburseEscrow,
  onApproveUser,
  onDeleteListing,
  onResolveDispute,
  onCreateTripartiteMatch
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'moderation' | 'kyc' | 'matchmaking' | 'analytics' | 'disputes' | 'escrows' | 'audit'>('moderation');

  // Matchmaking form states
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [matchSector, setMatchSector] = useState<'Dairy' | 'Crops' | 'Horticulture' | 'Poultry'>('Dairy');
  const [matchCapitalKES, setMatchCapitalKES] = useState<number>(300000);
  const [matchTerms, setMatchTerms] = useState<string>('Standard 60% Farmer / 40% Investor revenue split with bi-weekly KVB vet audits');
  const [matchSuccessMsg, setMatchSuccessMsg] = useState<string>('');

  // Dispute resolution form states
  const [selectedDisputeId, setSelectedDisputeId] = useState<string>('');
  const [disputeResolution, setDisputeResolution] = useState<'refund_farmer' | 'disburse_landowner'>('refund_farmer');
  const [resolutionReason, setResolutionReason] = useState<string>('Evidence inspected by registry supervisor.');
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState<string>('');

  // Search in KYC
  const [kycSearch, setKycSearch] = useState('');

  // Stats calculation
  const totalLeasedKES = activeLeases.reduce((acc, cur) => acc + (cur.paymentsMade || 0), 0);
  const activeFarmerAgreements = activeLeases.filter(a => a.status === 'SIGNED').length;
  const pendingVerifications = verificationRequests.filter(v => v.status === 'PENDING').length;
  const unverifiedUsers = usersList.filter(u => !u.verified).length;
  const openDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

  // Filter lists
  const investors = usersList.filter(u => u.role === UserRole.INVESTOR);
  const farmers = usersList.filter(u => u.role === UserRole.FARMER);
  const vets = usersList.filter(u => u.role === UserRole.VETERINARIAN);

  // Analytics datasets
  const countyDistributionData = [
    { county: 'Kiambu', farms: 14, escrowKES: 420000 },
    { county: 'Nyandarua', farms: 19, escrowKES: 680000 },
    { county: 'Nakuru', farms: 11, escrowKES: 390000 },
    { county: 'Kisumu', farms: 16, escrowKES: 510000 },
    { county: 'Uasin Gishu', farms: 13, escrowKES: 450000 },
    { county: 'Nyeri', farms: 9, escrowKES: 310000 }
  ];

  const sectorData = [
    { name: 'Dairy Farming', value: 45 },
    { name: 'Horticulture', value: 25 },
    { name: 'Maize & Cereals', value: 15 },
    { name: 'Poultry', value: 10 },
    { name: 'Dairy Goats', value: 5 }
  ];

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = investors.find(i => i.id === selectedInvestorId) || investors[0];
    const fam = farmers.find(f => f.id === selectedFarmerId) || farmers[0];
    const vt = vets.find(v => v.id === selectedVetId) || vets[0];

    if (!inv || !fam || !vt) {
      alert('Please select an Investor, a Farmer, and a Veterinarian to forge a match.');
      return;
    }

    if (onCreateTripartiteMatch) {
      onCreateTripartiteMatch({
        investorId: inv.id,
        investorName: inv.name,
        farmerId: fam.id,
        farmerName: fam.name,
        veterinarianId: vt.id,
        veterinarianName: vt.name,
        sector: matchSector,
        allocatedCapitalKES: matchCapitalKES,
        agreedTerms: matchTerms,
        status: 'ACTIVE'
      });
    }

    setMatchSuccessMsg(`Tripartite Match forged successfully between ${inv.name} (Investor), ${fam.name} (Farmer), and ${vt.name} (KVB Vet)!`);
    setTimeout(() => setMatchSuccessMsg(''), 5000);
  };

  const handleResolveDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDisputeId || !onResolveDispute) return;
    onResolveDispute(selectedDisputeId, disputeResolution, resolutionReason);
    setDisputeSuccessMsg('Dispute resolved and escrow disposition recorded in immutable registry audit trail.');
    setSelectedDisputeId('');
    setTimeout(() => setDisputeSuccessMsg(''), 5000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden" id="admin_registry_panel">
      {/* Admin Panel Header */}
      <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <h2 className="text-base font-bold font-display text-white mb-0.5">District Registry & Admin Supervisor Console</h2>
            <p className="text-[11px] text-slate-400 font-semibold font-sans">
              KYC Accreditation • Tripartite Matchmaking • Listings Control • Platform Analytics • Dispute Resolution
            </p>
          </div>
        </div>
        <span className="mono-display text-[9px] bg-amber-500 text-slate-950 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
          Authority Mode
        </span>
      </div>

      {/* Analytics KPI bar */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Unverified Listings', val: unverifiedListings.length, icon: Layers, alert: unverifiedListings.length > 0 },
          { label: 'KYC Claims Queue', val: pendingVerifications + unverifiedUsers, icon: Users, alert: pendingVerifications > 0 },
          { label: 'Open Disputes', val: openDisputes.length, icon: Scale, alert: openDisputes.length > 0 },
          { label: 'Escrow Volume', val: `KES ${totalLeasedKES.toLocaleString()}`, icon: DollarSign, alert: false },
          { label: 'Active Contracts', val: activeFarmerAgreements + partnerships.length, icon: ShieldCheck, alert: false }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
                <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{stat.val}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.alert ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row min-h-[480px]">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-60 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 flex lg:flex-col gap-1.5 overflow-x-auto shrink-0 select-none">
          {[
            { id: 'moderation', label: '1. Listings Control', count: unverifiedListings.length, icon: Layers },
            { id: 'kyc', label: '2. KYC & Onboarding', count: pendingVerifications + unverifiedUsers, icon: Users },
            { id: 'matchmaking', label: '3. 3-Way Matchmaker', count: 0, icon: Briefcase },
            { id: 'analytics', label: '4. Process Analytics', count: 0, icon: TrendingUp },
            { id: 'disputes', label: '5. Dispute Resolution', count: openDisputes.length, icon: Scale },
            { id: 'escrows', label: '6. Lipa Escrow Trust', count: activeLeases.filter(a => a.mpesaEscrowStatus === 'ESCROWED').length, icon: DollarSign },
            { id: 'audit', label: '7. Ledger Audit Trails', count: 0, icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition cursor-pointer grow lg:grow-0 ${
                  activeSubTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </div>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${activeSubTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-rose-100 text-rose-800'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-Panels */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* TAB 1: LISTING MODERATION & CONTROL */}
          {activeSubTab === 'moderation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    Marketplace Moderation & Listing Controls
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Audit listings, grant official verified badge, pause, or remove fraudulent land/livestock posts.
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {unverifiedListings.length} Pending Approval
                </span>
              </div>

              {unverifiedListings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  All listings are audited and verified. No items pending moderation.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unverifiedListings.map((listing) => (
                    <div key={listing.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="flex gap-3 items-start">
                        <img 
                          src={listing.imageUrl} 
                          alt="" 
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{listing.title}</div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">
                            {listing.locationCounty} County • KES {listing.priceKES.toLocaleString()} • Owner: {listing.ownerName}
                          </p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5 max-w-lg font-light">
                            {listing.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        {onDeleteListing && (
                          <button
                            onClick={() => onDeleteListing(listing.id)}
                            className="px-2.5 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 text-[10px] font-bold uppercase transition cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        <button
                          onClick={() => onApproveListing(listing.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Approve & Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: KYC & ONBOARDING VERIFICATION */}
          {activeSubTab === 'kyc' && (
            <div className="space-y-6">
              {/* Document Registry Audit */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                      Title Deeds & Identity Verification Claims ({verificationRequests.length})
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Validate scanned Title Deeds, National ID Cards, and Kenya Veterinary Board (KVB) credentials.
                    </p>
                  </div>
                </div>

                {verificationRequests.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No document claims currently queued.</p>
                ) : (
                  <div className="space-y-3">
                    {verificationRequests.map(req => (
                      <div key={req.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                              {req.documentType}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white text-xs font-display">
                              {req.documentNumber}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            Claimant: {req.userName} ({req.userRole})
                          </p>
                          {req.notes && <p className="text-[10px] text-slate-500 italic">User Notes: "{req.notes}"</p>}
                          <p className="text-[9px] text-slate-400">Submitted: {new Date(req.submittedAt).toLocaleString()}</p>
                        </div>

                        {req.status === 'PENDING' ? (
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              onClick={() => onApproveVerification(req.id, 'REJECTED')}
                              className="px-3 py-1.5 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 text-xs font-bold"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => onApproveVerification(req.id, 'APPROVED')}
                              className="px-3.5 py-1.5 bg-slate-900 text-white text-[10px] uppercase tracking-wider font-bold rounded-lg hover:bg-slate-800 transition"
                            >
                              Certify Document
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase self-end sm:self-auto ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Account Registry Audit */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                    Registered Users & Member Accreditation
                  </h3>
                  <input
                    type="text"
                    placeholder="Search by name, phone or role..."
                    value={kycSearch}
                    onChange={(e) => setKycSearch(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {usersList
                    .filter(u => u.name.toLowerCase().includes(kycSearch.toLowerCase()) || u.phone.includes(kycSearch) || u.role.includes(kycSearch.toUpperCase()))
                    .map(user => (
                      <div key={user.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white">{user.name}</strong>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">{user.role}</span>
                            {user.verified ? (
                              <span className="text-[9px] text-emerald-600 font-bold">✓ VERIFIED</span>
                            ) : (
                              <span className="text-[9px] text-amber-600 font-bold">AWAITING KYC</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{user.phone} • {user.county} County</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {user.verified ? (
                            <button
                              onClick={() => onApproveUser(user.id, 'REJECTED')}
                              className="px-2.5 py-1 text-rose-600 text-[10px] font-bold hover:underline"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => onApproveUser(user.id, 'APPROVED')}
                              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-slate-800"
                            >
                              Pass KYC
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 3-WAY ECOSYSTEM MATCHMAKER */}
          {activeSubTab === 'matchmaking' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  Tripartite Matchmaking Tool (Investor + Farmer + Veterinarian)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  As Admin, match a capital investor with an arable farmer and assign a certified veterinarian to supervise animal welfare and production milestones.
                </p>
              </div>

              <form onSubmit={handleCreateMatch} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Select Investor */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-purple-100 dark:border-purple-950 bg-purple-50/30 dark:bg-purple-950/20">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
                      1. Select Capital Investor
                    </label>
                    <select
                      value={selectedInvestorId}
                      onChange={(e) => setSelectedInvestorId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="">Choose Capital Investor</option>
                      {investors.map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} (Budget: KES {inv.investmentBudgetKES?.toLocaleString()} - {inv.county})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">Provides financial backing & inputs.</p>
                  </div>

                  {/* Select Farmer */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/30 dark:bg-emerald-950/20">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                      2. Select Experienced Farmer
                    </label>
                    <select
                      value={selectedFarmerId}
                      onChange={(e) => setSelectedFarmerId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="">Choose Partner Farmer</option>
                      {farmers.map(fam => (
                        <option key={fam.id} value={fam.id}>
                          {fam.name} ({fam.county} - {fam.farmSpecialties?.join(', ') || 'Dairy'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">Provides arable shamba, water & labor.</p>
                  </div>

                  {/* Select Veterinarian */}
                  <div className="space-y-1.5 p-4 rounded-xl border border-teal-100 dark:border-teal-950 bg-teal-50/30 dark:bg-teal-950/20">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                      3. Assign Certified Veterinarian
                    </label>
                    <select
                      value={selectedVetId}
                      onChange={(e) => setSelectedVetId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="">Choose KVB Veterinarian</option>
                      {vets.map(vt => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name} ({vt.county} - Accredited)
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-500">Provides clinical care & audits.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agricultural Sector</label>
                    <select
                      value={matchSector}
                      onChange={(e: any) => setMatchSector(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="Dairy">Dairy Bovine Production</option>
                      <option value="Crops">Cereal & Maize Cultivation</option>
                      <option value="Horticulture">Horticulture & Greenhouse</option>
                      <option value="Poultry">Poultry Layers & Broilers</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Allocated Escrow Capital (KES)</label>
                    <input
                      type="number"
                      step="10000"
                      required
                      value={matchCapitalKES}
                      onChange={(e) => setMatchCapitalKES(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tripartite Operating Terms & Conditions</label>
                  <textarea
                    rows={2}
                    value={matchTerms}
                    onChange={(e) => setMatchTerms(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Forge Official Tripartite Agricultural Match
                </button>

                {matchSuccessMsg && (
                  <p className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                    {matchSuccessMsg}
                  </p>
                )}
              </form>
            </div>
          )}

          {/* TAB 4: PROCESS ANALYTICS & VISUAL TELEMETRY */}
          {activeSubTab === 'analytics' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Platform Process Analytics & System Telemetry
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Macro-level visibility into escrow fund flows, regional hub dispersion, and sector performance.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* County Escrow Distribution Chart */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Regional Hub Escrow Capital (KES)
                  </h4>
                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={countyDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="county" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="escrowKES" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sector Breakdown */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Sector Allocation (% Share)
                  </h4>
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sectorData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISPUTE RESOLUTION & ARBITRATION */}
          {activeSubTab === 'disputes' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-500" />
                  Dispute Resolution & Escrow Arbitration ({disputes.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Resolve claims between farmers, investors, and landowners with direct authority to refund or disburse escrow funds.
                </p>
              </div>

              {disputes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  Zero active disputes recorded. All leasehold and livestock agreements operating peacefully.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {disputes.map(disp => (
                      <div
                        key={disp.id}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          disp.status === 'OPEN' || disp.status === 'UNDER_REVIEW'
                            ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                              {disp.status}
                            </span>
                            <strong className="text-xs text-slate-900 dark:text-white block mt-1">
                              Filed by: {disp.creatorName}
                            </strong>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(disp.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans">
                          <strong>Claim:</strong> {disp.reason}
                        </p>

                        {disp.resolutionNotes && (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                            <strong>Arbitration Verdict:</strong> {disp.resolutionNotes}
                          </div>
                        )}

                        {(disp.status === 'OPEN' || disp.status === 'UNDER_REVIEW') && (
                          <button
                            onClick={() => setSelectedDisputeId(disp.id)}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition cursor-pointer"
                          >
                            Arbitrate This Dispute
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Arbitration Form */}
                  {selectedDisputeId && (
                    <form onSubmit={handleResolveDisputeSubmit} className="p-5 rounded-2xl border border-slate-900 bg-slate-900 text-white space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                        Arbitrate Dispute ID: {selectedDisputeId}
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resolution Action</label>
                          <select
                            value={disputeResolution}
                            onChange={(e: any) => setDisputeResolution(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white"
                          >
                            <option value="refund_farmer">Refund Escrow to Farmer / Tenant</option>
                            <option value="disburse_landowner">Disburse Escrow to Landowner / Asset Owner</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supervisor Justification Notes</label>
                          <input
                            type="text"
                            required
                            value={resolutionReason}
                            onChange={(e) => setResolutionReason(e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          Execute Escrow Arbitration Order
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDisputeId('')}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      {disputeSuccessMsg && (
                        <p className="p-2.5 bg-emerald-900/60 text-emerald-300 rounded-lg text-xs font-bold">
                          {disputeSuccessMsg}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ESCROWS TRUST */}
          {activeSubTab === 'escrows' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Lipa Escrow Trust Ledger ({activeLeases.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Total Held: KES {totalLeasedKES.toLocaleString()}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeLeases.map(lease => (
                  <div key={lease.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <strong className="text-slate-900 dark:text-white">Lease ID: {lease.id}</strong>
                      <p className="text-[10px] text-slate-500">
                        {lease.acreageLeased} Acres • Farmer: {lease.farmerId} • Landowner: {lease.landownerId}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 dark:text-white">KES {lease.paymentsMade?.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        lease.mpesaEscrowStatus === 'DISBURSED' ? 'bg-emerald-100 text-emerald-800' :
                        lease.mpesaEscrowStatus === 'DISPUTED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {lease.mpesaEscrowStatus}
                      </span>
                      {lease.mpesaEscrowStatus === 'ESCROWED' && (
                        <button
                          onClick={() => onDisburseEscrow(lease.id)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-700"
                        >
                          Disburse
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDIT TRAILS */}
          {activeSubTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Immutable Cryptographic Audit Trail
                </h3>
                <span className="text-[10px] text-slate-400">SHA-256 Ledger Operation Logs</span>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 font-mono text-[11px] space-y-2.5 border border-slate-800">
                <div className="text-amber-500 font-bold border-b border-slate-800 pb-1.5">// SHAMBALOOP KISUMU HUB LEDGER AUDIT</div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:02:15]</span>
                  <span className="text-slate-300 font-semibold">User user_1 registered via OTP simulation</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:04:10]</span>
                  <span className="text-emerald-400 font-semibold">M-Pesa transaction RGC56H78UI confirmed (KES 24,000)</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:04:11]</span>
                  <span className="text-amber-400 font-semibold">Agreement lease_abc safely bound into Escrow with Landowner user_1</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:05:08]</span>
                  <span className="text-amber-400 font-semibold">Verification request request_1 submitted by user Josphat Kiprop</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:06:50]</span>
                  <span className="text-slate-300">Admin Supervisor reviewed audit indices for Nyandarua hub</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
