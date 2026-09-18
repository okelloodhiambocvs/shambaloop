import React, { useMemo, useState } from 'react';
import { AlertTriangle, ClipboardList, FileText, MapPin, Star, Stethoscope } from 'lucide-react';
import { LivestockPartnership, User, VeterinaryJob, VeterinaryReport } from '../types';
import ParticipantWorkspace from './ParticipantWorkspace';
import ReviewModal from './ReviewModal';
import VerificationDocumentUploader from './VerificationDocumentUploader';
import { readFileAsBase64, sharedWorkspaceApi } from '../services/sharedWorkspaceService';

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
    photos?: string[] 
  }) => Promise<void>; 
  onUpdateJobStatus: (id: string, status: VeterinaryJob['status']) => Promise<void>; 
}

const date = (value: string) => new Date(value).toLocaleDateString();

export default function VeterinaryDashboard({ 
  currentUser, 
  partnerships, 
  reports, 
  vetJobs, 
  onSaveReport, 
  onUpdateJobStatus 
}: Props) {
  const [view, setView] = useState<'jobs' | 'report' | 'records' | 'fms' | 'wallet' | 'disputes' | 'reviews' | 'documents'>('jobs');
  const [partnershipId, setPartnershipId] = useState(partnerships[0]?.id || '');
  const [jobId, setJobId] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [form, setForm] = useState({ 
    visitType: 'Clinical check', 
    findings: '', 
    recommendations: '', 
    status: 'FIT_FOR_PRODUCTION' as VeterinaryReport['status'] 
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [preselectedReviewTarget, setPreselectedReviewTarget] = useState<{ id: string; name: string; role: string } | null>(null);

  const assigned = vetJobs.filter(job => job.assignedVetId === currentUser.id);
  const open = vetJobs.filter(job => job.status === 'OPEN');
  const alerts = reports.filter(report => report.status !== 'FIT_FOR_PRODUCTION');
  const permitted = useMemo(() => {
    return partnerships.filter(partnership => assigned.some(job => job.farmId === partnership.id && job.status !== 'COMPLETED'));
  }, [assigned, partnerships]);

  const changeJob = async (id: string, status: VeterinaryJob['status']) => { 
    setBusy(id); 
    try { 
      await onUpdateJobStatus(id, status); 
    } finally { 
      setBusy(null); 
    } 
  };

  const submit = async (event: React.FormEvent) => { 
    event.preventDefault(); 
    const job = assigned.find(item => item.id === jobId); 
    if (!job) return; 
    setBusy('report'); 
    try { 
      const uploaded = await Promise.all(attachments.map(async file => { 
        const result = await sharedWorkspaceApi.upload({ 
          fileName: file.name, 
          mimeType: file.type, 
          base64Data: await readFileAsBase64(file), 
          farmId: job.farmId, 
          documentType: file.type.startsWith('image/') ? 'FARM_PHOTO' : 'VETERINARY_REPORT' 
        }); 
        if (result.error || !result.data) throw new Error(result.error || 'Evidence upload failed.'); 
        return { id: result.data.file.id, image: file.type.startsWith('image/') }; 
      })); 
      await onSaveReport({ 
        partnershipId, 
        jobId, 
        ...form, 
        documents: uploaded.filter(item => !item.image).map(item => item.id), 
        photos: uploaded.filter(item => item.image).map(item => item.id) 
      }); 
      setAttachments([]); 
      setForm({ visitType: 'Clinical check', findings: '', recommendations: '', status: 'FIT_FOR_PRODUCTION' }); 
      setView('records'); 
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
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Welcome to your veterinary workspace. Manage Jobs, records, and follow-up for assigned livestock and clinical visits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2" aria-label="Veterinary views">
            {([
              ['jobs', 'Jobs'],
              ['report', 'Write report'],
              ['records', 'Recent reports'],
              ['fms', 'Farm Docs'],
              ['wallet', 'Wallet'],
              ['documents', 'Accreditation & KYC'],
              ['disputes', 'Dispute Room'],
              ['reviews', 'Reviews']
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
        </div>
      </header>

      {view === 'jobs' && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Assigned jobs" value={assigned.filter(job => job.status !== 'COMPLETED').length}/>
            <Metric label="Open requests" value={open.length}/>
            <Metric label="Follow-ups" value={alerts.length} alert={alerts.length > 0}/>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Jobs requiring action</h2>
            </div>
            {[...assigned, ...open].length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...assigned, ...open].map(job => (
                  <article key={job.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {job.serviceType.replaceAll('_',' ')} <span className="ml-2 text-xs text-slate-500">{job.urgency}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                        <MapPin className="h-3 w-3"/>{job.location} · {job.animalOrCropType}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{job.farmerName} · requested {date(job.requestedDate)}</p>
                      {job.notes && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{job.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {job.status === 'OPEN' && (
                        <button disabled={busy === job.id} onClick={() => changeJob(job.id, 'IN_PROGRESS')} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">
                          Accept
                        </button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <>
                          <button onClick={() => { setPartnershipId(job.farmId); setJobId(job.id); setView('report'); }} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white">
                            Record outcome
                          </button>
                          <button disabled={busy === job.id} onClick={() => changeJob(job.id, 'COMPLETED')} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                            Complete
                          </button>
                        </>
                      )}
                      {job.status === 'COMPLETED' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700">Completed</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPreselectedReviewTarget({ id: job.farmerId, name: job.farmerName || 'Farmer', role: 'farmer' });
                              setReviewModalOpen(true);
                            }}
                            className="flex items-center gap-1 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-200"
                          >
                            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                            Review Farmer
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="No assigned or open service requests." />
            )}
          </section>
          {alerts.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-100">
                <AlertTriangle className="h-4 w-4"/>Follow-up required
              </h2>
              {alerts.map(report => (
                <p key={report.id} className="mt-2 text-xs text-amber-900 dark:text-amber-100">
                  {report.animalTagId}: {report.status.replaceAll('_',' ')}
                </p>
              ))}
            </section>
          )}
        </div>
      )}

      {view === 'report' && (
        <form onSubmit={submit} className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Stethoscope className="h-4 w-4 text-teal-700"/>Clinical record
          </h2>
          <p className="text-xs text-slate-500">A report is tied to your accepted job, its livestock record, farmer, and investor collaboration.</p>
          <Field label="Livestock record">
            <select required value={partnershipId} onChange={event => setPartnershipId(event.target.value)}>
              <option value="">Select an assigned record</option>
              {permitted.map(item => (
                <option key={item.id} value={item.id}>{item.animalTagId} · {item.breed}</option>
              ))}
            </select>
          </Field>
          <Field label="Service">
            <input required value={form.visitType} maxLength={160} onChange={event => setForm(current => ({...current, visitType: event.target.value}))}/>
          </Field>
          <Field label="Observations and diagnosis">
            <textarea required value={form.findings} maxLength={3000} onChange={event => setForm(current => ({...current, findings: event.target.value}))}/>
          </Field>
          <Field label="Treatment, recommendation, and follow-up">
            <textarea required value={form.recommendations} maxLength={3000} onChange={event => setForm(current => ({...current, recommendations: event.target.value}))}/>
          </Field>
          <Field label="Outcome">
            <select value={form.status} onChange={event => setForm(current => ({...current, status: event.target.value as VeterinaryReport['status']}))}>
              {(['FIT_FOR_PRODUCTION','FOLLOW_UP_REQUIRED','TREATMENT_REQUIRED','NOT_FIT_FOR_PRODUCTION'] as const).map(value => (
                <option key={value}>{value.replaceAll('_',' ')}</option>
              ))}
            </select>
          </Field>
          <button disabled={busy === 'report'} className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
            {busy === 'report' ? 'Saving...' : 'Publish report'}
          </button>
        </form>
      )}

      {view === 'records' && (
        <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <FileText className="h-4 w-4"/>Recent reports
            </h2>
          </div>
          {reports.length ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map(report => (
                <li key={report.id} className="px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{report.animalTagId} · {report.visitType}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{report.findings}</p>
                  <p className="mt-1 text-xs text-slate-500">{report.status.replaceAll('_',' ')} · {date(report.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="No reports have been published." />
          )}
        </section>
      )}

      {(view === 'fms' || view === 'wallet' || view === 'disputes' || view === 'reviews') && (
        <ParticipantWorkspace 
          user={currentUser} 
          partnerships={partnerships.filter(partnership => assigned.some(job => job.farmId === partnership.id))} 
          mode={view === 'disputes' ? 'disputes' : view === 'reviews' ? 'reviews' : view === 'fms' ? 'fms' : 'wallet'} 
        />
      )}

      {view === 'documents' && (
        <VerificationDocumentUploader
          user={currentUser}
          roleType="veterinarian"
        />
      )}

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        currentUser={currentUser}
        preselectedTarget={preselectedReviewTarget}
      />
    </section>
  );
}

function Metric({label, value, alert=false}: {label: string; value: number; alert?: boolean}) { 
  return (
    <div className="border-l-4 border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${alert ? 'text-amber-700' : 'text-slate-950 dark:text-white'}`}>{value}</p>
    </div>
  ); 
}

function Empty({text}: {text: string}) { 
  return <p className="px-4 py-8 text-center text-xs text-slate-500">{text}</p>; 
}

function Field({label, children}: {label: string; children: React.ReactNode}) { 
  return (
    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
      <span className="mb-1.5 block">{label}</span>
      {React.isValidElement(children) 
        ? React.cloneElement(children as React.ReactElement<{className?: string}>, {
            className: 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
          }) 
        : children}
    </label>
  ); 
}
