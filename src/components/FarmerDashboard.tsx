import React, { useState } from 'react';
import { 
  User, LivestockPartnership, VeterinaryReport, FarmEvent, 
  FarmerProposal, VeterinaryJob, ProductionLog, UserRole
} from '../types';
import { 
  TrendingUp, FileText, Stethoscope, PlusCircle, CheckCircle, 
  AlertTriangle, Calendar, ShieldCheck, DollarSign, Sprout, 
  Clock, MapPin, Send, Eye, RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, Legend 
} from 'recharts';

interface FarmerDashboardProps {
  currentUser: User;
  usersList: User[];
  partnerships: LivestockPartnership[];
  veterinaryReports: VeterinaryReport[];
  proposals: FarmerProposal[];
  farmEvents: FarmEvent[];
  vetJobs: VeterinaryJob[];
  onCreateProposal: (proposal: Omit<FarmerProposal, 'id' | 'createdAt'>) => void;
  onRequestVetJob: (job: Omit<VeterinaryJob, 'id' | 'requestedDate'>) => void;
  onLogProduction: (partnershipId: string, quantity: number, metric: string) => void;
  onLogFarmEvent: (event: Omit<FarmEvent, 'id' | 'date'>) => void;
  onUpdateSelfListing?: (data: { farmSpecialties: string[]; seekingLandAcreage: number }) => void;
}

export default function FarmerDashboard({
  currentUser,
  usersList,
  partnerships,
  veterinaryReports,
  proposals,
  farmEvents,
  vetJobs,
  onCreateProposal,
  onRequestVetJob,
  onLogProduction,
  onLogFarmEvent,
  onUpdateSelfListing
}: FarmerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'fms' | 'proposals' | 'self_listing' | 'vet_network'>('fms');

  // FMS Form states
  const [selectedPartnershipId, setSelectedPartnershipId] = useState<string>(partnerships[0]?.id || 'part_xyz');
  const [yieldQuantity, setYieldQuantity] = useState<number>(22);
  const [yieldMetric, setYieldMetric] = useState<'Milk Liters' | 'Egg Trays' | 'Maize Bags (90kg)' | 'Horticulture Crates'>('Milk Liters');
  const [yieldSuccessMsg, setYieldSuccessMsg] = useState<string>('');

  // Event Log Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<FarmEvent['eventType']>('CALVING_DUE');
  const [eventSeverity, setEventSeverity] = useState<FarmEvent['severity']>('MEDIUM');
  const [eventDescription, setEventDescription] = useState('');
  const [eventAction, setEventAction] = useState('');
  const [eventProduceImpact, setEventProduceImpact] = useState('');
  const [eventSuccessMsg, setEventSuccessMsg] = useState('');

  // Proposal Form states
  const [proposalTitle, setProposalTitle] = useState('');
  const [targetInvestorId, setTargetInvestorId] = useState<string>('');
  const [proposalSector, setProposalSector] = useState<FarmerProposal['sector']>('Dairy');
  const [proposalCapital, setProposalCapital] = useState<number>(250000);
  const [proposalContribution, setProposalContribution] = useState('5 acres fenced land, permanent borehole water, 2 trained herdsmen');
  const [proposalDescription, setProposalDescription] = useState('');
  const [investorSplit, setInvestorSplit] = useState<number>(40);
  const [proposalStatus, setProposalStatus] = useState<'DRAFT' | 'SUBMITTED'>('SUBMITTED');
  const [proposalMsg, setProposalMsg] = useState('');

  // Vet Booking Form
  const [vetServiceType, setVetServiceType] = useState<VeterinaryJob['serviceType']>('CLINICAL_CHECK');
  const [vetAnimalType, setVetAnimalType] = useState('Dairy Friesian Heifers');
  const [vetUrgency, setVetUrgency] = useState<VeterinaryJob['urgency']>('NORMAL');
  const [vetLocation, setVetLocation] = useState(`${currentUser.county} Farmstead`);
  const [vetNotes, setVetNotes] = useState('');
  const [selectedVetId, setSelectedVetId] = useState<string>('');
  const [vetSuccessMsg, setVetSuccessMsg] = useState('');

  // Self Listing form states
  const [selfSpecialties, setSelfSpecialties] = useState<string>(currentUser.farmSpecialties?.join(', ') || 'Dairy Breeding, Fodder Production');
  const [selfAcreage, setSelfAcreage] = useState<number>(currentUser.seekingLandAcreage || 10);
  const [selfListingSaved, setSelfListingSaved] = useState(false);

  // Filtered data for this farmer
  const farmerPartnerships = partnerships.filter(p => p.farmerId === currentUser.id || currentUser.role === UserRole.FARMER);
  const farmerProposals = proposals.filter(p => p.farmerId === currentUser.id);
  const farmerEvents = farmEvents.filter(e => e.farmerName.toLowerCase().includes(currentUser.name.toLowerCase()) || e.farmerName.toLowerCase().includes('farmer'));
  const farmerVetReports = veterinaryReports.filter(r => r.farmerId === currentUser.id || true);
  const registeredInvestors = usersList.filter(u => u.role === UserRole.INVESTOR);
  const registeredVets = usersList.filter(u => u.role === UserRole.VETERINARIAN);

  // Active partnership
  const activePartnership = farmerPartnerships.find(p => p.id === selectedPartnershipId) || farmerPartnerships[0];

  // Calculate production logs
  const allProductionLogs: ProductionLog[] = activePartnership?.productionLogs || [
    { id: 'log_1', date: '2026-06-08', metric: 'Milk Liters', quantity: 24, revenueKES: 1392, investorPayoutKES: 556.8, farmerPayoutKES: 835.2 },
    { id: 'log_2', date: '2026-06-09', metric: 'Milk Liters', quantity: 26, revenueKES: 1508, investorPayoutKES: 603.2, farmerPayoutKES: 904.8 },
    { id: 'log_3', date: '2026-06-10', metric: 'Milk Liters', quantity: 23, revenueKES: 1334, investorPayoutKES: 533.6, farmerPayoutKES: 800.4 },
    { id: 'log_4', date: '2026-06-11', metric: 'Milk Liters', quantity: 25, revenueKES: 1450, investorPayoutKES: 580, farmerPayoutKES: 870 },
    { id: 'log_5', date: '2026-06-12', metric: 'Milk Liters', quantity: 28, revenueKES: 1624, investorPayoutKES: 649.6, farmerPayoutKES: 974.4 }
  ];

  const totalYield = allProductionLogs.reduce((acc, cur) => acc + cur.quantity, 0);
  const totalRevenueKES = allProductionLogs.reduce((acc, cur) => acc + cur.revenueKES, 0);
  const totalFarmerShareKES = allProductionLogs.reduce((acc, cur) => acc + cur.farmerPayoutKES, 0);

  const handleYieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnershipId || yieldQuantity <= 0) return;
    onLogProduction(selectedPartnershipId, yieldQuantity, yieldMetric);
    setYieldSuccessMsg(`Successfully recorded ${yieldQuantity} ${yieldMetric}. Shared instantly with Investor & Admin ledger.`);
    setTimeout(() => setYieldSuccessMsg(''), 4000);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDescription.trim()) return;
    onLogFarmEvent({
      farmId: activePartnership?.id || 'farm_primary',
      farmerName: currentUser.name,
      eventType,
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      severity: eventSeverity,
      actionTaken: eventAction.trim(),
      impactOnProduce: eventProduceImpact.trim() || 'No direct yield loss expected',
      reportedBy: `${currentUser.name} (Farm Manager)`
    });
    setEventSuccessMsg('Farm event and critical alert logged. Broadcasted to Investor and District Admin.');
    setEventTitle('');
    setEventDescription('');
    setEventAction('');
    setEventProduceImpact('');
    setTimeout(() => setEventSuccessMsg(''), 4000);
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalTitle.trim() || !proposalDescription.trim() || proposalCapital <= 0) return;
    const chosenInvestor = registeredInvestors.find(i => i.id === targetInvestorId);
    onCreateProposal({
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmerPhone: currentUser.phone,
      investorId: chosenInvestor?.id,
      investorName: chosenInvestor?.name,
      title: proposalTitle.trim(),
      sector: proposalSector,
      farmDescription: proposalDescription.trim(),
      capitalRequestedKES: proposalCapital,
      farmerContribution: proposalContribution.trim(),
      investorSharePercent: investorSplit,
      farmerSharePercent: 100 - investorSplit,
      status: proposalStatus
    });
    setProposalMsg(proposalStatus === 'DRAFT' ? 'Proposal draft safely saved to your workspace.' : 'Proposal submitted to Investor! Awaiting review.');
    setProposalTitle('');
    setProposalDescription('');
    setTimeout(() => setProposalMsg(''), 4000);
  };

  const handleVetBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedVet = registeredVets.find(v => v.id === selectedVetId);
    onRequestVetJob({
      farmId: activePartnership?.id || 'farm_1',
      farmerName: currentUser.name,
      farmerPhone: currentUser.phone,
      location: vetLocation,
      animalOrCropType: vetAnimalType,
      serviceType: vetServiceType,
      urgency: vetUrgency,
      status: assignedVet ? 'ASSIGNED' : 'OPEN',
      assignedVetId: assignedVet?.id,
      assignedVetName: assignedVet?.name,
      notes: vetNotes
    });
    setVetSuccessMsg('Veterinary service request registered! Field officers and veterinarians notified.');
    setVetNotes('');
    setTimeout(() => setVetSuccessMsg(''), 4000);
  };

  const handleSaveSelfListing = (e: React.FormEvent) => {
    e.preventDefault();
    const specs = selfSpecialties.split(',').map(s => s.trim()).filter(Boolean);
    if (onUpdateSelfListing) {
      onUpdateSelfListing({ farmSpecialties: specs, seekingLandAcreage: selfAcreage });
    }
    setSelfListingSaved(true);
    setTimeout(() => setSelfListingSaved(false), 3000);
  };

  return (
    <div className="space-y-6" id="farmer_primary_dashboard">
      {/* Dashboard Top Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 rounded-3xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Farmer Operating System
              </span>
              <span className="text-xs text-emerald-200">
                • {currentUser.county} County Agricultural Hub
              </span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white">
              {currentUser.name}'s Farm Control Center
            </h1>
            <p className="text-xs text-emerald-100/80 max-w-2xl font-sans">
              Connect with capital investors, file partnership proposals, dispatch veterinary care, and manage daily dairy and crop operations with transparent yield sharing.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Active Herds</span>
              <strong className="text-lg font-black">{farmerPartnerships.length || 1}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Total Yield</span>
              <strong className="text-lg font-black">{totalYield} L</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-emerald-200">Farmer Payout</span>
              <strong className="text-lg font-black text-amber-300">KES {totalFarmerShareKES.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'fms', label: '1. Farm Management System (FMS)', icon: TrendingUp },
            { id: 'proposals', label: '2. Investor Proposals & Pitches', icon: FileText },
            { id: 'self_listing', label: '3. What I Bring & What I Seek', icon: Sprout },
            { id: 'vet_network', label: '4. Veterinary Support & Reports', icon: Stethoscope },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-950 shadow-sm'
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

      {/* TAB 1: FARM MANAGEMENT SYSTEM (FMS) */}
      {activeTab === 'fms' && (
        <div className="space-y-6">
          {/* Top FMS KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Production Volume</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalYield} <span className="text-xs font-normal text-slate-500">Liters</span></p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ Audited against KDB national rate</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Total Gross Output</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">KES {totalRevenueKES.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Simulated at KES 58 / Liter</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Farmer Share (60%)</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">KES {totalFarmerShareKES.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Immediate M-Pesa sandbox settlement</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Investor Share (40%)</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">KES {(totalRevenueKES - totalFarmerShareKES).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Visible on Investor & Admin dashboards</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Production Logging Form */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Log Daily Farm Yield
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Records synchronize transparently to your investor and district supervisor.
                </p>
              </div>

              <form onSubmit={handleYieldSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Asset / Herd Tag</label>
                  <select
                    value={selectedPartnershipId}
                    onChange={(e) => setSelectedPartnershipId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    {farmerPartnerships.length > 0 ? (
                      farmerPartnerships.map(p => (
                        <option key={p.id} value={p.id}>{p.animalTagId} - {p.breed} ({p.animalType})</option>
                      ))
                    ) : (
                      <option value="part_xyz">SL-KE-FR-901 - Friesian Heifer (Dairy)</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Yield Metric</label>
                    <select
                      value={yieldMetric}
                      onChange={(e: any) => setYieldMetric(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="Milk Liters">Milk Liters</option>
                      <option value="Egg Trays">Egg Trays</option>
                      <option value="Maize Bags (90kg)">Maize Bags</option>
                      <option value="Horticulture Crates">Horticulture Crates</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quantity</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      required
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px] text-slate-600 dark:text-slate-300 font-sans border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span>Simulated Gross Revenue:</span>
                    <strong className="text-slate-900 dark:text-white">KES {(yieldQuantity * 58).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Farmer Payout (60%):</span>
                    <strong>KES {(yieldQuantity * 58 * 0.6).toFixed(1)}</strong>
                  </div>
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>Investor Payout (40%):</span>
                    <strong>KES {(yieldQuantity * 58 * 0.4).toFixed(1)}</strong>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Commit Yield Record
                </button>

                {yieldSuccessMsg && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold animate-pulse border border-emerald-200">
                    {yieldSuccessMsg}
                  </p>
                )}
              </form>
            </div>

            {/* Right: Production Trend Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Yield Production Velocity & Payout Distribution
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Real-time milk liters and investor-farmer split telemetry.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live Feed
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={allProductionLogs}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line yAxisId="left" type="monotone" dataKey="quantity" name="Yield (Units)" stroke="#059669" strokeWidth={2} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="farmerPayoutKES" name="Farmer Payout (KES)" stroke="#10b981" strokeWidth={1.5} />
                    <Line yAxisId="right" type="monotone" dataKey="investorPayoutKES" name="Investor Payout (KES)" stroke="#8b5cf6" strokeWidth={1.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
                {allProductionLogs.slice(-4).map((log, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block">{log.date}</span>
                    <strong className="text-slate-800 dark:text-slate-100">{log.quantity} L</strong>
                    <span className="text-[9px] text-emerald-600 block">KES {log.farmerPayoutKES}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Farm Events & Critical Alerts Logger */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Key Farm Events & Climate Risk Radar
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Report calving due dates, drought advisories, pest outbreaks, or produce anomalies.
                </p>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Visible to Investors & Admin
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Logging form */}
              <form onSubmit={handleEventSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Event Category</label>
                  <select
                    value={eventType}
                    onChange={(e: any) => setEventType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="CALVING_DUE">Calving Due / Animal Birth Expected</option>
                    <option value="DROUGHT_ALERT">Drought Advisory / Water Rationing</option>
                    <option value="PEST_ALERT">Pest Infestation / Fall Armyworm</option>
                    <option value="VACCINATION_DUE">Vaccination Due Window</option>
                    <option value="HARVEST_WINDOW">Peak Harvest Ready</option>
                    <option value="DISEASE_OUTBREAK">Disease Outbreak / Mastitis</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity Level</label>
                    <select
                      value={eventSeverity}
                      onChange={(e: any) => setEventSeverity(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="LOW">Low (Informational)</option>
                      <option value="MEDIUM">Medium (Watchlist)</option>
                      <option value="HIGH">High (Action Required)</option>
                      <option value="CRITICAL">Critical (Immediate Hazard)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Heifer SL-901 in 3rd trimester"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Details about symptoms, veterinarian notes, or weather forecasts..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Mitigation Action Taken</label>
                  <input
                    type="text"
                    placeholder="e.g. Supplementary silage & hay purchased; vet scheduled"
                    value={eventAction}
                    onChange={(e) => setEventAction(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Anticipated Impact on Produce</label>
                  <input
                    type="text"
                    placeholder="e.g. Expecting 25% yield surge upon calving next month"
                    value={eventProduceImpact}
                    onChange={(e) => setEventProduceImpact(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Broadcast Event Alert
                </button>

                {eventSuccessMsg && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    {eventSuccessMsg}
                  </p>
                )}
              </form>

              {/* Event Timeline */}
              <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {farmerEvents.length > 0 ? (
                  farmerEvents.map(evt => (
                    <div
                      key={evt.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
                    >
                      <div className="flex items-center justify-between">
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
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{evt.description}</p>
                      {evt.actionTaken && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                          <strong>Action Taken:</strong> {evt.actionTaken}
                        </p>
                      )}
                      {evt.impactOnProduce && (
                        <p className="text-[10px] text-slate-500">
                          <strong>Produce Impact:</strong> {evt.impactOnProduce}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No active alerts recorded yet</p>
                    <p className="text-[11px]">Log when livestock is in gestation or drought conditions emerge.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVESTOR PROPOSALS & PITCHES */}
      {activeTab === 'proposals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Create / Draft Proposal Form */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Draft or Submit Investor Proposal
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Package your land, water, and expertise into an investment proposal.
                </p>
              </div>

              <form onSubmit={handleProposalSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Investor</label>
                  <select
                    value={targetInvestorId}
                    onChange={(e) => setTargetInvestorId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">Broadcast to All Verified Investors</option>
                    {registeredInvestors.map(inv => (
                      <option key={inv.id} value={inv.id}>{inv.name} ({inv.county} - Budget KES {inv.investmentBudgetKES?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proposal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5-Heifer Pedigree Friesian Dairy Expansion"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agricultural Sector</label>
                    <select
                      value={proposalSector}
                      onChange={(e: any) => setProposalSector(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="Dairy">Dairy Bovine</option>
                      <option value="Crops">Cereal / Maize</option>
                      <option value="Horticulture">Horticulture</option>
                      <option value="Poultry">Poultry Layers</option>
                      <option value="Goats">Dairy Goats</option>
                      <option value="Mixed">Mixed Farming</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capital Needed (KES)</label>
                    <input
                      type="number"
                      step="5000"
                      required
                      value={proposalCapital}
                      onChange={(e) => setProposalCapital(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">What I Bring (Farmer Contribution)</label>
                  <input
                    type="text"
                    required
                    value={proposalContribution}
                    onChange={(e) => setProposalContribution(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    placeholder="e.g. 5 acres arable land, solar borehole, daily labor"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed Farm Plan</label>
                  <textarea
                    rows={3}
                    required
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    placeholder="Explain feeding regimen, veterinary check schedule, and projected yield..."
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Proposed Profit Split:</span>
                    <span>{100 - investorSplit}% Farmer / {investorSplit}% Investor</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    step="5"
                    value={investorSplit}
                    onChange={(e) => setInvestorSplit(parseInt(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    onClick={() => setProposalStatus('DRAFT')}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    onClick={() => setProposalStatus('SUBMITTED')}
                    className="flex-1 bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Send to Investor
                  </button>
                </div>

                {proposalMsg && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    {proposalMsg}
                  </p>
                )}
              </form>
            </div>

            {/* Right: Proposals Showcase & Lookbook */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  My Active Proposals & Pitch Decks ({farmerProposals.length})
                </h3>
                <span className="text-[10px] text-slate-400">Escrow-backed partnerships</span>
              </div>

              {farmerProposals.length > 0 ? (
                <div className="space-y-3">
                  {farmerProposals.map(prop => (
                    <div
                      key={prop.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-slate-900 dark:text-white">{prop.title}</strong>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              prop.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                              prop.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {prop.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Sector: {prop.sector} • Target Investor: {prop.investorName || 'Open Public Pitch'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block font-mono">Capital Requested</span>
                          <strong className="text-sm font-black text-slate-900 dark:text-white">KES {prop.capitalRequestedKES.toLocaleString()}</strong>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {prop.farmDescription}
                      </p>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Farmer Brings:</span>
                          <p className="text-slate-700 dark:text-slate-200 font-semibold">{prop.farmerContribution}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Profit Split:</span>
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold">{prop.farmerSharePercent}% Farmer / {prop.investorSharePercent}% Investor</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 border border-dashed rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No proposals drafted yet</p>
                  <p className="text-[11px]">Use the draft form on the left to package your farm and connect with investors.</p>
                </div>
              )}

              {/* Verified Investors Waiting For Partners */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Capital Investors Seeking Partners ({registeredInvestors.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {registeredInvestors.map(inv => (
                    <div key={inv.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs text-slate-900 dark:text-white">{inv.name}</strong>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 uppercase font-bold">KES {inv.investmentBudgetKES?.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Location: {inv.county} County • Focus: {inv.preferredSectors?.join(', ') || 'Livestock, Dairy'}</p>
                      <button
                        onClick={() => {
                          setTargetInvestorId(inv.id);
                          setProposalTitle(`Partnership Proposal for ${inv.name}`);
                          setActiveTab('proposals');
                        }}
                        className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                      >
                        Pitch This Investor →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WHAT I BRING & WHAT I SEEK (SELF LISTING) */}
      {activeTab === 'self_listing' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold font-display uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              Farmer Profile: What I Bring vs. What I Seek
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
              Define your physical assets and requirements so investors and landowners can easily discover and match with you on the ShambaLoop network.
            </p>
          </div>

          <form onSubmit={handleSaveSelfListing} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/40 dark:bg-emerald-950/20">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                Asset & Expertise Profile
              </span>
              <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">What I Am Bringing on Board</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Crops, Livestock, and Specializations
                </label>
                <input
                  type="text"
                  required
                  value={selfSpecialties}
                  onChange={(e) => setSelfSpecialties(e.target.value)}
                  placeholder="e.g. Dairy Breeding, Hydroponic Fodder, Napier Grass, 8 Yrs Experience"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Physical Land Acreage Available / Operating
                </label>
                <input
                  type="number"
                  required
                  value={selfAcreage}
                  onChange={(e) => setSelfAcreage(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tip: Investors prioritize farmers with secure perimeter fencing, dependable water reservoirs, and verified animal health records.
              </p>
            </div>

            <div className="space-y-4 p-5 rounded-2xl border border-purple-100 dark:border-purple-950 bg-purple-50/40 dark:bg-purple-950/20">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                Capital & Input Requirements
              </span>
              <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200">What I Need From An Investor</h4>
              
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>Pedigree Milking Heifers (In-calf Friesian / Ayrshire)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>Solar Borehole & Drip Irrigation Equipment</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>Certified Hybrid Seeds & Silage Preparation Machinery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  <span>Veterinary Care & Monthly Clinical Retainer</span>
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Update & Publish Farmer Listing
                </button>
                {selfListingSaved && (
                  <p className="mt-2 text-xs text-emerald-600 font-bold text-center">
                    Listing successfully published to the ShambaLoop registry!
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: VETERINARY NETWORK & REPORTS */}
      {activeTab === 'vet_network' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Book Veterinary Visit Form */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                  Request Veterinary Service
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Book certified Kenya Veterinary Board specialists for routine checkups or emergency care.
                </p>
              </div>

              <form onSubmit={handleVetBookingSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Veterinarian</label>
                  <select
                    value={selectedVetId}
                    onChange={(e) => setSelectedVetId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="">Nearest Available Veterinary Officer</option>
                    {registeredVets.map(vet => (
                      <option key={vet.id} value={vet.id}>{vet.name} ({vet.county} - Certified)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Service Category</label>
                  <select
                    value={vetServiceType}
                    onChange={(e: any) => setVetServiceType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="CLINICAL_CHECK">Clinical Examination / General Checkup</option>
                    <option value="VACCINATION">Vaccination Drive (FMD / Anthrax / ECF)</option>
                    <option value="PREGNANCY_SCAN">Ultrasound & Pregnancy Diagnosis</option>
                    <option value="NUTRITIONAL_AUDIT">Nutritional & Mineral Audit</option>
                    <option value="EMERGENCY_SURGERY">Emergency Care / Dystocia / Calving</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Animal Tag / Batch</label>
                    <input
                      type="text"
                      required
                      value={vetAnimalType}
                      onChange={(e) => setVetAnimalType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urgency</label>
                    <select
                      value={vetUrgency}
                      onChange={(e: any) => setVetUrgency(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="NORMAL">Normal (Within 48 hrs)</option>
                      <option value="URGENT">Urgent (Within 12 hrs)</option>
                      <option value="EMERGENCY">Emergency (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Farmstead Location</label>
                  <input
                    type="text"
                    required
                    value={vetLocation}
                    onChange={(e) => setVetLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Observations / Symptoms</label>
                  <textarea
                    rows={2}
                    value={vetNotes}
                    onChange={(e) => setVetNotes(e.target.value)}
                    placeholder="Describe appetite, temperature, milk drop, or injury..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Dispatch Veterinary Request
                </button>

                {vetSuccessMsg && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    {vetSuccessMsg}
                  </p>
                )}
              </form>
            </div>

            {/* Right: Published Veterinary Reports Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Published Veterinary Clinical Reports ({farmerVetReports.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immutable health audits shared with your investor and ShambaLoop district supervisor.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  Certified Records
                </span>
              </div>

              {farmerVetReports.length > 0 ? (
                <div className="space-y-3">
                  {farmerVetReports.map(rep => (
                    <article
                      key={rep.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-xs text-slate-900 dark:text-white">{rep.animalTagId} • {rep.visitType}</strong>
                          <p className="text-[10px] text-slate-500 font-mono">By {rep.veterinarianName} • {new Date(rep.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          rep.status === 'FIT_FOR_PRODUCTION' ? 'bg-emerald-100 text-emerald-800' :
                          rep.status === 'TREATMENT_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {rep.status.replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1 text-xs">
                        <p className="text-slate-700 dark:text-slate-200">
                          <strong className="text-slate-900 dark:text-white">Clinical Findings:</strong> {rep.findings}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200">
                          <strong className="text-slate-900 dark:text-white">Prescribed Recommendations:</strong> {rep.recommendations}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 border border-dashed rounded-2xl">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No veterinary reports filed yet</p>
                  <p className="text-[11px]">Request an inspection using the booking form to receive official health certification.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
