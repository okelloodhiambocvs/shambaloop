import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, ClipboardList, FileText, MapPin, PlusCircle, ShieldAlert, Stethoscope, UsersRound } from 'lucide-react';
import { FarmEvent, FarmerProposal, InvestorCriteria, InvestorFarmerProfile, Listing, LivestockPartnership, User, VeterinaryReport } from '../types';
import ParticipantWorkspace from './ParticipantWorkspace';
import { readFileAsBase64, sharedWorkspaceApi } from '../services/sharedWorkspaceService';

interface Props {
  currentUser: User;
  partnerships: LivestockPartnership[];
  veterinaryReports: VeterinaryReport[];
  proposals: FarmerProposal[];
  farmEvents: FarmEvent[];
  farmers: InvestorFarmerProfile[];
  criteria: InvestorCriteria | null;
  listings?: Listing[];
  onListingAction?: (listing: Listing) => void;
  onSaveCriteria: (criteria: Omit<InvestorCriteria, 'id' | 'createdAt' | 'investorId' | 'investorName' | 'status'>) => Promise<void>;
  onUpdateProposal: (id: string, status: Extract<FarmerProposal['status'], 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED'>) => Promise<void>;
}

const sectors = ['Dairy', 'Crops', 'Poultry', 'Horticulture', 'Goats', 'Mixed'];
const models: Array<{ value: InvestorCriteria['lookingFor']; label: string }> = [
  { value: 'FARMER_WITH_LAND_NEEDING_CAPITAL', label: 'Farmer with land' },
  { value: 'FARM_MANAGER_EXPERTISE', label: 'Farm manager' },
  { value: 'LAND_FOR_LEASE_PROJECT', label: 'Land for a project' }
];
const money = (amount: number) => `KES ${amount.toLocaleString()}`;
const date = (value: string) => new Date(value).toLocaleDateString();

export default function InvestorDashboard(props: Props) {
  const [view, setView] = useState<'overview' | 'farmers' | 'opportunities' | 'brief' | 'fms' | 'wallet' | 'disputes' | 'reviews'>('overview');
  const [county, setCounty] = useState('');
  const [sector, setSector] = useState('');
  const [oppType, setOppType] = useState('ALL');
  const [busy, setBusy] = useState<string | null>(null);
  const [brief, setBrief] = useState({
    lookingFor: props.criteria?.lookingFor || 'FARMER_WITH_LAND_NEEDING_CAPITAL' as InvestorCriteria['lookingFor'],
    budgetKES: props.criteria?.budgetKES || props.currentUser.investmentBudgetKES || 0,
    preferredSectors: props.criteria?.preferredSectors || props.currentUser.preferredSectors || ['Dairy'],
    targetCounties: (props.criteria?.targetCounties || [props.currentUser.county]).join(', '),
    resourcesProvided: props.criteria?.resourcesProvided || '',
    partnerRequirements: props.criteria?.partnerRequirements || props.currentUser.investmentGoal || '',
    notes: props.criteria?.notes || ''
  });

  useEffect(() => {
    if (!props.criteria) return;
    setBrief({
      lookingFor: props.criteria.lookingFor,
      budgetKES: props.criteria.budgetKES,
      preferredSectors: props.criteria.preferredSectors,
      targetCounties: props.criteria.targetCounties.join(', '),
      resourcesProvided: props.criteria.resourcesProvided || '',
      partnerRequirements: props.criteria.partnerRequirements || '',
      notes: props.criteria.notes
    });
  }, [props.criteria]);

  const collaborations = useMemo(() => props.partnerships.filter(item => item.investorId === props.currentUser.id), [props.partnerships, props.currentUser.id]);
  const proposals = useMemo(() => props.proposals.filter(item => item.investorId === props.currentUser.id), [props.proposals, props.currentUser.id]);
  const alerts = useMemo(() => [
    ...props.farmEvents.filter(event => event.severity === 'HIGH' || event.severity === 'CRITICAL').map(event => ({ id: `event-${event.id}`, type: 'Farm event', text: event.title, at: event.date })),
    ...props.veterinaryReports.filter(report => report.status !== 'FIT_FOR_PRODUCTION').map(report => ({ id: `report-${report.id}`, type: 'Veterinary update', text: `${report.animalTagId}: ${report.status.replaceAll('_', ' ').toLowerCase()}`, at: report.createdAt })),
    ...collaborations.flatMap(item => item.healthLogs.filter(log => log.status === 'Sick').map(log => ({ id: `health-${item.id}-${log.id}`, type: 'Animal health concern', text: `${item.animalTagId}: ${log.notes}`, at: log.date })))
  ].sort((a, b) => b.at.localeCompare(a.at)), [collaborations, props.farmEvents, props.veterinaryReports]);
  const farmers = useMemo(() => props.farmers.filter(farmer => {
    const text = `${farmer.name} ${farmer.county} ${(farmer.farmSpecialties || []).join(' ')} ${farmer.listings.map(listing => `${listing.title} ${listing.description}`).join(' ')}`.toLowerCase();
    return (!county || farmer.county.toLowerCase() === county.toLowerCase()) && (!sector || text.includes(sector.toLowerCase()));
  }), [props.farmers, county, sector]);
  const production = collaborations.flatMap(item => item.productionLogs).slice(0, 5);

  const saveBrief = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy('brief');
    try {
      await props.onSaveCriteria({ ...brief, targetCounties: brief.targetCounties.split(',').map(item => item.trim()).filter(Boolean) });
    } finally { setBusy(null); }
  };
  const changeProposal = async (id: string, status: Extract<FarmerProposal['status'], 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED'>) => {
    setBusy(id);
    try { await props.onUpdateProposal(id, status); } finally { setBusy(null); }
  };
  const toggleSector = (value: string) => setBrief(current => ({ ...current, preferredSectors: current.preferredSectors.includes(value) ? current.preferredSectors.filter(item => item !== value) : [...current.preferredSectors, value] }));

  return <section id="investor_primary_dashboard" className="space-y-5">
    <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">Investor workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Projects, opportunities, and decisions</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">See active projects, review farm records, and decide what needs your attention.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Investor workspace views">
        {([['overview', 'Overview'], ['farmers', 'Find farmers'], ['brief', 'Investment brief'], ['fms', 'Farm Management System'], ['wallet', 'Wallet'], ['disputes', 'Dispute Room'], ['reviews', 'Reviews']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setView(id)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === id ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{label}</button>)}
      </nav>
    </header>

    {view === 'overview' && <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Active collaborations" value={collaborations.length} note="Projects you can monitor" />
        <Metric label="Proposals to review" value={proposals.filter(item => item.status === 'SUBMITTED' || item.status === 'NEGOTIATING').length} note="Submitted directly to you" />
        <Metric label="Needs attention" value={alerts.length} note="Farm and veterinary records" alert={alerts.length > 0} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Active collaborations</h2><span className="text-xs text-slate-500">Authorized project records</span></div>
          {collaborations.length ? <div className="overflow-x-auto"><table className="w-full min-w-[580px] text-left text-xs"><thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/40"><tr><th className="px-4 py-2">Farm record</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Latest production</th><th className="px-4 py-2">Your share</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{collaborations.map(item => { const latest = item.productionLogs[0]; return <tr key={item.id}><td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.animalTagId}<span className="ml-2 font-normal text-slate-500">{item.breed}</span></td><td className="px-4 py-3"><Status value={item.status} /></td><td className="px-4 py-3">{latest ? `${latest.quantity} ${latest.metric} · ${date(latest.date)}` : 'No production recorded'}</td><td className="px-4 py-3">{latest ? money(latest.investorPayoutKES) : '—'}</td></tr>; })}</tbody></table></div> : <Empty text="No active collaborations yet." action="Find a farmer" onAction={() => setView('farmers')} />}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Requires attention</h2></div>{alerts.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{alerts.slice(0, 5).map(item => <li key={item.id} className="flex gap-3 px-4 py-3"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"/><div><p className="text-xs font-semibold text-slate-900 dark:text-white">{item.text}</p><p className="mt-0.5 text-[11px] text-slate-500">{item.type} · {date(item.at)}</p></div></li>)}</ul> : <Empty text="No actionable farm or veterinary alerts." />}</section>
      </div>
      <div className="grid gap-5 lg:grid-cols-2"><RecordList title="Recent farm reports" icon={<ClipboardList className="h-4 w-4" />} records={production.map(log => ({ id: log.id, title: `${log.quantity} ${log.metric}`, detail: `${money(log.revenueKES)} gross · investor share ${money(log.investorPayoutKES)}`, at: log.date }))} empty="No production reports have been shared." /><RecordList title="Veterinary updates" icon={<Stethoscope className="h-4 w-4" />} records={props.veterinaryReports.slice(0, 5).map(report => ({ id: report.id, title: `${report.animalTagId} · ${report.visitType}`, detail: report.status.replaceAll('_', ' '), at: report.createdAt }))} empty="No veterinary reports have been shared." /></div>
      <p className="text-xs text-slate-500">Environmental data is unavailable: no live weather or environmental feed is connected. Alerts shown here come from authorized farm and veterinary records.</p>
      {proposals.length > 0 && <ProposalList proposals={proposals} busy={busy} onChange={changeProposal} />}
    </>}

    {view === 'opportunities' && false && <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={county} onChange={event => setCounty(event.target.value)} placeholder="Filter by county" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"/>
        <select value={oppType} onChange={event => setOppType(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="ALL">All opportunities</option>
          <option value="OPPORTUNITY">Investment deals</option>
          <option value="LIVESTOCK">Livestock partnerships</option>
          <option value="LAND">Farmland projects</option>
        </select>
      </div>
      <p className="text-xs text-slate-500">Discover vetted agricultural parcels and commercial livestock operations seeking investment across Kenya.</p>
      {props.listings && props.listings.filter(l => l.moderationStatus !== 'REJECTED' && l.moderationStatus !== 'SUSPENDED' && (!county || (l.locationCounty && l.locationCounty.toLowerCase().includes(county.toLowerCase()))) && (oppType === 'ALL' || l.type === oppType)).length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.listings.filter(l => l.moderationStatus !== 'REJECTED' && l.moderationStatus !== 'SUSPENDED' && (!county || (l.locationCounty && l.locationCounty.toLowerCase().includes(county.toLowerCase()))) && (oppType === 'ALL' || l.type === oppType)).map(listing => (
            <article key={listing.id} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">{listing.type}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{money(listing.priceKES)}</span>
                </div>
                <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500"><MapPin className="h-3 w-3 shrink-0"/>{listing.locationCounty}</p>
                <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{listing.description}</p>
              </div>
              {props.onListingAction && (
                <button type="button" onClick={() => props.onListingAction?.(listing)} className="mt-4 w-full rounded-lg bg-violet-700 py-1.5 text-center text-xs font-semibold text-white hover:bg-violet-800 transition">
                  Evaluate & Connect
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <Empty text="No marketplace opportunities match these criteria." />
      )}
    </section>}

    {view === 'farmers' && <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={county} onChange={event => setCounty(event.target.value)} placeholder="Filter by county" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"/>
        <select value={sector} onChange={event => setSector(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">All activities</option>
          {sectors.map(item => <option key={item}>{item}</option>)}
        </select>
      </div>
      <p className="text-xs text-slate-500">Showing public farmer profiles and approved listings. Private farm records are available only after a collaboration is established.</p>
      {farmers.length ? <div className="grid gap-3 lg:grid-cols-2">{farmers.map(farmer => <article key={farmer.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900 dark:text-white">{farmer.name}</h2><p className="text-xs text-slate-500">{farmer.county}{farmer.verified ? ' · Verified profile' : ''}</p></div><UsersRound className="h-5 w-5 text-violet-600"/></div><p className="mt-3 text-xs text-slate-600 dark:text-slate-300">{farmer.farmSpecialties?.length ? farmer.farmSpecialties.join(' · ') : 'Farm details have not been added.'}</p><div className="mt-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800"><strong className="text-slate-800 dark:text-slate-100">Approved listings</strong>{farmer.listings.length ? <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">{farmer.listings.slice(0, 2).map(listing => <li key={listing.id}>{listing.title} · {money(listing.priceKES)}</li>)}</ul> : <p className="mt-1 text-slate-500">No approved listings.</p>}</div><p className="mt-3 text-xs text-slate-500">{proposals.some(proposal => proposal.farmerId === farmer.id) ? 'A proposal from this farmer is ready for review.' : 'No proposal has been sent to you.'}</p></article>)}</div> : <Empty text="No farmers match these filters." />}
    </section>}

    {view === 'brief' && <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><BriefcaseBusiness className="h-5 w-5 text-violet-700"/><h2 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Your investment opportunity</h2><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Describe the capital or resources you provide and the partner you need. Farmers can discover these public requirements; private records are not exposed.</p><div className="mt-5 space-y-3 text-xs"><p><strong>Capital:</strong> {brief.budgetKES ? money(brief.budgetKES) : 'Not set'}</p><p><strong>Focus:</strong> {brief.preferredSectors.join(', ') || 'Not set'}</p><p><strong>Counties:</strong> {brief.targetCounties || 'Not set'}</p></div>{props.criteria && <form className="mt-5 space-y-2 border-t pt-4 text-xs" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget), file = form.get('file') as File; if (!file?.size) return; setBusy('brief-upload'); void (async () => { const result = await sharedWorkspaceApi.upload({ fileName: file.name, mimeType: file.type, base64Data: await readFileAsBase64(file), relatedInvestmentBriefId: props.criteria!.id, documentType: 'INVESTMENT_VERIFICATION', description: form.get('description') }); if (!result.error) event.currentTarget.reset(); setBusy(null); })(); }}><strong>Verification document or image</strong><input required name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"/><input name="description" placeholder="What this verifies"/><button disabled={busy === 'brief-upload'} className="rounded-lg bg-violet-700 px-3 py-2 text-xs text-white">Upload verification file</button></form>}</div><form onSubmit={saveBrief} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><Field label="Partnership type"><select value={brief.lookingFor} onChange={event => setBrief(current => ({ ...current, lookingFor: event.target.value as InvestorCriteria['lookingFor'] }))}>{models.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}</select></Field><Field label="Capital available (KES)"><input required min="1" max="100000000" type="number" value={brief.budgetKES || ''} onChange={event => setBrief(current => ({ ...current, budgetKES: Number(event.target.value) }))}/></Field><Field label="What I provide"><textarea required maxLength={1000} value={brief.resourcesProvided} onChange={event => setBrief(current => ({ ...current, resourcesProvided: event.target.value }))} placeholder="Capital, equipment, market access, land, or other resources" /></Field><Field label="What I need from a partner"><textarea required maxLength={1000} value={brief.partnerRequirements} onChange={event => setBrief(current => ({ ...current, partnerRequirements: event.target.value }))} placeholder="Experience, land, activity, management expertise, and partnership terms" /></Field><div><p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Focus areas</p><div className="flex flex-wrap gap-2">{sectors.map(item => <button key={item} type="button" onClick={() => toggleSector(item)} className={`rounded-full px-3 py-1.5 text-xs ${brief.preferredSectors.includes(item) ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{item}</button>)}</div></div><Field label="Target counties (separate with commas)"><input required value={brief.targetCounties} onChange={event => setBrief(current => ({ ...current, targetCounties: event.target.value }))}/></Field><Field label="Additional notes"><textarea required maxLength={1500} value={brief.notes} onChange={event => setBrief(current => ({ ...current, notes: event.target.value }))} placeholder="Any other practical requirements" /></Field><button disabled={busy === 'brief'} className="rounded-lg bg-violet-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{busy === 'brief' ? 'Saving...' : 'Save investment brief'}</button></form></section>}
    {(view === 'fms' || view === 'wallet' || view === 'disputes' || view === 'reviews') && <ParticipantWorkspace user={props.currentUser} partnerships={collaborations} mode={view === 'disputes' ? 'disputes' : view === 'reviews' ? 'reviews' : view === 'wallet' ? 'wallet' : 'fms'} />}
  </section>;
}

function Metric({ label, value, note, alert = false }: { label: string; value: number; note: string; alert?: boolean }) { return <div className="border-l-4 border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${alert ? 'text-amber-700 dark:text-amber-400' : 'text-slate-950 dark:text-white'}`}>{value}</p><p className="mt-1 text-[11px] text-slate-500">{note}</p></div>; }
function Status({ value }: { value: string }) { const tone = value.includes('REJECTED') || value.includes('NOT_FIT') ? 'bg-rose-100 text-rose-800' : value.includes('ACTIVE') || value.includes('ACCEPTED') || value.includes('FIT') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${tone}`}>{value.replaceAll('_', ' ')}</span>; }
function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) { return <div className="px-4 py-7 text-center text-xs text-slate-500"><p>{text}</p>{action && onAction && <button type="button" onClick={onAction} className="mt-3 rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white">{action}</button>}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200"><span className="mb-1.5 block">{label}</span>{React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<{ className?: string }>, { className: 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-violet-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white' }) : children}</label>; }
function RecordList({ title, icon, records, empty }: { title: string; icon: React.ReactNode; records: Array<{ id: string; title: string; detail: string; at: string }>; empty: string }) { return <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-slate-800 dark:border-slate-800 dark:text-white">{icon}<h2 className="text-sm font-bold">{title}</h2></div>{records.length ? <ul className="divide-y divide-slate-100 dark:divide-slate-800">{records.map(record => <li key={record.id} className="px-4 py-3"><div className="flex justify-between gap-3"><p className="text-xs font-semibold text-slate-900 dark:text-white">{record.title}</p><time className="shrink-0 text-[11px] text-slate-500">{date(record.at)}</time></div><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{record.detail}</p></li>)}</ul> : <Empty text={empty} />}</section>; }
function ProposalList({ proposals, busy, onChange }: { proposals: FarmerProposal[]; busy: string | null; onChange: (id: string, status: Extract<FarmerProposal['status'], 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED'>) => Promise<void> }) { return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800"><h2 className="text-sm font-bold text-slate-900 dark:text-white">Pending proposals</h2><FileText className="h-4 w-4 text-violet-700" /></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{proposals.slice(0, 5).map(proposal => <article key={proposal.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">{proposal.title}</p><p className="mt-1 text-xs text-slate-500">{proposal.farmerName} · {proposal.sector} · {money(proposal.capitalRequestedKES)} requested</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{proposal.farmerContribution}</p></div><div className="flex items-center gap-2"><Status value={proposal.status} />{proposal.status === 'SUBMITTED' && <button disabled={busy === proposal.id} onClick={() => onChange(proposal.id, 'NEGOTIATING')} className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white">Review</button>}{proposal.status === 'NEGOTIATING' && <><button disabled={busy === proposal.id} onClick={() => onChange(proposal.id, 'ACCEPTED')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Accept</button><button disabled={busy === proposal.id} onClick={() => onChange(proposal.id, 'REJECTED')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Decline</button></>}</div></article>)}</div></section>; }
