import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, FileText, HeartPulse, MapPin, Plus, Search, Send, Sprout, Star, Stethoscope } from 'lucide-react';
import { FarmEvent, FarmerProposal, Listing, LivestockPartnership, ProductionLog, User, VeterinaryJob, VeterinaryReport } from '../types';
import FarmerOperations from './FarmerOperations';
import ReviewModal from './ReviewModal';
import VerificationDocumentUploader from './VerificationDocumentUploader';

type View = 'overview' | 'investors' | 'marketplace' | 'farm' | 'veterinary' | 'fms' | 'wallet' | 'disputes' | 'reviews' | 'documents';

interface FarmerDashboardProps {
  currentUser: User;
  partnerships: LivestockPartnership[];
  reports: VeterinaryReport[];
  proposals: FarmerProposal[];
  events: FarmEvent[];
  vetJobs: VeterinaryJob[];
  investors: User[];
  veterinarians: User[];
  listings?: Listing[];
  onListingAction?: (listing: Listing) => void;
  onCreateProposal: (input: { investorId?: string; title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }) => Promise<void>;
  onSaveProfile: (input: { farmSpecialties: string[]; seekingLandAcreage: number }) => Promise<void>;
  onLogProduction: (partnershipId: string, quantity: number, metric: string) => Promise<void>;
  onLogEvent: (input: Pick<FarmEvent, 'farmId' | 'eventType' | 'title' | 'description' | 'severity'>) => Promise<void>;
  onRequestVet: (input: Pick<VeterinaryJob, 'farmId' | 'location' | 'animalOrCropType' | 'serviceType' | 'urgency' | 'assignedVetId' | 'notes'>) => Promise<void>;
}

const statusClass = (status: string) => status === 'ACCEPTED' || status === 'COMPLETED' || status === 'FIT_FOR_PRODUCTION' ? 'bg-emerald-50 text-emerald-800' : status === 'REJECTED' || status === 'EMERGENCY' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800';
const Status = ({ value }: { value: string; key?: React.Key }) => <span className={`rounded px-2 py-1 text-[10px] font-bold ${statusClass(value)}`}>{value.replaceAll('_', ' ')}</span>;

export default function FarmerDashboard(props: FarmerDashboardProps) {
  const [view, setView] = useState<View>('overview');
  const [working, setWorking] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<User | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [preselectedReviewTarget, setPreselectedReviewTarget] = useState<{ id: string; name: string; role: string } | null>(null);
  const [proposal, setProposal] = useState({ title: '', sector: 'Dairy' as FarmerProposal['sector'], farmDescription: '', capitalRequestedKES: 0, farmerContribution: '', investorSharePercent: 40 });
  const [profile, setProfile] = useState({ specialties: props.currentUser.farmSpecialties?.join(', ') || '', acreage: props.currentUser.seekingLandAcreage || 0 });
  const [production, setProduction] = useState({ partnershipId: props.partnerships[0]?.id || '', quantity: 0, metric: 'Milk Liters' });
  const [event, setEvent] = useState({ farmId: props.partnerships[0]?.id || 'farm_primary', eventType: 'VACCINATION_DUE' as FarmEvent['eventType'], title: '', description: '', severity: 'MEDIUM' as FarmEvent['severity'] });
  const [vet, setVet] = useState({ farmId: props.partnerships[0]?.id || 'farm_primary', location: `${props.currentUser.county} farm`, animalOrCropType: '', serviceType: 'CLINICAL_CHECK' as VeterinaryJob['serviceType'], urgency: 'NORMAL' as VeterinaryJob['urgency'], assignedVetId: '', notes: '' });

  const run = async (work: () => Promise<void>) => { setWorking(true); try { await work(); } finally { setWorking(false); } };
  const attention = [...props.events.filter(item => item.severity === 'HIGH' || item.severity === 'CRITICAL'), ...props.vetJobs.filter(item => item.status === 'OPEN' || item.status === 'IN_PROGRESS')];
  const filteredInvestors = useMemo(() => props.investors.filter(investor => `${investor.name} ${investor.county} ${(investor.preferredSectors || []).join(' ')} ${investor.investmentGoal || ''}`.toLowerCase().includes(query.toLowerCase())), [props.investors, query]);
  const recentProduction: ProductionLog[] = props.partnerships.flatMap(item => item.productionLogs || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const submitProposal = async (form: React.FormEvent) => { form.preventDefault(); if (!selectedInvestor) return; await run(async () => { await props.onCreateProposal({ investorId: selectedInvestor.id, ...proposal }); setSelectedInvestor(null); setProposal({ title: '', sector: 'Dairy', farmDescription: '', capitalRequestedKES: 0, farmerContribution: '', investorSharePercent: 40 }); }); };
  const saveProfile = async (form: React.FormEvent) => { form.preventDefault(); const farmSpecialties = profile.specialties.split(',').map(item => item.trim()).filter(Boolean); await run(() => props.onSaveProfile({ farmSpecialties, seekingLandAcreage: profile.acreage })); };
  const submitProduction = async (form: React.FormEvent) => { form.preventDefault(); if (!production.partnershipId) return; await run(async () => { await props.onLogProduction(production.partnershipId, production.quantity, production.metric); setProduction(current => ({ ...current, quantity: 0 })); }); };
  const submitEvent = async (form: React.FormEvent) => { form.preventDefault(); await run(async () => { await props.onLogEvent(event); setEvent(current => ({ ...current, title: '', description: '' })); }); };
  const submitVet = async (form: React.FormEvent) => { form.preventDefault(); await run(async () => { await props.onRequestVet({ ...vet, assignedVetId: vet.assignedVetId || undefined }); setVet(current => ({ ...current, animalOrCropType: '', notes: '' })); }); };

  const [marketCounty, setMarketCounty] = useState('');
  const [marketType, setMarketType] = useState('ALL');

  const availableListings = useMemo(() => {
    return (props.listings || []).filter(listing => {
      if (listing.moderationStatus === 'REJECTED' || listing.moderationStatus === 'SUSPENDED') return false;
      const matchesCounty = !marketCounty || (listing.locationCounty && listing.locationCounty.toLowerCase() === marketCounty.toLowerCase());
      const matchesType = marketType === 'ALL' || listing.type === marketType;
      return matchesCounty && matchesType;
    });
  }, [props.listings, marketCounty, marketType]);

  const nav: { id: View; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'investors', label: 'Find investors' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'farm', label: 'Farm records' },
    { id: 'veterinary', label: 'Veterinary care' },
    { id: 'fms', label: 'Farm Management System' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'documents', label: 'Documents & KYC' },
    { id: 'disputes', label: 'Dispute Room' },
    { id: 'reviews', label: 'Reviews' }
  ];

  return (
    <section id="farmer_dashboard" className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Farmer workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Hello, {props.currentUser.name}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Welcome to your cooperative farming workspace. Track production, connect with vetted investors, manage veterinary care, and keep records current.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2" aria-label="Farmer workspace views">
            {nav.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                  view === item.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {view === 'overview' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Active collaborations"
              value={props.partnerships.filter(item => item.status === 'ACTIVE').length}
              note="Authorized farm partnerships"
              onClick={() => setView('farm')}
            />
            <Metric
              label="Open proposals"
              value={props.proposals.filter(item => item.status === 'SUBMITTED' || item.status === 'NEGOTIATING').length}
              note="Awaiting investor response"
              onClick={() => setView('investors')}
            />
            <Metric
              label="Needs attention"
              value={attention.length}
              note="Urgent events and open care requests"
              alert={attention.length > 0}
              onClick={() => setView('overview')}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active collaborations</h2>
                <span className="text-xs text-slate-500">Authorized farm partnerships</span>
              </div>
              {props.partnerships.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/40">
                      <tr>
                        <th className="px-4 py-2">Livestock</th>
                        <th className="px-4 py-2">Breed / Type</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Latest log</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {props.partnerships.map(item => {
                        const latest = (item.productionLogs || [])[0];
                        return (
                          <tr key={item.id}>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {item.animalTagId}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                              {item.breed}
                            </td>
                            <td className="px-4 py-3">
                              <Status value={item.status} />
                            </td>
                            <td className="px-4 py-3 text-slate-500">
                              {latest ? `${latest.quantity} ${latest.metric} · ${latest.date}` : 'No production recorded'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty text="No active collaborations yet." action="Find an investor" onAction={() => setView('investors')} />
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">What needs attention</h2>
              </div>
              {attention.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attention.slice(0, 5).map((item, index) => (
                    <li key={index} className="flex gap-3 px-4 py-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {'title' in item ? item.title : item.animalOrCropType}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {'description' in item ? item.description : `Veterinary request: ${item.status}`}
                        </p>
                      </div>
                      <Status value={'severity' in item ? item.severity : item.urgency} />
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="Nothing urgent is recorded. All farm events and health checks are up to date." />
              )}
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <RecordList
              title="Recent production logs"
              icon={<Sprout className="h-4 w-4 text-emerald-600" />}
              records={recentProduction.map(log => ({
                id: log.id,
                title: `${log.quantity} ${log.metric}`,
                detail: `Revenue: KES ${log.revenueKES.toLocaleString()} · Payout: KES ${log.farmerPayoutKES.toLocaleString()}`,
                at: log.date
              }))}
              empty="No production records yet."
            />

            <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white mb-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-bold">Next recommended action</h2>
              </div>
              <button
                type="button"
                onClick={() => setView(props.proposals.length ? 'farm' : 'investors')}
                className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left text-xs transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  {props.proposals.length
                    ? 'Keep your farm records and production logs current for collaborators.'
                    : 'Browse available capital investors and submit your first proposal.'}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </section>
          </div>
        </>
      )}

      {view === 'investors' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Find investors</h3>
              <p className="text-xs text-slate-500">Choose an investor whose location, capital goals, and preferred sectors fit your farm.</p>
            </div>
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by location, sector, or name"
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          {filteredInvestors.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInvestors.map(investor => (
                <article key={investor.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <strong className="text-sm font-bold text-slate-900 dark:text-white">{investor.name}</strong>
                        <p className="text-xs text-slate-500">{investor.county} · Budget: KES {investor.investmentBudgetKES?.toLocaleString() || 'Not stated'}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {investor.verified ? 'Verified' : 'Member'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      {investor.investmentGoal || (investor.preferredSectors || []).join(' · ') || 'Active investor seeking agricultural opportunities'}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedInvestor(investor)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 py-2 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send proposal</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty text="No matching investors are available yet." />
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">My proposals</h4>
            </div>
            <Rows
              rows={props.proposals.map(item => [item.title, item.investorName || 'Open opportunity', <Status key="status" value={item.status} />])}
              headers={['Proposal', 'Investor', 'Status']}
              empty="You have not sent a proposal yet."
            />
          </section>
        </section>
      )}

      {view === 'marketplace' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Land & Livestock Marketplace</h3>
              <p className="text-xs text-slate-500">Discover verified agricultural parcels and livestock partnerships across Kenya.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={marketCounty}
                onChange={e => setMarketCounty(e.target.value)}
                placeholder="Filter by county"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <select
                value={marketType}
                onChange={e => setMarketType(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All types</option>
                <option value="LAND">Farmland</option>
                <option value="LIVESTOCK">Livestock</option>
                <option value="OPPORTUNITY">Opportunity</option>
              </select>
            </div>
          </div>
          {availableListings.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableListings.map(listing => (
                <article key={listing.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                        {listing.type}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        KES {listing.priceKES.toLocaleString()}
                      </span>
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {listing.title}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {listing.location}, {listing.county}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {listing.description}
                    </p>
                    {listing.landDetails && (
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        {listing.landDetails.acreage} Acres · {listing.landDetails.soilType}
                      </p>
                    )}
                  </div>
                  {props.onListingAction && (
                    <button
                      type="button"
                      onClick={() => props.onListingAction?.(listing)}
                      className="mt-4 w-full rounded-lg bg-emerald-700 py-2 text-center text-xs font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
                    >
                      View & Connect
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <Empty text="No active marketplace listings match these filters." />
          )}
        </section>
      )}

      {view === 'farm' && (
        <section className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Farm records</h3>
            <p className="text-xs text-slate-500">Keep verifiable records that help manage operations and communicate with collaborators.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={saveProfile} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">What I have and what I need</h4>
              <label className="block text-xs text-slate-600 dark:text-slate-300">
                Farm activities and resources
                <input
                  value={profile.specialties}
                  onChange={e => setProfile(current => ({ ...current, specialties: e.target.value }))}
                  placeholder="Dairy cattle, borehole, greenhouse"
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <label className="block text-xs text-slate-600 dark:text-slate-300">
                Land needed (acres)
                <input
                  type="number"
                  min="0"
                  value={profile.acreage || ''}
                  onChange={e => setProfile(current => ({ ...current, acreage: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </label>
              <button disabled={working} className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer">
                Save farm summary
              </button>
            </form>

            <form onSubmit={submitProduction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Add production record</h4>
              <select
                required
                value={production.partnershipId}
                onChange={e => setProduction(current => ({ ...current, partnershipId: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select livestock collaboration</option>
                {props.partnerships.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.animalTagId} · {item.breed}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={production.metric}
                  onChange={e => setProduction(current => ({ ...current, metric: e.target.value }))}
                  className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  required
                  min="0.1"
                  type="number"
                  value={production.quantity || ''}
                  onChange={e => setProduction(current => ({ ...current, quantity: Number(e.target.value) }))}
                  className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <button
                disabled={working || !props.partnerships.length}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save record</span>
              </button>
            </form>
          </div>

          <form onSubmit={submitEvent} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Log an important event</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={event.farmId}
                onChange={e => setEvent(current => ({ ...current, farmId: e.target.value }))}
                className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="farm_primary">My farm</option>
                {props.partnerships.map(item => (
                  <option key={item.id} value={item.id}>{item.animalTagId}</option>
                ))}
              </select>
              <select
                value={event.eventType}
                onChange={e => setEvent(current => ({ ...current, eventType: e.target.value as FarmEvent['eventType'] }))}
                className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="VACCINATION_DUE">Vaccination due</option>
                <option value="PEST_ALERT">Pest alert</option>
                <option value="DROUGHT_ALERT">Drought alert</option>
                <option value="HARVEST_WINDOW">Harvest window</option>
              </select>
              <select
                value={event.severity}
                onChange={e => setEvent(current => ({ ...current, severity: e.target.value as FarmEvent['severity'] }))}
                className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <input
              required
              value={event.title}
              onChange={e => setEvent(current => ({ ...current, title: e.target.value }))}
              placeholder="What happened?"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <textarea
              required
              value={event.description}
              onChange={e => setEvent(current => ({ ...current, description: e.target.value }))}
              placeholder="Short description"
              className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button disabled={working} className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              Save event
            </button>
          </form>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Logged events history</h4>
            </div>
            <Rows
              headers={['Recent event', 'Severity', 'Date']}
              rows={props.events.map(item => [item.title, <Status key="status" value={item.severity} />, new Date(item.date).toLocaleDateString()])}
              empty="No farm events recorded."
            />
          </section>
        </section>
      )}

      {view === 'veterinary' && (
        <section className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Veterinary care</h3>
            <p className="text-xs text-slate-500">Request clinical check-ups, follow requests, and review authorized veterinary health reports.</p>
          </div>
          <form onSubmit={submitVet} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
            <select
              value={vet.farmId}
              onChange={e => setVet(current => ({ ...current, farmId: e.target.value }))}
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="farm_primary">My farm</option>
              {props.partnerships.map(item => (
                <option key={item.id} value={item.id}>{item.animalTagId}</option>
              ))}
            </select>
            <select
              value={vet.assignedVetId}
              onChange={e => setVet(current => ({ ...current, assignedVetId: e.target.value }))}
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Any available veterinarian</option>
              {props.veterinarians.map(item => (
                <option key={item.id} value={item.id}>{item.name} · {item.county}</option>
              ))}
            </select>
            <input
              required
              value={vet.location}
              onChange={e => setVet(current => ({ ...current, location: e.target.value }))}
              placeholder="Farm location"
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <input
              required
              value={vet.animalOrCropType}
              onChange={e => setVet(current => ({ ...current, animalOrCropType: e.target.value }))}
              placeholder="Animal or crop"
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <select
              value={vet.serviceType}
              onChange={e => setVet(current => ({ ...current, serviceType: e.target.value as VeterinaryJob['serviceType'] }))}
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="CLINICAL_CHECK">Clinical check</option>
              <option value="VACCINATION">Vaccination</option>
              <option value="PREGNANCY_SCAN">Pregnancy scan</option>
              <option value="NUTRITIONAL_AUDIT">Nutrition check</option>
            </select>
            <select
              value={vet.urgency}
              onChange={e => setVet(current => ({ ...current, urgency: e.target.value as VeterinaryJob['urgency'] }))}
              className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <textarea
              value={vet.notes}
              onChange={e => setVet(current => ({ ...current, notes: e.target.value }))}
              placeholder="What should the veterinarian know?"
              className="sm:col-span-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button disabled={working} className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 cursor-pointer w-fit">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Request care</span>
            </button>
          </form>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active care requests</h4>
            </div>
            <Rows
              headers={['Request', 'Urgency', 'Status']}
              rows={props.vetJobs.map(item => [item.animalOrCropType, <Status key="urgency" value={item.urgency} />, <Status key="status" value={item.status} />])}
              empty="No veterinary requests yet."
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h4 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Recent health reports</h4>
            <div className="space-y-3">
              {props.reports.map(item => (
                <article key={item.id} className="border-l-4 border-emerald-600 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-r-lg text-xs">
                  <div className="flex justify-between gap-2">
                    <strong className="text-slate-900 dark:text-white">{item.animalTagId} · {item.visitType}</strong>
                    <Status value={item.status} />
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{item.findings}</p>
                  <p className="mt-1 text-slate-500">Next step: {item.recommendations}</p>
                </article>
              ))}
            </div>
            {!props.reports.length && <p className="text-xs text-slate-500">No authorized veterinary reports are available.</p>}
          </section>
        </section>
      )}

      {(view === 'fms' || view === 'wallet' || view === 'disputes' || view === 'reviews') && (
        <FarmerOperations
          user={props.currentUser}
          partnerships={props.partnerships}
          mode={view === 'disputes' ? 'disputes' : view === 'reviews' ? 'reviews' : view === 'wallet' ? 'wallet' : 'fms'}
          veterinaryJobs={props.vetJobs}
        />
      )}

      {view === 'documents' && (
        <VerificationDocumentUploader
          user={props.currentUser}
          roleType="farmer"
        />
      )}

      {selectedInvestor && (
        <ProposalDialog
          investor={selectedInvestor}
          proposal={proposal}
          setProposal={setProposal}
          submit={submitProposal}
          close={() => setSelectedInvestor(null)}
          working={working}
        />
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        currentUser={props.currentUser}
        preselectedTarget={preselectedReviewTarget}
      />
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

function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="px-4 py-7 text-center text-xs text-slate-500">
      <p>{text}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-2 font-semibold text-white transition cursor-pointer"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function RecordList({ title, icon, records, empty }: { title: string; icon: React.ReactNode; records: Array<{ id: string; title: string; detail: string; at: string }>; empty: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-slate-800 dark:border-slate-800 dark:text-white">
        {icon}
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {records.length ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map(record => (
            <li key={record.id} className="px-4 py-3">
              <div className="flex justify-between gap-3">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{record.title}</p>
                <time className="shrink-0 text-[11px] text-slate-500">{record.at}</time>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{record.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text={empty} />
      )}
    </section>
  );
}

function Rows({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 dark:bg-slate-800/40">
          <tr>
            {headers.map(item => (
              <th key={item} className="px-4 py-2 font-semibold">
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="py-6 text-center text-xs text-slate-500">{empty}</p>
  );
}
function ProposalDialog({ investor, proposal, setProposal, submit, close, working }: { investor: User; proposal: { title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }; setProposal: React.Dispatch<React.SetStateAction<{ title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }>>; submit: (form: React.FormEvent) => Promise<void>; close: () => void; working: boolean }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={submit} className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 dark:bg-slate-900"><div className="flex justify-between"><div><h3 className="text-sm font-bold dark:text-white">Proposal to {investor.name}</h3><p className="text-[11px] text-slate-500">{investor.investmentGoal || 'Investor requirements not stated'}</p></div><button type="button" onClick={close} className="text-xs text-slate-500">Close</button></div><input required value={proposal.title} onChange={item => setProposal(current => ({ ...current, title: item.target.value }))} placeholder="Proposal title" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><select value={proposal.sector} onChange={item => setProposal(current => ({ ...current, sector: item.target.value as FarmerProposal['sector'] }))} className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800">{['Dairy', 'Crops', 'Poultry', 'Horticulture', 'Goats', 'Mixed'].map(item => <option key={item}>{item}</option>)}</select><textarea required value={proposal.farmDescription} onChange={item => setProposal(current => ({ ...current, farmDescription: item.target.value }))} placeholder="Describe your farm and the opportunity" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><textarea required value={proposal.farmerContribution} onChange={item => setProposal(current => ({ ...current, farmerContribution: item.target.value }))} placeholder="What you bring: land, experience, equipment, labour" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><div className="grid grid-cols-2 gap-2"><input required min="1" type="number" value={proposal.capitalRequestedKES || ''} onChange={item => setProposal(current => ({ ...current, capitalRequestedKES: Number(item.target.value) }))} placeholder="Investment needed (KES)" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><input required min="1" max="99" type="number" value={proposal.investorSharePercent} onChange={item => setProposal(current => ({ ...current, investorSharePercent: Number(item.target.value) }))} placeholder="Investor share %" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/></div><button disabled={working} className="action-primary"><Send className="h-3.5 w-3.5"/>Send proposal</button></form></div>; }
