import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, Clock, Download, FileCheck, FileText, 
  HelpCircle, ShieldCheck, UploadCloud, AlertCircle 
} from 'lucide-react';
import type { User, UploadedFile } from '../types';
import { sharedWorkspaceApi, readFileAsBase64 } from '../services/sharedWorkspaceService';

interface Props {
  user: User;
  roleType: 'farmer' | 'veterinarian';
}

export default function VerificationDocumentUploader({ user, roleType }: Props) {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const isVet = roleType === 'veterinarian';
  const defaultDocType = isVet ? 'KVB_LICENSE' : 'PASSPORT_PHOTO';
  const [selectedType, setSelectedType] = useState<string>(defaultDocType);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const docOptions = isVet ? [
    { value: 'KVB_LICENSE', label: 'KVB Practicing License (Current Year)' },
    { value: 'DEGREE_CERTIFICATE', label: 'Degree Certificate (BVM / Animal Health)' },
    { value: 'ID_FRONT', label: 'National ID (Front Side)' },
    { value: 'ID_BACK', label: 'National ID (Back Side)' },
    { value: 'PASSPORT_PHOTO', label: 'Passport Photo (Color)' },
    { value: 'OTHER', label: 'Professional Indemnity or Other Certificate' },
  ] : [
    { value: 'PASSPORT_PHOTO', label: 'Passport Photo' },
    { value: 'ID_FRONT', label: 'National ID (Front Side)' },
    { value: 'ID_BACK', label: 'National ID (Back Side)' },
    { value: 'CHIEF_LETTER', label: 'Letter of Introduction from Local Chief' },
    { value: 'FARM_TITLE_DEED', label: 'Land Ownership Proof / Title Deed / Lease' },
    { value: 'AGRICULTURAL_CERTIFICATE', label: 'Agricultural Training / Cooperative Cert' },
    { value: 'OTHER', label: 'Other Farm Supporting Document' },
  ];

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    const res = await sharedWorkspaceApi.myUploads();
    if (res.data) {
      setDocuments(res.data);
    } else if (res.error) {
      // Fallback to empty if not found
      setDocuments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadDocuments();
  }, [user.id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload (JPEG, PNG, or PDF up to 10MB).');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const base64Data = await readFileAsBase64(selectedFile);
      const res = await sharedWorkspaceApi.upload({
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        base64Data,
        documentType: selectedType,
        description: description.trim() || undefined
      });

      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to upload document.');
      }

      setSuccess(`Successfully uploaded ${selectedFile.name}.`);
      setSelectedFile(null);
      setDescription('');
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6" id="verification_document_uploader">
      {/* Header & Verification Status Badge */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl ${user.verified ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'}`}>
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isVet ? 'Veterinary Professional Accreditation' : 'Farmer Identity & Land Documentation'}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  user.verified 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                }`}>
                  {user.verified ? 'Verified & Compliant' : 'Verification Under Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isVet 
                  ? 'Submit your Kenya Veterinary Board (KVB) accreditation and university degrees for regulatory clearance.'
                  : 'Official identification, Chief introductory letter, and land proofs verified by ShambaLoop administrators.'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Uploaded Records</span>
            <strong className="text-xl font-extrabold text-slate-900 dark:text-white">{documents.length}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Upload Form */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <UploadCloud className="h-4 w-4 text-emerald-600" />
          <span>Upload Verification Document or Certification</span>
        </h4>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Document Type</span>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                id="select_doc_type"
              >
                {docOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Reference / License / ID No. (Optional)</span>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. KVB-2026-981 or ID 28471923"
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                id="input_doc_ref"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Select File (PDF, JPG, PNG, or WEBP up to 10MB)</span>
            <input
              required
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950 dark:file:text-emerald-300 cursor-pointer"
              id="input_doc_file"
            />
          </label>

          <button
            disabled={uploading || !selectedFile}
            type="submit"
            className="action-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold uppercase tracking-wider disabled:opacity-50"
            id="btn_submit_verification_doc"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{uploading ? 'Encrypting and Uploading...' : 'Upload Document to Records'}</span>
          </button>
        </form>
      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            <span>Your Submitted Documentation ({documents.length})</span>
          </h4>
          <span className="text-[11px] text-slate-400">Stored with SHA-256 audit tracking</span>
        </div>

        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500">Loading documentation files...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No verification documents on file yet.</p>
            <p className="text-[11px] text-slate-400">Upload your ID cards, licenses, or letters above to maintain compliant verified status.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map(doc => (
              <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{doc.originalName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {doc.documentType.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                      {doc.description && (
                        <>
                          <span>•</span>
                          <span className="italic">{doc.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                  <a
                    href={doc.url}
                    download={doc.originalName}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition"
                    title="Download document"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
