import React, { useMemo, useState } from 'react';
import { AlertTriangle, FileText, MapPin, Star, Stethoscope } from 'lucide-react';
import { LivestockPartnership, User, VeterinaryJob, VeterinaryReport } from '../types';
import ParticipantWorkspace from './ParticipantWorkspace';
import ReviewModal from './ReviewModal';
import VerificationDocumentUploader from './VerificationDocumentUploader';
import { readFileAsBase64, sharedWorkspaceApi } from '../services/sharedWorkspaceService';
import { VetReportForm } from './veterinary/VetReportForm';

interface Props {
  currentUser: User;
  partnerships: LivestockPartnership[];
  reports: VeterinaryReport[];
  vetJobs: VeterinaryJob[];
  onSaveReport: (input: {
    partnershipId: string;
    jobId: string;
    visitType: string;
    findings: string;
    recommendations: string;
    status: VeterinaryReport['status'];
    documents?: string[];
    photos?: string[];
  }) => Promise<void>;
  onUpdateJobStatus: (id: string, status: VeterinaryJob['status'], completionNotes?: string) => Promise<void>;
}

const date = (value: string) => new Date(value).toLocaleDateString();

export default function VeterinaryDashboard({
  currentUser,
  partnerships,
  reports,
  vetJobs,
  onSaveReport,
  onUpdateJobStatus,
}: Props) {
  const [view, setView] = useState<'jobs' | 'report' | 'records' | 'fms' | 'wallet' | 'disputes' | 'reviews' | 'documents'>('jobs');
  const [partnershipId, setPartnershipId] = useState(partnerships[0]?.id || '');
  const [jobId, setJobId] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [form, setForm] = useState({
    visitType: 'Clinical check',
    findings: '',
    recommendations: '',
    status: 'FIT_FOR_PRODUCTION' as VeterinaryReport['status'],
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [preselectedReviewTarget, setPreselectedReviewTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  const assigned = vetJobs.filter((job) => job.assignedVetId === currentUser.id);
  const open = vetJobs.filter((job) => job.status === 'OPEN');
  const alerts = reports.filter((report) => report.status !== 'FIT_FOR_PRODUCTION');
  const permitted = useMemo(() => {
    return partnerships.filter((partnership) =>
      assigned.some((job) => job.farmId === partnership.id && job.status !== 'COMPLETED')
    );
  }, [assigned, partnerships]);

  const changeJob = async (id: string, status: VeterinaryJob['status']) => {
    setBusy(id);
    try {
      const notes = status === 'COMPLETED' ? window.prompt('Describe the completed veterinary work:') : undefined;
      if (status === 'COMPLETED' && !notes?.trim()) return;
      await onUpdateJobStatus(id, status, notes || undefined);
    } catch (error: any) {
      window.alert(error.message || 'Unable to update job.');
    } finally {
      setBusy(null);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const job = assigned.find((item) => item.id === jobId) || vetJobs.find((j) => j.farmId === partnershipId);
    setBusy('report');
    try {
      const uploaded = await Promise.all(
        attachments.map(async (file) => {
          const result = await sharedWorkspaceApi.upload({
            fileName: file.name,
            mimeType: file.type,
            base64Data: await readFileAsBase64(file),
            farmId: job?.farmId || partnershipId,
            documentType: file.type.startsWith('image/') ? 'FARM_PHOTO' : 'VETERINARY_REPORT',
          });
          if (result.error || !result.data) throw new Error(result.error || 'Evidence upload failed.');
          return { id: result.data.file.id, image: file.type.startsWith('image/') };
        })
      );
      await onSaveReport({
        partnershipId,
        jobId: jobId || job?.id || 'manual_audit',
        ...form,
        documents: uploaded.filter((item) => !item.image).map((item) => item.id),
        photos: uploaded.filter((item) => item.image).map((item) => item.id),
      });
      setAttachments([]);
      setForm({ visitType: 'Clinical check', findings: '', recommendations: '', status: 'FIT_FOR_PRODUCTION' });
      setView('records');
    } catch (error: any) {
      window.alert(error.message || 'Unable to update report.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="veterinary_primary_dashboard" className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">Veterinary workspace</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">Hello, {currentUser.name}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jobs, records, and follow-up clinical reports across assigned shambas and herds.</p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Veterinary views">
          {([
            ['jobs', 'Jobs'],
            ['report', 'Write report'],
            ['records', 'Recent reports'],
            ['fms', 'Farm Docs'],
            ['wallet', 'Wallet'],
            ['documents', 'Accreditation & KYC'],
            ['disputes', 'Dispute Room'],
            ['reviews', 'Reviews'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${view === id ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'jobs' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="border-l-4 border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Assigned jobs</p>
              <p className="text-xl font-bold">{assigned.filter((j) => j.status !== 'COMPLETED').length}</p>
            </div>
            <div className="border-l-4 border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Open requests</p>
              <p className="text-xl font-bold">{open.length}</p>
            </div>
            <div className="border-l-4 border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs text-slate-500">Follow-ups</p>
              <p className="text-xl font-bold text-amber-700">{alerts.length}</p>
            </div>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-bold">Jobs requiring action</h2>
            </div>
            {[...assigned, ...open].length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...assigned, ...open].map((job) => (
                  <article key={job.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold">{job.serviceType.replaceAll('_', ' ')} · {job.urgency}</p>
                      <p className="text-xs text-slate-500"><MapPin className="inline h-3 w-3 mr-1" />{job.location} · {job.animalOrCropType}</p>
                    </div>
                    <div className="flex gap-2">
                      {job.status === 'OPEN' && (
                        <button disabled={busy === job.id} onClick={() => changeJob(job.id, 'ASSIGNED')} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs text-white">Accept</button>
                      )}
                      {job.status === 'ASSIGNED' && (
                        <button disabled={busy === job.id} onClick={() => changeJob(job.id, 'IN_PROGRESS')} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs text-white">Start work</button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => { setPartnershipId(job.farmId); setJobId(job.id); setView('report'); }} className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs text-white">Record outcome</button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="p-8 text-center text-xs text-slate-500">No active veterinary jobs.</p>
            )}
          </section>
        </div>
      )}

      {view === 'report' && (
        <VetReportForm
          partnershipId={partnershipId}
          setPartnershipId={setPartnershipId}
          permitted={permitted.length > 0 ? permitted : partnerships}
          form={form}
          setForm={setForm}
          attachments={attachments}
          setAttachments={setAttachments}
          busy={busy === 'report'}
          onSubmit={submit}
        />
      )}

      {view === 'records' && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-teal-600" /> Recent Reports</h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {reports.map((r) => (
              <div key={r.id} className="py-2 text-xs">
                <span className="font-bold">{r.animalTagId} · {r.visitType}</span>
                <p className="text-slate-600 dark:text-slate-300">{r.findings}</p>
                <span className="text-[10px] text-slate-400">{date(r.createdAt)} · {r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === 'documents' && <VerificationDocumentUploader user={currentUser} roleType="veterinarian" />}
      {(view === 'fms' || view === 'wallet' || view === 'disputes' || view === 'reviews') && (
        <ParticipantWorkspace user={currentUser} partnerships={partnerships} mode={view} />
      )}
      <ReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} currentUser={currentUser} preselectedTarget={preselectedReviewTarget} />
    </section>
  );
}
