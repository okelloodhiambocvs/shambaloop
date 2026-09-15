import React, { useState } from 'react';
import { LivestockPartnership, User, UserRole, VeterinaryReport, VeterinaryJob, FarmEvent } from '../types';
import { 
  Stethoscope, CheckCircle2, Clock, AlertTriangle, FileText, 
  MapPin, Calendar, Activity, ShieldCheck, Heart, UserCheck, 
  Send, Plus, ChevronRight, Phone
} from 'lucide-react';

interface VeterinaryDashboardProps {
  currentUser: User;
  partnerships: LivestockPartnership[];
  usersList: User[];
  reports: VeterinaryReport[];
  vetJobs?: VeterinaryJob[];
  onSaveReport: (report: VeterinaryReport) => void;
  onUpdateJobStatus?: (jobId: string, newStatus: VeterinaryJob['status']) => void;
  onLogLifeEvent?: (event: Omit<FarmEvent, 'id' | 'date'>) => void;
}

export default function VeterinaryDashboard({
  currentUser,
  partnerships,
  usersList,
  reports,
  vetJobs = [],
  onSaveReport,
  onUpdateJobStatus,
  onLogLifeEvent
}: VeterinaryDashboardProps) {
  const [activeTab, setActiveTab] = useState<'jobs' | 'publish_report' | 'all_reports' | 'everyday_life'>('jobs');
  const [selectedPartnershipId, setSelectedPartnershipId] = useState(partnerships[0]?.id || '');
  const [visitType, setVisitType] = useState('Routine health inspection');
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [status, setStatus] = useState<VeterinaryReport['status']>('FIT_FOR_PRODUCTION');
  
  // Vital metrics
  const [bodyTemp, setBodyTemp] = useState('38.5');
  const [bodyConditionScore, setBodyConditionScore] = useState('3.5');
  const [rumenMotility, setRumenMotility] = useState('Normal (2-3 / 2 mins)');
  const [vaccineBatch, setVaccineBatch] = useState('KE-VAC-2026-FMD-09');
  const [pregnancyState, setPregnancyState] = useState<'NON_PREGNANT' | 'CONFIRMED_PREGNANT_1ST_TRIMESTER' | 'CONFIRMED_PREGNANT_2ND_TRIMESTER' | 'CALVING_WINDOW_DUE'>('NON_PREGNANT');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const selectedPartnership = partnerships.find(p => p.id === selectedPartnershipId) || partnerships[0];
  const farmer = usersList.find(u => u.id === selectedPartnership?.farmerId);
  const investor = usersList.find(u => u.id === selectedPartnership?.investorId);
  const openJobs = partnerships.filter(p => p.status === 'ACTIVE');

  // Filter jobs for this vet or unassigned
  const myAssignedJobs = vetJobs.filter(j => j.assignedVetId === currentUser.id || j.status === 'OPEN');

  const submitReport = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPartnership || !findings.trim() || !recommendations.trim()) return;

    const fullFindings = `[Vitals: Temp ${bodyTemp}°C, BCS ${bodyConditionScore}/5, Rumen: ${rumenMotility}, Pregnancy: ${pregnancyState}] ${findings.trim()} ${vaccineBatch ? `(Vaccine/Med Batch: ${vaccineBatch})` : ''}`;

    onSaveReport({
      id: `vet_report_${Date.now()}`,
      partnershipId: selectedPartnership.id,
      animalTagId: selectedPartnership.animalTagId,
      veterinarianId: currentUser.id,
      veterinarianName: currentUser.name,
      farmerId: selectedPartnership.farmerId,
      investorId: selectedPartnership.investorId,
      visitType,
      findings: fullFindings,
      recommendations: recommendations.trim(),
      status,
      createdAt: new Date().toISOString()
    });

    // If pregnancy is near calving or critical event, optionally log life event
    if (pregnancyState === 'CALVING_WINDOW_DUE' && onLogLifeEvent) {
      onLogLifeEvent({
        farmId: selectedPartnership.id,
        farmerName: farmer?.name || 'Partner Farmer',
        eventType: 'CALVING_DUE',
        title: `Calving Due: ${selectedPartnership.animalTagId}`,
        description: `Veterinary examination confirms animal ${selectedPartnership.animalTagId} is entering calving window. Prepared clean stall and calving kit.`,
        severity: 'MEDIUM',
        actionTaken: 'Monitored daily by farmer; emergency vet contact on standby',
        impactOnProduce: 'Anticipated 25-30% milk output surge in upcoming cycle',
        reportedBy: `${currentUser.name} (Official Veterinarian)`
      });
    }

    setFindings('');
    setRecommendations('');
    setSubmitSuccess('Official clinical report published and broadcast to Farmer, Investor, and District Admin.');
    setTimeout(() => setSubmitSuccess(''), 4000);
  };

  const handleClaimJob = (jobId: string) => {
    if (onUpdateJobStatus) {
      onUpdateJobStatus(jobId, 'IN_PROGRESS');
    }
  };

  const handleCompleteJob = (jobId: string) => {
    if (onUpdateJobStatus) {
      onUpdateJobStatus(jobId, 'COMPLETED');
    }
  };

  return (
    <div className="space-y-6" id="veterinary_primary_dashboard">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 rounded-3xl p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                Kenya Veterinary Board (KVB) Verified
              </span>
              <span className="text-xs text-teal-200">
                • {currentUser.county} District Registry
              </span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight text-white">
              {currentUser.name}'s Veterinary Command Station
            </h1>
            <p className="text-xs text-teal-100/80 max-w-2xl font-sans">
              Accept clinical dispatch jobs from farmers, conduct certified health examinations, log everyday animal life events (calving, breeding, vaccinations), and broadcast immutable reports to all stakeholders.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-teal-200">Field Jobs</span>
              <strong className="text-lg font-black">{myAssignedJobs.length || 2}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-teal-200">Reports Filed</span>
              <strong className="text-lg font-black">{reports.length}</strong>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 text-center border border-white/10">
              <span className="block text-[10px] uppercase font-bold text-teal-200">Active Herds</span>
              <strong className="text-lg font-black text-amber-300">{openJobs.length}</strong>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'jobs', label: '1. Field Jobs & Dispatches', icon: Activity },
            { id: 'publish_report', label: '2. Clinical Examination & Report', icon: Stethoscope },
            { id: 'all_reports', label: '3. Published Health Audits', icon: FileText },
            { id: 'everyday_life', label: '4. Everyday Life Events Log', icon: Heart },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-teal-950 shadow-sm'
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

      {/* TAB 1: FIELD JOBS & DISPATCHES */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Assigned & Available Field Jobs
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Clinical examination requests dispatched by farmers and district coordinators.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Live Dispatch
              </span>
            </div>

            {myAssignedJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAssignedJobs.map(job => (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              job.urgency === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' :
                              job.urgency === 'URGENT' ? 'bg-amber-100 text-amber-800' :
                              'bg-teal-100 text-teal-800'
                            }`}>
                              {job.urgency}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{job.serviceType.replaceAll('_', ' ')}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Farmer: {job.farmerName} • <a href={`tel:${job.farmerPhone}`} className="text-teal-600 underline font-mono">{job.farmerPhone}</a>
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {job.requestedDate}
                        </span>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1 text-xs border border-slate-100 dark:border-slate-800">
                        <p><strong className="text-slate-900 dark:text-white">Location:</strong> {job.location}</p>
                        <p><strong className="text-slate-900 dark:text-white">Animal / Crop:</strong> {job.animalOrCropType}</p>
                        {job.notes && <p><strong className="text-slate-900 dark:text-white">Observations:</strong> {job.notes}</p>}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      {job.status === 'OPEN' && (
                        <button
                          onClick={() => handleClaimJob(job.id)}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                        >
                          Accept & Claim Job
                        </button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <>
                          <button
                            onClick={() => {
                              setActiveTab('publish_report');
                              setVisitType(job.serviceType === 'VACCINATION' ? 'Vaccination' : 'Routine health inspection');
                              setFindings(`Field visit conducted for ${job.animalOrCropType} at ${job.location}. `);
                            }}
                            className="flex-1 bg-teal-650 hover:bg-teal-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                          >
                            Conduct Exam & Report
                          </button>
                          <button
                            onClick={() => handleCompleteJob(job.id)}
                            className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-xs"
                          >
                            Mark Completed
                          </button>
                        </>
                      )}
                      {job.status === 'COMPLETED' && (
                        <span className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                          ✓ Completed & Filed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No open field jobs at the moment</p>
                <p className="text-[11px]">Farmers in your county will request visits for vaccinations, health checks, and calving assistance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLINICAL EXAMINATION & REPORT */}
      {activeTab === 'publish_report' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Active Herds in County */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Select Supervised Herd / Animal
                </h3>
                <p className="text-[10px] text-slate-500">Pick an active tripartite contract to audit.</p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {openJobs.map(partnership => {
                  const assignedFarmer = usersList.find(u => u.id === partnership.farmerId);
                  const isSelected = partnership.id === selectedPartnershipId;
                  return (
                    <button
                      key={partnership.id}
                      type="button"
                      onClick={() => setSelectedPartnershipId(partnership.id)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <strong className="text-xs text-slate-900 dark:text-white">{partnership.animalTagId}</strong>
                        <span className="text-[10px] font-bold text-teal-600 uppercase">{partnership.animalType}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Breed: {partnership.breed} • Farmer: {assignedFarmer?.name || partnership.farmerId}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Examination Form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  Record Clinical Examination & Health Certificate
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Broadcasted immediately to {farmer?.name || 'the farmer'}, {investor?.name || 'the investor'}, and district archives.
                </p>
              </div>

              <form onSubmit={submitReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Visit Category</label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="Routine health inspection">Routine Health Inspection</option>
                      <option value="Vaccination">Vaccination (FMD, Anthrax, ECF)</option>
                      <option value="Breeding / pregnancy check">Breeding / Pregnancy Examination</option>
                      <option value="Illness or treatment">Illness Diagnosis & Clinical Treatment</option>
                      <option value="Birth or other key life event">Calving / Parturition Assessment</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Reproductive / Gestation State</label>
                    <select
                      value={pregnancyState}
                      onChange={(e: any) => setPregnancyState(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="NON_PREGNANT">Non-Pregnant / Open</option>
                      <option value="CONFIRMED_PREGNANT_1ST_TRIMESTER">Confirmed Pregnant (1st Trimester)</option>
                      <option value="CONFIRMED_PREGNANT_2ND_TRIMESTER">Confirmed Pregnant (2nd Trimester)</option>
                      <option value="CALVING_WINDOW_DUE">Calving Window Due (Immediate Alert)</option>
                    </select>
                  </div>
                </div>

                {/* Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Body Temp (°C)</label>
                    <input
                      type="text"
                      value={bodyTemp}
                      onChange={(e) => setBodyTemp(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Condition Score (1-5)</label>
                    <input
                      type="text"
                      value={bodyConditionScore}
                      onChange={(e) => setBodyConditionScore(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Rumen Motility</label>
                    <input
                      type="text"
                      value={rumenMotility}
                      onChange={(e) => setRumenMotility(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Vaccine / Drug Batch</label>
                    <input
                      type="text"
                      value={vaccineBatch}
                      onChange={(e) => setVaccineBatch(e.target.value)}
                      placeholder="Batch #"
                      className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clinical Findings & Observations</label>
                  <textarea
                    rows={2}
                    required
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    placeholder="Describe respiratory sounds, udder condition, mucosal color, appetite, or gait..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recommendations & Follow-Up Protocol</label>
                  <textarea
                    rows={2}
                    required
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    placeholder="Prescribed dosages, mineral lick adjustments, silage rationing, or next scheduled visit..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Production Fitness Verdict</label>
                    <select
                      value={status}
                      onChange={(e: any) => setStatus(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="FIT_FOR_PRODUCTION">Fit for Production (Green)</option>
                      <option value="FOLLOW_UP_REQUIRED">Follow-Up Required (Watch)</option>
                      <option value="TREATMENT_REQUIRED">Treatment Required (Amber)</option>
                      <option value="NOT_FIT_FOR_PRODUCTION">Not Fit for Production (Quarantine)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-teal-650 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Sign & Broadcast Report
                    </button>
                  </div>
                </div>

                {submitSuccess && (
                  <p className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                    {submitSuccess}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PUBLISHED HEALTH AUDITS */}
      {activeTab === 'all_reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Historical Veterinary Reports ({reports.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Permanent record of health evaluations and treatments.
                </p>
              </div>
              <span className="text-[10px] font-bold text-teal-600 font-mono">
                Official KVB Log
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(report => (
                <article
                  key={report.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-slate-900 dark:text-white">{report.animalTagId} • {report.visitType}</strong>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Officer: {report.veterinarianName} • {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      report.status === 'FIT_FOR_PRODUCTION' ? 'bg-emerald-100 text-emerald-800' :
                      report.status === 'TREATMENT_REQUIRED' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {report.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl space-y-1.5 text-xs border border-slate-100 dark:border-slate-800">
                    <p><strong className="text-slate-900 dark:text-white">Findings:</strong> {report.findings}</p>
                    <p><strong className="text-slate-900 dark:text-white">Recommendations:</strong> {report.recommendations}</p>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-sans">
                    <span>Partnership ID: {report.partnershipId}</span>
                    <span className="text-teal-600 font-bold">✓ Signed KVB Certificate</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EVERYDAY LIFE EVENTS */}
      {activeTab === 'everyday_life' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold font-display uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Everyday Animal Life Cycle Protocols
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl font-sans">
              Guidance on tracking critical milestones in dairy cows and livestock: breeding windows, gestation confirmation, dry-off periods, and postpartum recovery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phase 1: Artificial Insemination (AI)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Log the semen straw serial number, pedigree index (+1,200kg milk predicted), and technician timestamp. Schedule ultrasound scan for day 35.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-900 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
              <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
                <Activity className="w-4 h-4" />
                <span>Phase 2: Gestation & Dry-Off</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                At 7 months gestation, cease milking (dry-off protocol) and introduce anionic salts and dry-cow intramammary antibiotics to safeguard the udder.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>Phase 3: Calving Due & Postpartum</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Prepare straw bedding stall 10 days before estimated delivery. Monitor for milk vein enlargement, pelvic ligament relaxation, and administer colostrum within 2 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
