import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, FileText, HeartPulse, MapPin, Plus, Search, Send, Sprout, Stethoscope } from 'lucide-react';
import { FarmEvent, FarmerProposal, Listing, LivestockPartnership, ProductionLog, User, VeterinaryJob, VeterinaryReport } from '../types';

type View = 'overview' | 'investors' | 'marketplace' | 'farm' | 'veterinary';

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
    { id: 'overview', label: 'Today' },
    { id: 'investors', label: 'Find investors' },
    { id: 'marketplace', label: 'Land & opportunities' },
    { id: 'farm', label: 'Farm records' },
    { id: 'veterinary', label: 'Veterinary care' }
  ];
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900" id="farmer_dashboard">
    <header className="border-b border-slate-200 px-5 py-4 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-950 dark:text-white">My farm</h2><p className="text-xs text-slate-500">What needs attention and the next useful action.</p></div><Sprout className="h-5 w-5 text-emerald-600"/></div><div className="mt-4 grid grid-cols-3 divide-x border border-slate-200 text-xs dark:divide-slate-800 dark:border-slate-800"><Metric label="Active collaborations" value={props.partnerships.filter(item => item.status === 'ACTIVE').length}/><Metric label="Open proposals" value={props.proposals.filter(item => item.status === 'SUBMITTED' || item.status === 'NEGOTIATING').length}/><Metric label="Needs attention" value={attention.length}/></div></header>
    <div className="flex flex-col lg:flex-row"><nav className="flex gap-1 overflow-x-auto border-b border-slate-200 p-2 lg:w-44 lg:flex-col lg:border-b-0 lg:border-r dark:border-slate-800">{nav.map(item => <button key={item.id} onClick={() => setView(item.id)} className={`rounded-lg px-3 py-2 text-left text-xs font-semibold ${view === item.id ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item.label}</button>)}</nav><main className="min-w-0 flex-1 p-5">
      {view === 'overview' && <Overview attention={attention} partnerships={props.partnerships} proposals={props.proposals} production={recentProduction} go={setView}/>}
      {view === 'investors' && <div className="space-y-5"><div><h3 className="text-sm font-bold dark:text-white">Find investors</h3><p className="text-xs text-slate-500">Choose an investor whose location, interests, and budget fit your farm.</p></div><label className="relative block"><Search className="absolute left-2 top-2 h-4 w-4 text-slate-400"/><input value={query} onChange={item => setQuery(item.target.value)} placeholder="Search by place, sector, or name" className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"/></label><div className="divide-y divide-slate-100 border-y dark:divide-slate-800">{filteredInvestors.map(investor => <article key={investor.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-48 flex-1"><strong className="text-xs dark:text-white">{investor.name}</strong><p className="text-[11px] text-slate-500">{investor.county} · Budget: KES {investor.investmentBudgetKES?.toLocaleString() || 'Not stated'}</p><p className="text-[11px] text-slate-600 dark:text-slate-300">{investor.investmentGoal || (investor.preferredSectors || []).join(', ') || 'No requirements stated'}</p></div><button onClick={() => setSelectedInvestor(investor)} className="action-primary"><Send className="h-3.5 w-3.5"/>Send proposal</button></article>)}</div>{!filteredInvestors.length && <p className="py-8 text-center text-xs text-slate-500">No matching investors are available yet.</p>}<section className="border-t pt-4 dark:border-slate-800"><h4 className="text-xs font-bold dark:text-white">My proposals</h4><Rows rows={props.proposals.map(item => [item.title, item.investorName || 'Open opportunity', <Status key="status" value={item.status}/>])} headers={['Proposal', 'Investor', 'Status']} empty="You have not sent a proposal yet."/></section></div>}
      {view === 'marketplace' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold dark:text-white">Land & Livestock Marketplace</h3>
              <p className="text-xs text-slate-500">Discover verified agricultural parcels and livestock partnerships across Kenya.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={marketCounty}
                onChange={(e) => setMarketCounty(e.target.value)}
                placeholder="Filter by county"
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ALL">All types</option>
                <option value="LAND">Farmland</option>
                <option value="LIVESTOCK">Livestock</option>
                <option value="OPPORTUNITY">Opportunity</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableListings.map((listing) => (
              <article key={listing.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
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
                    className="mt-4 w-full rounded-lg bg-emerald-700 py-1.5 text-center text-xs font-semibold text-white hover:bg-emerald-800 transition"
                  >
                    View & Connect
                  </button>
                )}
              </article>
            ))}
          </div>
          {!availableListings.length && (
            <p className="py-8 text-center text-xs text-slate-500">No active marketplace listings match these filters.</p>
          )}
        </div>
      )}
      {view === 'farm' && <div className="space-y-6"><div><h3 className="text-sm font-bold dark:text-white">Farm records</h3><p className="text-xs text-slate-500">Keep only the records that help you manage work and communicate with collaborators.</p></div><div className="grid gap-5 lg:grid-cols-2"><form onSubmit={saveProfile} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"><h4 className="text-xs font-bold dark:text-white">What I have and what I need</h4><label className="block text-xs text-slate-600 dark:text-slate-300">Farm activities and resources<input value={profile.specialties} onChange={item => setProfile(current => ({ ...current, specialties: item.target.value }))} placeholder="Dairy cattle, borehole, greenhouse" className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"/></label><label className="block text-xs text-slate-600 dark:text-slate-300">Land needed (acres)<input type="number" min="0" value={profile.acreage || ''} onChange={item => setProfile(current => ({ ...current, acreage: Number(item.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-200 p-2 dark:border-slate-700 dark:bg-slate-800"/></label><button disabled={working} className="action-primary">Save farm summary</button></form><form onSubmit={submitProduction} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"><h4 className="text-xs font-bold dark:text-white">Add production record</h4><select required value={production.partnershipId} onChange={item => setProduction(current => ({ ...current, partnershipId: item.target.value }))} className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="">Select livestock collaboration</option>{props.partnerships.map(item => <option key={item.id} value={item.id}>{item.animalTagId} · {item.breed}</option>)}</select><div className="grid grid-cols-2 gap-2"><input required value={production.metric} onChange={item => setProduction(current => ({ ...current, metric: item.target.value }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><input required min="0.1" type="number" value={production.quantity || ''} onChange={item => setProduction(current => ({ ...current, quantity: Number(item.target.value) }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/></div><button disabled={working || !props.partnerships.length} className="action-primary"><Plus className="h-3.5 w-3.5"/>Save record</button></form></div><form onSubmit={submitEvent} className="space-y-3 border-t pt-5 dark:border-slate-800"><h4 className="text-xs font-bold dark:text-white">Log an important event</h4><div className="grid gap-2 sm:grid-cols-3"><select value={event.farmId} onChange={item => setEvent(current => ({ ...current, farmId: item.target.value }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="farm_primary">My farm</option>{props.partnerships.map(item => <option key={item.id} value={item.id}>{item.animalTagId}</option>)}</select><select value={event.eventType} onChange={item => setEvent(current => ({ ...current, eventType: item.target.value as FarmEvent['eventType'] }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="VACCINATION_DUE">Vaccination due</option><option value="PEST_ALERT">Pest alert</option><option value="DROUGHT_ALERT">Drought alert</option><option value="HARVEST_WINDOW">Harvest window</option></select><select value={event.severity} onChange={item => setEvent(current => ({ ...current, severity: item.target.value as FarmEvent['severity'] }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></div><input required value={event.title} onChange={item => setEvent(current => ({ ...current, title: item.target.value }))} placeholder="What happened?" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><textarea required value={event.description} onChange={item => setEvent(current => ({ ...current, description: item.target.value }))} placeholder="Short description" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><button disabled={working} className="action-secondary">Save event</button></form><Rows headers={['Recent event', 'Severity', 'Date']} rows={props.events.map(item => [item.title, <Status key="status" value={item.severity}/>, new Date(item.date).toLocaleDateString()])} empty="No farm events recorded."/></div>}
      {view === 'veterinary' && <div className="space-y-6"><div><h3 className="text-sm font-bold dark:text-white">Veterinary care</h3><p className="text-xs text-slate-500">Request help, follow the request, and read reports for your own collaborations.</p></div><form onSubmit={submitVet} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2 dark:border-slate-800"><select value={vet.farmId} onChange={item => setVet(current => ({ ...current, farmId: item.target.value }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="farm_primary">My farm</option>{props.partnerships.map(item => <option key={item.id} value={item.id}>{item.animalTagId}</option>)}</select><select value={vet.assignedVetId} onChange={item => setVet(current => ({ ...current, assignedVetId: item.target.value }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="">Any available veterinarian</option>{props.veterinarians.map(item => <option key={item.id} value={item.id}>{item.name} · {item.county}</option>)}</select><input required value={vet.location} onChange={item => setVet(current => ({ ...current, location: item.target.value }))} placeholder="Farm location" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><input required value={vet.animalOrCropType} onChange={item => setVet(current => ({ ...current, animalOrCropType: item.target.value }))} placeholder="Animal or crop" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><select value={vet.serviceType} onChange={item => setVet(current => ({ ...current, serviceType: item.target.value as VeterinaryJob['serviceType'] }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="CLINICAL_CHECK">Clinical check</option><option value="VACCINATION">Vaccination</option><option value="PREGNANCY_SCAN">Pregnancy scan</option><option value="NUTRITIONAL_AUDIT">Nutrition check</option></select><select value={vet.urgency} onChange={item => setVet(current => ({ ...current, urgency: item.target.value as VeterinaryJob['urgency'] }))} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"><option value="NORMAL">Normal</option><option value="URGENT">Urgent</option><option value="EMERGENCY">Emergency</option></select><textarea value={vet.notes} onChange={item => setVet(current => ({ ...current, notes: item.target.value }))} placeholder="What should the veterinarian know?" className="sm:col-span-2 rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><button disabled={working} className="action-primary w-fit"><Stethoscope className="h-3.5 w-3.5"/>Request care</button></form><Rows headers={['Request', 'Urgency', 'Status']} rows={props.vetJobs.map(item => [item.animalOrCropType, <Status key="urgency" value={item.urgency}/>, <Status key="status" value={item.status}/>])} empty="No veterinary requests yet."/><section className="border-t pt-5 dark:border-slate-800"><h4 className="mb-3 text-xs font-bold dark:text-white">Recent reports</h4><div className="space-y-2">{props.reports.map(item => <article key={item.id} className="border-l-2 border-emerald-600 pl-3 text-xs"><div className="flex justify-between gap-2"><strong className="dark:text-white">{item.animalTagId} · {item.visitType}</strong><Status value={item.status}/></div><p className="mt-1 text-slate-600 dark:text-slate-300">{item.findings}</p><p className="mt-1 text-slate-500">Next step: {item.recommendations}</p></article>)}</div>{!props.reports.length && <p className="text-xs text-slate-500">No authorized veterinary reports are available.</p>}</section></div>}
    </main></div>{selectedInvestor && <ProposalDialog investor={selectedInvestor} proposal={proposal} setProposal={setProposal} submit={submitProposal} close={() => setSelectedInvestor(null)} working={working}/>}</section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="p-3"><span className="block text-[10px] text-slate-500">{label}</span><strong className="text-lg text-slate-950 dark:text-white">{value}</strong></div>; }
function Overview({ attention, partnerships, proposals, production, go }: { attention: (FarmEvent | VeterinaryJob)[]; partnerships: LivestockPartnership[]; proposals: FarmerProposal[]; production: ProductionLog[]; go: (view: View) => void }) { return <div className="space-y-6"><div><h3 className="text-sm font-bold dark:text-white">What needs attention</h3><div className="mt-3 divide-y divide-slate-100 border-y dark:divide-slate-800">{attention.length ? attention.slice(0, 4).map((item, index) => <div key={index} className="flex items-center gap-3 py-3"><AlertTriangle className="h-4 w-4 text-amber-500"/><div className="flex-1"><strong className="text-xs dark:text-white">{'title' in item ? item.title : item.animalOrCropType}</strong><p className="text-[11px] text-slate-500">{'description' in item ? item.description : `Veterinary request: ${item.status}`}</p></div><Status value={'severity' in item ? item.severity : item.urgency}/></div>) : <p className="py-6 text-center text-xs text-slate-500">Nothing urgent is recorded.</p>}</div></div><div className="grid gap-5 lg:grid-cols-2"><section><h3 className="text-sm font-bold dark:text-white">Active collaborations</h3><Rows headers={['Livestock', 'Partner', 'Status']} rows={partnerships.map(item => [item.animalTagId, item.breed, <Status key="status" value={item.status}/>])} empty="No active collaborations yet."/></section><section><h3 className="text-sm font-bold dark:text-white">Next step</h3><button onClick={() => go(proposals.length ? 'farm' : 'investors')} className="mt-3 flex w-full items-center gap-3 border border-slate-200 p-3 text-left text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"><Check className="h-4 w-4 text-emerald-600"/><span className="flex-1">{proposals.length ? 'Keep your farm records current for your collaborators.' : 'Find an investor and send your first proposal.'}</span><ChevronRight className="h-4 w-4 text-slate-400"/></button></section></div><section><h3 className="text-sm font-bold dark:text-white">Recent production</h3><Rows headers={['Metric', 'Quantity', 'Date']} rows={production.map(item => [item.metric, item.quantity, item.date])} empty="No production records yet."/></section></div>; }
function Rows({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) { return rows.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-200 text-[10px] uppercase text-slate-500 dark:border-slate-800"><tr>{headers.map(item => <th key={item} className="px-2 py-2">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-2 py-3 text-slate-700 dark:text-slate-300">{cell}</td>)}</tr>)}</tbody></table></div> : <p className="py-6 text-center text-xs text-slate-500">{empty}</p>; }
function ProposalDialog({ investor, proposal, setProposal, submit, close, working }: { investor: User; proposal: { title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }; setProposal: React.Dispatch<React.SetStateAction<{ title: string; sector: FarmerProposal['sector']; farmDescription: string; capitalRequestedKES: number; farmerContribution: string; investorSharePercent: number }>>; submit: (form: React.FormEvent) => Promise<void>; close: () => void; working: boolean }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><form onSubmit={submit} className="w-full max-w-lg space-y-3 rounded-xl bg-white p-5 dark:bg-slate-900"><div className="flex justify-between"><div><h3 className="text-sm font-bold dark:text-white">Proposal to {investor.name}</h3><p className="text-[11px] text-slate-500">{investor.investmentGoal || 'Investor requirements not stated'}</p></div><button type="button" onClick={close} className="text-xs text-slate-500">Close</button></div><input required value={proposal.title} onChange={item => setProposal(current => ({ ...current, title: item.target.value }))} placeholder="Proposal title" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><select value={proposal.sector} onChange={item => setProposal(current => ({ ...current, sector: item.target.value as FarmerProposal['sector'] }))} className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800">{['Dairy', 'Crops', 'Poultry', 'Horticulture', 'Goats', 'Mixed'].map(item => <option key={item}>{item}</option>)}</select><textarea required value={proposal.farmDescription} onChange={item => setProposal(current => ({ ...current, farmDescription: item.target.value }))} placeholder="Describe your farm and the opportunity" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><textarea required value={proposal.farmerContribution} onChange={item => setProposal(current => ({ ...current, farmerContribution: item.target.value }))} placeholder="What you bring: land, experience, equipment, labour" className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><div className="grid grid-cols-2 gap-2"><input required min="1" type="number" value={proposal.capitalRequestedKES || ''} onChange={item => setProposal(current => ({ ...current, capitalRequestedKES: Number(item.target.value) }))} placeholder="Investment needed (KES)" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/><input required min="1" max="99" type="number" value={proposal.investorSharePercent} onChange={item => setProposal(current => ({ ...current, investorSharePercent: Number(item.target.value) }))} placeholder="Investor share %" className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"/></div><button disabled={working} className="action-primary"><Send className="h-3.5 w-3.5"/>Send proposal</button></form></div>; }
