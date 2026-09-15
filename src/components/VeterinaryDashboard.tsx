import React, { useState } from 'react';
import { LivestockPartnership, User, UserRole, VeterinaryReport } from '../types';

interface VeterinaryDashboardProps {
  currentUser: User;
  partnerships: LivestockPartnership[];
  usersList: User[];
  reports: VeterinaryReport[];
  onSaveReport: (report: VeterinaryReport) => void;
}

export default function VeterinaryDashboard({
  currentUser,
  partnerships,
  usersList,
  reports,
  onSaveReport
}: VeterinaryDashboardProps) {
  const [selectedPartnershipId, setSelectedPartnershipId] = useState(partnerships[0]?.id || '');
  const [visitType, setVisitType] = useState('Routine health inspection');
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [status, setStatus] = useState<VeterinaryReport['status']>('FIT_FOR_PRODUCTION');

  const selectedPartnership = partnerships.find(partnership => partnership.id === selectedPartnershipId);
  const farmer = usersList.find(user => user.id === selectedPartnership?.farmerId);
  const investor = usersList.find(user => user.id === selectedPartnership?.investorId);
  const openJobs = partnerships.filter(partnership => partnership.status === 'ACTIVE');

  const submitReport = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPartnership || !findings.trim() || !recommendations.trim()) return;

    onSaveReport({
      id: `vet_report_${Date.now()}`,
      partnershipId: selectedPartnership.id,
      animalTagId: selectedPartnership.animalTagId,
      veterinarianId: currentUser.id,
      veterinarianName: currentUser.name,
      farmerId: selectedPartnership.farmerId,
      investorId: selectedPartnership.investorId,
      visitType,
      findings: findings.trim(),
      recommendations: recommendations.trim(),
      status,
      createdAt: new Date().toISOString()
    });
    setFindings('');
    setRecommendations('');
  };

  return (
    <div className="space-y-4" id="veterinary_dashboard">
      <section className="rounded-2xl border border-border-base bg-card-bg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-green">Veterinary operations</p>
            <h2 className="mt-1 text-xl font-black font-display">Field visits and animal health records</h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-600 dark:text-slate-200">
              Accept farm visits, record key life events, and publish reports shared with the farmer, investor, and ShambaLoop admin.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl border border-border-base px-4 py-3">
              <strong className="block text-lg font-black">{openJobs.length}</strong>
              <span className="text-[10px] uppercase tracking-wider">Open visits</span>
            </div>
            <div className="rounded-xl border border-border-base px-4 py-3">
              <strong className="block text-lg font-black">{reports.length}</strong>
              <span className="text-[10px] uppercase tracking-wider">Published reports</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[0.85fr_1.15fr] gap-4">
        <section className="rounded-2xl border border-border-base bg-card-bg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Available farm visits</h3>
              <p className="text-xs text-slate-600 dark:text-slate-200 mt-1">Active livestock collaborations needing veterinary attention.</p>
            </div>
            <span className="rounded-full bg-brand-green px-2 py-1 text-[10px] font-bold text-white">JOBS</span>
          </div>
          <div className="space-y-2">
            {openJobs.map(partnership => {
              const assignedFarmer = usersList.find(user => user.id === partnership.farmerId);
              return (
                <button
                  type="button"
                  key={partnership.id}
                  onClick={() => setSelectedPartnershipId(partnership.id)}
                  className={`w-full rounded-xl border p-3 text-left transition ${selectedPartnershipId === partnership.id ? 'border-brand-green bg-brand-green/10' : 'border-border-base'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs">{partnership.animalTagId}</strong>
                    <span className="text-[10px] uppercase text-brand-green">{partnership.animalType}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-200">{partnership.breed} · Farmer: {assignedFarmer?.name || partnership.farmerId}</p>
                </button>
              );
            })}
          </div>
        </section>

        <form onSubmit={submitReport} className="rounded-2xl border border-border-base bg-card-bg p-5 space-y-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider">Publish a visit report</h3>
            <p className="text-xs text-slate-600 dark:text-slate-200 mt-1">
              Reports are visible to {farmer?.name || 'the farmer'}, {investor?.name || 'the investor'}, and admin.
            </p>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider">
            Animal / partnership
            <select value={selectedPartnershipId} onChange={event => setSelectedPartnershipId(event.target.value)} className="mt-1 w-full rounded-lg border border-border-base bg-transparent p-2.5 text-sm font-normal">
              {openJobs.map(partnership => <option key={partnership.id} value={partnership.id}>{partnership.animalTagId} · {partnership.breed}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider">
            Visit type
            <select value={visitType} onChange={event => setVisitType(event.target.value)} className="mt-1 w-full rounded-lg border border-border-base bg-transparent p-2.5 text-sm font-normal">
              <option>Routine health inspection</option>
              <option>Vaccination</option>
              <option>Breeding / pregnancy check</option>
              <option>Illness or treatment</option>
              <option>Birth or other key life event</option>
            </select>
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider">
            Findings
            <textarea required value={findings} onChange={event => setFindings(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border-base bg-transparent p-2.5 text-sm font-normal" placeholder="Record observed condition, measurements, and key life event details." />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider">
            Recommendations
            <textarea required value={recommendations} onChange={event => setRecommendations(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-border-base bg-transparent p-2.5 text-sm font-normal" placeholder="Record treatment, follow-up date, or feed and care recommendations." />
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={status} onChange={event => setStatus(event.target.value as VeterinaryReport['status'])} className="rounded-lg border border-border-base bg-transparent p-2.5 text-xs">
              <option value="FIT_FOR_PRODUCTION">Fit for production</option>
              <option value="FOLLOW_UP_REQUIRED">Follow-up required</option>
              <option value="TREATMENT_REQUIRED">Treatment required</option>
              <option value="NOT_FIT_FOR_PRODUCTION">Not fit for production</option>
            </select>
            <button type="submit" className="flex-1 rounded-lg bg-agri-dirt-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90">
              Publish report
            </button>
          </div>
        </form>
      </div>

      <section className="rounded-2xl border border-border-base bg-card-bg p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider">Published veterinary reports</h3>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {reports.map(report => (
            <article key={report.id} className="rounded-xl border border-border-base p-4">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs">{report.animalTagId} · {report.visitType}</strong>
                <span className="text-[10px] font-bold uppercase text-brand-green">{report.status.replaceAll('_', ' ')}</span>
              </div>
              <p className="mt-2 text-xs"><strong>Findings:</strong> {report.findings}</p>
              <p className="mt-1 text-xs"><strong>Next step:</strong> {report.recommendations}</p>
              <p className="mt-2 text-[10px] text-slate-600 dark:text-slate-200">Published by {report.veterinarianName} on {new Date(report.createdAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
