import React, { useState } from 'react';
import { 
  User, LivestockPartnership, VeterinaryReport, FarmEvent, 
  FarmerProposal, InvestorCriteria, ProductionLog, UserRole
} from '../types';
import { 
  TrendingUp, FileText, Stethoscope, AlertTriangle, ShieldCheck, 
  DollarSign, CheckCircle2, MapPin, Briefcase, Filter, 
  Calendar, Award, ArrowUpRight, Clock, PlusCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';

interface InvestorDashboardProps {
  currentUser: User;
  usersList: User[];
  partnerships: LivestockPartnership[];
  veterinaryReports: VeterinaryReport[];
  proposals: FarmerProposal[];
  farmEvents: FarmEvent[];
  investorCriteriaList: InvestorCriteria[];
  onSaveCriteria: (criteria: Omit<InvestorCriteria, 'id' | 'createdAt'>) => void;
  onAcceptProposal?: (proposalId: string) => void;
}

export default function InvestorDashboard({
  currentUser,
  usersList,
  partnerships,
  veterinaryReports,
  proposals,
  farmEvents,
  investorCriteriaList,
  onSaveCriteria,
  onAcceptProposal
}: InvestorDashboardProps) {
  const [activeTab, setActiveTab] = useState<'criteria' | 'fms_tracking' | 'events_radar' | 'vet_reports' | 'proposals'>('criteria');

  // Criteria Form states
  const [lookingFor, setLookingFor] = useState<InvestorCriteria['lookingFor']>('FARMER_WITH_LAND_NEEDING_CAPITAL');
  const [budgetKES, setBudgetKES] = useState<number>(currentUser.investmentBudgetKES || 500000);
  const [selectedSectors, setSelectedSectors] = useState<string[]>(currentUser.preferredSectors || ['Dairy', 'Horticulture']);
  const [targetCounties, setTargetCounties] = useState<string[]>(['Kiambu', 'Nyandarua', 'Nakuru']);
  const [criteriaNotes, setCriteriaNotes] = useState<string>(currentUser.investmentGoal || 'Looking for experienced dairy farmer with at least 5 acres and water supply.');
  const [criteriaSuccessMsg, setCriteriaSuccessMsg] = useState('');

  // Proposals handling
  const [proposalFilter, setProposalFilter] = useState<'ALL' | 'Dairy' | 'Crops'>('ALL');
  const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);

  // Active partnerships for this investor
  const investorPartnerships = partnerships.filter(p => p.investorId === currentUser.id || currentUser.role === UserRole.INVESTOR);
  
  // FMS production aggregation
  const allProductionLogs: ProductionLog[] = investorPartnerships.flatMap(p => p.productionLogs).length > 0
    ? investorPartnerships.flatMap(p => p.productionLogs)
    : [
        { id: 'log_1', date: '2026-06-08', metric: 'Milk Liters', quantity: 24, revenueKES: 1392, investorPayoutKES: 556.8, farmerPayoutKES: 835.2 },
        { id: 'log_2', date: '2026-06-09', metric: 'Milk Liters', quantity: 26, revenueKES: 1508, investorPayoutKES: 603.2, farmerPayoutKES: 904.8 },
        { id: 'log_3', date: '2026-06-10', metric: 'Milk Liters', quantity: 23, revenueKES: 1334, investorPayoutKES: 533.6, farmerPayoutKES: 800.4 },
        { id: 'log_4', date: '2026-06-11', metric: 'Milk Liters', quantity: 25, revenueKES: 1450, investorPayoutKES: 580, farmerPayoutKES: 870 },
        { id: 'log_5', date: '2026-06-12', metric: 'Milk Liters', quantity: 28, revenueKES: 1624, investorPayoutKES: 649.6, farmerPayoutKES: 974.4 }
      ];

  const totalInvestorEarningsKES = allProductionLogs.reduce((acc, cur) => acc + cur.investorPayoutKES, 0);
  const totalVolumeProduced = allProductionLogs.reduce((acc, cur) => acc + cur.quantity, 0);
  const totalGrossRevenueKES = allProductionLogs.reduce((acc, cur) => acc + cur.revenueKES, 0);

  // Farmers and Proposals
  const filteredProposals = proposals.filter(p => {
    if (proposalFilter === 'ALL') return true;
    return p.sector === proposalFilter;
  });

  const handleSaveCriteriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCriteria({
      investorId: currentUser.id,
      investorName: currentUser.name,
      lookingFor,
      budgetKES,
      preferredSectors: selectedSectors,
      targetCounties,
      notes: criteriaNotes,
      status: 'ACTIVE'
    });
    setCriteriaSuccessMsg('Investment criteria saved and published to the ShambaLoop Matchmaking Engine.');
    setTimeout(() => setCriteriaSuccessMsg(''), 4000);
  };

  const toggleSector = (sec: string) => {
    if (selectedSectors.includes(sec)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sec));
    } else {
      setSelectedSectors([...selectedSectors, sec]);
    }
  };

  const handleAcceptProposal = (id: string) => {
    if (onAcceptProposal) {
      onAcceptProposal(id);
    }
    setAcceptedProposalId(id);
    setTimeout(() => setAcceptedProposalId(null), 4000);
  };

  return (
    <div className="space-y-6" id="investor_primary_dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-400/20 text-purple-300 border border-purple-400/30">
                Capital Partner Console
              </span>
              <span className="text-xs text-purple-200">
                • {currentUser.county} Region
              </span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white">
              {currentUser.name}'s Investment Portfolio
            </h1>
            <p className="text-xs text-purple-100/80 max-w-2xl font-sans">
              Deploy capital into audited smallholder farms, track daily FMS yield reports, monitor gestation/calving and climate alerts, and review certified veterinary audits.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-purple-200">Total Payouts</span>
              <strong className="text-lg font-black text-amber-300">KES {totalInvestorEarningsKES.toLocaleString()}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-purple-200">Total Yield</span>
              <strong className="text-lg font-black">{totalVolumeProduced} L</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-purple-200">Active Herds</span>
              <strong className="text-lg font-black">{investorPartnerships.length || 1}</strong>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'criteria', label: '1. What I Am Looking For (Criteria)', icon: Briefcase },
            { id: 'fms_tracking', label: '2. FMS Reports & Yield Payouts', icon: TrendingUp },
            { id: 'events_radar', label: '3. Farm Events & Birth/Drought Radar', icon: AlertTriangle },
            { id: 'vet_reports', label: '4. Veterinary Health Audits', icon: Stethoscope },
            { id: 'proposals', label: '5. Farmer Proposals & Pitches', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: WHAT I AM LOOKING FOR (CRITERIA LISTING) */}
      {activeTab === 'criteria' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold font-display uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Define Your Ideal Agricultural Partner
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
              List the partnership model, capital budget, and preferred sectors you are ready to finance. Farmers and district registry admins will use this to match ventures with you.
            </p>
          </div>

          <form onSubmit={handleSaveCriteriaSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                Primary Partnership Structure
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'FARMER_WITH_LAND_NEEDING_CAPITAL',
                    title: 'Farmer With Land Needing Capital',
                    desc: 'Partner who has fertile arable farm and experience, seeking finance for dairy cows, seeds, irrigation, or inputs.'
                  },
                  {
                    id: 'FARM_MANAGER_EXPERTISE',
                    title: 'Farm Manager Expertise',
                    desc: 'You own or lease the shamba, seeking an experienced professional farm manager on profit-sharing or salary.'
                  },
                  {
                    id: 'LAND_FOR_LEASE_PROJECT',
                    title: 'Land for Long-Term Lease Project',
                    desc: 'You have capital and seek to lease registered shamba for commercial horticulture, cereal, or livestock ventures.'
                  }
                ].map(opt => (
                  <div
                    key={opt.id}
                    onClick={() => setLookingFor(opt.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      lookingFor === opt.id
                        ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <strong className="text-xs text-slate-900 dark:text-white">{opt.title}</strong>
                        {lookingFor === opt.id && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Allocated Investment Capital (KES)
                  </label>
                  <input
                    type="number"
                    step="10000"
                    required
                    value={budgetKES}
                    onChange={(e) => setBudgetKES(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                  <p className="text-[10px] text-slate-400">Funds escrowed safely via simulated M-Pesa or SACCO Bank Wire.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Preferred Agricultural Sectors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Dairy', 'Maize & Cereals', 'Horticulture', 'Poultry', 'Dairy Goats', 'Avocado', 'Macadamia'].map(sec => (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => toggleSector(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                          selectedSectors.includes(sec)
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {selectedSectors.includes(sec) ? `✓ ${sec}` : `+ ${sec}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Investment Criteria Notes & Conditions
                  </label>
                  <textarea
                    rows={4}
                    value={criteriaNotes}
                    onChange={(e) => setCriteriaNotes(e.target.value)}
                    placeholder="e.g. Must have verified title deeds, perimeter electric fencing, and willing to work with ShambaLoop certified vets."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Publish & Broadcast Criteria to Farmers
                </button>

                {criteriaSuccessMsg && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    {criteriaSuccessMsg}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: FMS REPORTS & YIELD PAYOUTS */}
      {activeTab === 'fms_tracking' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Total Investor Earnings</span>
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
                KES {totalInvestorEarningsKES.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">40% automated revenue partition</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Partner Farmer Output</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {totalVolumeProduced} <span className="text-xs font-normal text-slate-500">Liters</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ Logged through Farmer FMS</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Gross Market Value</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                KES {totalGrossRevenueKES.toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Fixed Kenya Dairy Board Index</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Active Agreements</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {investorPartnerships.length || 1} <span className="text-xs font-normal text-slate-500">Farms</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Bound in M-Pesa Escrow Contracts</p>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Farm Management System (FMS) Yield & Payout Stream
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synchronized live from the farmer's daily production console.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                Verified Ledger
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allProductionLogs}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="investorPayoutKES" name="Investor Payout (KES)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="farmerPayoutKES" name="Farmer Payout (KES)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table of production logs */}
            <div className="overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Yield Quantity</th>
                    <th className="pb-2">Market Gross</th>
                    <th className="pb-2">Investor Payout (40%)</th>
                    <th className="pb-2">Farmer Payout (60%)</th>
                    <th className="pb-2 text-right">Escrow Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {allProductionLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">{log.date}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{log.quantity} {log.metric}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">KES {log.revenueKES.toLocaleString()}</td>
                      <td className="py-2.5 font-bold text-purple-600 dark:text-purple-400">KES {log.investorPayoutKES.toLocaleString()}</td>
                      <td className="py-2.5 font-semibold text-emerald-600 dark:text-emerald-400">KES {log.farmerPayoutKES.toLocaleString()}</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          Disbursed OK
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEY FARM EVENTS & BIRTH / DROUGHT RADAR */}
      {activeTab === 'events_radar' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Key Life Events & Climate Risk Radar
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Proactive notifications when animals are near calving/parturition, drought alerts hit, or yield risks emerge.
                </p>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                Real-Time Feeds
              </span>
            </div>

            {farmEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {farmEvents.map(evt => (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          evt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                          evt.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {evt.severity}
                        </span>
                        <strong className="text-xs text-slate-900 dark:text-white">{evt.title}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{evt.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="space-y-1 text-xs">
                      {evt.actionTaken && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                          <strong>Farmer Action:</strong> {evt.actionTaken}
                        </div>
                      )}
                      {evt.impactOnProduce && (
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300">
                          <strong>Produce Impact:</strong> {evt.impactOnProduce}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span>Reported By: {evt.reportedBy}</span>
                      <span>Farm: {evt.farmerName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-1">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No critical events or climate hazards recorded</p>
                <p className="text-[11px]">Your funded farms have zero pending pest alerts or drought emergencies.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: VETERINARY HEALTH AUDITS */}
      {activeTab === 'vet_reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-600" />
                  Certified Veterinary Health Audits ({veterinaryReports.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Official clinical visits and life-event evaluations submitted by certified veterinarians.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                KVB Accredited
              </span>
            </div>

            {veterinaryReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veterinaryReports.map(rep => (
                  <article
                    key={rep.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white">{rep.animalTagId} • {rep.visitType}</strong>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Officer: {rep.veterinarianName} • {new Date(rep.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        rep.status === 'FIT_FOR_PRODUCTION' ? 'bg-emerald-100 text-emerald-800' :
                        rep.status === 'TREATMENT_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {rep.status.replaceAll('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">Findings:</strong> {rep.findings}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-900 dark:text-white">Recommendations:</strong> {rep.recommendations}
                      </p>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Animal ID: {rep.animalTagId}</span>
                      <span className="text-emerald-600 font-bold">✓ Fitness Certified</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No veterinary reports available yet</p>
                <p className="text-[11px]">When certified veterinarians conduct visits on your funded herds, reports will stream here directly.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FARMER PROPOSALS & PITCHES */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Incoming Farmer Proposals ({filteredProposals.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Proposals submitted by experienced farmers seeking partnership investment.
                </p>
              </div>

              {/* Sector Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Sector:</span>
                {['ALL', 'Dairy', 'Crops'].map(f => (
                  <button
                    key={f}
                    onClick={() => setProposalFilter(f as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                      proposalFilter === f
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredProposals.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredProposals.map(prop => (
                  <div
                    key={prop.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm text-slate-900 dark:text-white block">{prop.title}</strong>
                          <p className="text-[11px] text-slate-500">
                            By Farmer: {prop.farmerName} ({prop.farmerPhone}) • Sector: {prop.sector}
                          </p>
                        </div>
                        <span className="text-xs font-black text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl">
                          KES {prop.capitalRequestedKES.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {prop.farmDescription}
                      </p>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 text-xs font-sans">
                        <p>
                          <strong className="text-slate-900 dark:text-white">Farmer Contribution:</strong> {prop.farmerContribution}
                        </p>
                        <p>
                          <strong className="text-slate-900 dark:text-white">Equity / Revenue Split:</strong>{' '}
                          <span className="text-emerald-600 font-bold">{prop.farmerSharePercent}% Farmer</span> /{' '}
                          <span className="text-purple-600 font-bold">{prop.investorSharePercent}% Investor</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptProposal(prop.id)}
                        className="flex-1 bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                      >
                        {acceptedProposalId === prop.id ? '✓ Partnership Initiated!' : 'Accept & Fund via Escrow'}
                      </button>
                      <a
                        href={`tel:${prop.farmerPhone}`}
                        className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                      >
                        Call Farmer
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No proposals matching this filter</p>
                <p className="text-[11px]">Farmers draft proposals according to your published criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
