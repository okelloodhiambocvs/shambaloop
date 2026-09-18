import React, { useState } from 'react';
import { ShieldAlert, Plus, UploadCloud, AlertCircle, CheckCircle2, FileText, Scale } from 'lucide-react';
import { User, LivestockPartnership, Dispute } from '../../types';
import { sharedWorkspaceApi, readFileAsBase64 } from '../../services/sharedWorkspaceService';

interface DisputesTabProps {
  user: User;
  partnerships: LivestockPartnership[];
  disputes: Dispute[];
  busy: boolean;
  act: (fn: () => Promise<void>, msg?: string) => Promise<void>;
}

export const DisputesTab: React.FC<DisputesTabProps> = ({
  user,
  partnerships,
  disputes,
  busy,
  act,
}) => {
  const [showFileModal, setShowFileModal] = useState(false);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [respondentId, setRespondentId] = useState(() => {
    const p = partnerships[0];
    return user.role === 'investor' ? p?.farmerId || '' : p?.investorId || '';
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [fileSuccess, setFileSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError('');
    setFileSuccess('');

    if (!title.trim() || !reason.trim()) {
      setFileError('Please provide a title and detailed reason for the dispute.');
      return;
    }

    setIsSubmitting(true);
    try {
      const evidenceUrls: string[] = [];

      if (evidenceFile) {
        const base64Data = await readFileAsBase64(evidenceFile);
        const uploadRes = await sharedWorkspaceApi.upload({
          fileName: evidenceFile.name,
          mimeType: evidenceFile.type,
          base64Data,
          documentType: 'DISPUTE_EVIDENCE',
          description: `Dispute evidence for: ${title}`,
        });

        if (uploadRes.data?.file?.url) {
          evidenceUrls.push(uploadRes.data.file.url);
        }
      }

      await act(async () => {
        const res = await sharedWorkspaceApi.raiseDispute({
          title,
          reason,
          respondentId: respondentId || undefined,
          evidenceUrls,
        });
        if (res.error) throw new Error(res.error);
      }, 'Dispute successfully lodged with cooperative committee.');

      setFileSuccess('Dispute filed successfully.');
      setTitle('');
      setReason('');
      setEvidenceFile(null);
      setTimeout(() => setShowFileModal(false), 1200);
    } catch (err: any) {
      setFileError(err.message || 'Failed to lodge dispute.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6" id="participant_disputes_view">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <span>Escrow Arbitration & Dispute Room</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Formal mediation desk for farmers, investors, and veterinarians. Ring-fence escrow until resolution.
          </p>
        </div>

        <button
          onClick={() => setShowFileModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          id="btn_open_file_dispute_modal"
        >
          <Plus className="w-4 h-4" />
          <span>File a Dispute</span>
        </button>
      </div>

      {showFileModal && (
        <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              Lodge Formal Cooperative Dispute
            </h4>
            <button
              onClick={() => setShowFileModal(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          {fileError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {fileSuccess && (
            <div className="p-3 text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{fileSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFileDispute} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dispute Summary / Title
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unrepaired pasture boundary / Delayed milestone"
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  id="dispute_title_input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Partner / Counterpart
                </label>
                <select
                  value={respondentId}
                  onChange={(e) => setRespondentId(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  id="dispute_counterpart_select"
                >
                  <option value="">General Committee Arbitration</option>
                  {partnerships.map((p) => (
                    <option key={p.id} value={user.role === 'investor' ? p.farmerId : p.investorId}>
                      {p.animalType || 'Partnership'} ({p.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Grievance & Facts
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the breach of agreement, missing inputs, clinical concern, or payment discrepancy..."
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                id="dispute_reason_textarea"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Upload Supporting Evidence (Photo or Document)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                  className="p-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer flex-1"
                  id="dispute_evidence_file_input"
                />
                {evidenceFile && (
                  <span className="text-[11px] text-emerald-600 font-bold">Attached</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting || busy}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                id="dispute_submit_btn"
              >
                {isSubmitting ? 'Filing Case...' : 'Submit Dispute & Lock Escrow'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Your Active Cases & Arbitration Status ({disputes.length})
        </h4>

        {disputes.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl dark:border-slate-800 overflow-hidden">
            {disputes.map((d, i) => (
              <div key={d.id || i} className="p-4 bg-white dark:bg-slate-900 text-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{d.title || 'Dispute Case'}</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{d.reason}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                    d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                    d.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {d.status}
                  </span>
                </div>

                {d.evidenceUrls && d.evidenceUrls.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Attached Evidence:</span>
                    {d.evidenceUrls.map((url, uidx) => (
                      <a
                        key={uidx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Evidence Doc {uidx + 1}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No dispute cases filed. If you encounter a breach of terms, use the "File a Dispute" button above.
          </div>
        )}
      </div>
    </section>
  );
};
