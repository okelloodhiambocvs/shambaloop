import React, { useState } from 'react';
import { Stethoscope, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { LivestockPartnership, VeterinaryReport } from '../../types';

interface VetReportFormProps {
  partnershipId: string;
  setPartnershipId: (id: string) => void;
  permitted: LivestockPartnership[];
  form: {
    visitType: string;
    findings: string;
    recommendations: string;
    status: VeterinaryReport['status'];
  };
  setForm: React.Dispatch<React.SetStateAction<{
    visitType: string;
    findings: string;
    recommendations: string;
    status: VeterinaryReport['status'];
  }>>;
  attachments: File[];
  setAttachments: React.Dispatch<React.SetStateAction<File[]>>;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const VetReportForm: React.FC<VetReportFormProps> = ({
  partnershipId,
  setPartnershipId,
  permitted,
  form,
  setForm,
  attachments,
  setAttachments,
  busy,
  onSubmit,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs"
      id="vet_clinical_report_form"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Stethoscope className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          <span>Write Official Veterinary Clinical Report</span>
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded">
          KVB Audit Standard
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Clinical findings, treatments, vaccinations, and supporting photos or lab certificates are permanently recorded for farm escrow audit.
      </p>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Assigned Livestock Partnership
        </label>
        <select
          required
          value={partnershipId}
          onChange={(e) => setPartnershipId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="">Select an assigned livestock record</option>
          {permitted.map((item) => (
            <option key={item.id} value={item.id}>
              {item.animalTagId} · {item.breed}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Service Performed
        </label>
        <input
          required
          value={form.visitType}
          maxLength={160}
          onChange={(e) => setForm((prev) => ({ ...prev, visitType: e.target.value }))}
          placeholder="e.g. Routine Health Check / ECF Treatment / De-worming"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Clinical Observations & Diagnosis
        </label>
        <textarea
          required
          rows={3}
          value={form.findings}
          maxLength={3000}
          onChange={(e) => setForm((prev) => ({ ...prev, findings: e.target.value }))}
          placeholder="Record temperature, body condition score, symptoms, lab diagnostics..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Treatment & Mandatory Recommendations
        </label>
        <textarea
          required
          rows={3}
          value={form.recommendations}
          maxLength={3000}
          onChange={(e) => setForm((prev) => ({ ...prev, recommendations: e.target.value }))}
          placeholder="Dosages administered, quarantine instructions, follow-up dates..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
          Clinical Outcome
        </label>
        <select
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              status: e.target.value as VeterinaryReport['status'],
            }))
          }
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        >
          <option value="FIT_FOR_PRODUCTION">FIT FOR PRODUCTION</option>
          <option value="FOLLOW_UP_REQUIRED">FOLLOW UP REQUIRED</option>
          <option value="TREATMENT_REQUIRED">TREATMENT REQUIRED</option>
          <option value="NOT_FIT_FOR_PRODUCTION">NOT FIT FOR PRODUCTION</option>
        </select>
      </div>

      {/* Upload Supporting Documentation or Images */}
      <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 space-y-2">
        <label className="block text-xs font-bold text-teal-900 dark:text-teal-200">
          Upload Clinical Documentation (Photos or Lab Certificates)
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Attach animal photos, lab assay results, prescription slips, or vaccination certificates.
        </p>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-xs">
            <UploadCloud className="w-4 h-4 text-teal-600" />
            <span>Select Files to Upload</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="vet_report_file_input"
            />
          </label>

          <span className="text-xs text-slate-500">
            {attachments.length} file(s) selected
          </span>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-200"
              >
                <FileText className="w-3 h-3 text-teal-600" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-rose-500 hover:text-rose-700 ml-1 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-teal-700 hover:bg-teal-600 px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
          id="btn_publish_vet_report"
        >
          {busy ? 'Uploading & Publishing...' : 'Publish Official Clinical Report'}
        </button>
      </div>
    </form>
  );
};
