import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Plus, Calendar, Tag } from 'lucide-react';
import { User, UploadedFile, FarmRecord } from '../../types';
import { sharedWorkspaceApi, readFileAsBase64 } from '../../services/sharedWorkspaceService';

interface FmsTabProps {
  user: User;
  records: FarmRecord[];
  documents: UploadedFile[];
  participantFarmIds: string[];
  busy: boolean;
  onRefresh: () => Promise<void>;
  act: (fn: () => Promise<void>, msg?: string) => Promise<void>;
}

export const FmsTab: React.FC<FmsTabProps> = ({
  user,
  records,
  documents,
  participantFarmIds,
  busy,
  act,
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const targetFarmId = participantFarmIds[0] || `farm_${user.id}`;

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadError('');
    setUploadSuccess('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    const documentType = String(formData.get('documentType') || 'OTHER');
    const description = String(formData.get('description') || '');

    if (!file || !file.size) {
      setUploadError('Please select a valid image or document file.');
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await readFileAsBase64(file);
      const res = await sharedWorkspaceApi.upload({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
        farmId: targetFarmId,
        documentType: documentType as any,
        description,
      });

      if (res.error) {
        setUploadError(res.error);
      } else {
        setUploadSuccess('Document successfully uploaded and verified in archive.');
        form.reset();
        await act(async () => {}, 'Archive synchronized');
        setTimeout(() => setShowUploadModal(false), 1200);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="space-y-6" id="fms_workspace_tab">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Farm Management System & Document Archive</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain operational logs, input receipts, soil tests, and certified veterinary records.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          id="btn_open_fms_upload_modal"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Documentation</span>
        </button>
      </div>

      {showUploadModal && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Upload Official Farm Documentation (Images or PDF)
            </h4>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </div>

          {uploadError && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Document Category
              </label>
              <select
                name="documentType"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                <option value="LAND_TITLE_DEED">Title Deed / Registered Lease</option>
                <option value="SOIL_TEST">Soil Analysis & Agro-Assay</option>
                <option value="FEED_RECEIPT">Feed / Inputs Purchase Invoice</option>
                <option value="VACCINATION_REPORT">Vaccination & Herd Health Card</option>
                <option value="VETERINARY_REPORT">Clinical Vet Examination</option>
                <option value="FARM_PHOTO">Field Inspection Photo</option>
                <option value="OTHER">Other Compliance Document</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select File (Images or PDF)
              </label>
              <input
                required
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="w-full p-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                id="fms_file_input"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Reference
              </label>
              <input
                name="description"
                placeholder="e.g. Ol Kalou Plot 2B Soil Ph Test"
                className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={isUploading || busy}
                className="px-5 py-2.5 bg-[#1F6B3D] hover:bg-[#18532f] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                id="fms_submit_upload_btn"
              >
                {isUploading ? 'Uploading...' : 'Confirm & Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Uploaded Documents & Evidence ({documents.length})
        </h4>
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-2"
              >
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {(doc.documentType || 'DOCUMENT').replaceAll('_', ' ')}
                  </span>
                  <h5 className="mt-1 text-xs font-bold text-slate-900 dark:text-white truncate" title={doc.originalName}>
                    {doc.originalName}
                  </h5>
                  {doc.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{doc.description}</p>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-bold underline"
                  >
                    View Document
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No documentation uploaded yet. Use the "Upload Documentation" button above to archive deeds, receipts, or test reports.
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
          Operational Farm Records ({records.length})
        </h4>
        {records.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl dark:border-slate-800 overflow-hidden">
            {records.map((r, i) => (
              <div key={r.id || i} className="p-3 text-xs bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{r.description}</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Category: {r.recordType} • Qty: {r.quantity} {r.unit || ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {r.actualPriceKES ? `KES ${r.actualPriceKES.toLocaleString()}` : ''}
                  </span>
                  <p className="text-[10px] text-slate-400">{r.date || r.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            No operational ledger records logged yet.
          </div>
        )}
      </div>
    </section>
  );
};
