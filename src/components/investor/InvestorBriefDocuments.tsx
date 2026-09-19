import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, UploadCloud } from 'lucide-react';
import type { InvestorCriteria, UploadedFile } from '../../types';
import { readFileAsBase64, sharedWorkspaceApi } from '../../services/sharedWorkspaceService';

interface InvestorBriefDocumentsProps {
  criteria: InvestorCriteria | null;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function InvestorBriefDocuments({ criteria }: InvestorBriefDocumentsProps) {
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!criteria) {
      setDocuments([]);
      return;
    }
    let current = true;
    void sharedWorkspaceApi.myUploads().then((result) => {
      if (!current) return;
      if (result.error) setError('Unable to load your supporting documents. Please refresh and try again.');
      else setDocuments((result.data || []).filter((file) => file.relatedInvestmentBriefId === criteria.id));
    });
    return () => { current = false; };
  }, [criteria]);

  const uploadDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!criteria) {
      setError('Save your investment brief before adding supporting documents.');
      return;
    }

    const form = event.currentTarget;
    const file = new FormData(form).get('file') as File | null;
    if (!file?.size) {
      setError('Choose a PDF, JPG, PNG, or WEBP file to upload.');
      return;
    }
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE_BYTES) {
      setError('Use a PDF, JPG, PNG, or WEBP file no larger than 10 MB.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await sharedWorkspaceApi.upload({
        fileName: file.name,
        mimeType: file.type,
        base64Data: await readFileAsBase64(file),
        relatedInvestmentBriefId: criteria.id,
        documentType: 'INVESTMENT_VERIFICATION',
        description: new FormData(form).get('description')
      });
      if (result.error || !result.data?.file) throw new Error(result.error || 'The document could not be uploaded.');
      setDocuments((current) => [result.data!.file, ...current]);
      form.reset();
      setMessage('Supporting document uploaded securely.');
    } catch (uploadError: any) {
      setError(uploadError.message || 'The document could not be uploaded.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800" aria-labelledby="investor_brief_documents_title">
      <div className="flex items-start gap-2">
        <UploadCloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
        <div>
          <h3 id="investor_brief_documents_title" className="text-xs font-bold text-slate-900 dark:text-white">Supporting documents</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Add private evidence for your investment brief, such as proof of funds, incorporation records, or a project proposal. PDF, JPG, PNG, and WEBP files up to 10 MB are accepted.</p>
        </div>
      </div>

      {!criteria ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Save the investment brief first, then attach supporting documents here.</p>
      ) : (
        <form className="mt-3 space-y-2" onSubmit={uploadDocument}>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200" htmlFor="investment_brief_document_file">Select document</label>
          <input id="investment_brief_document_file" required name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="block w-full text-xs text-slate-600 dark:text-slate-300" />
          <input name="description" maxLength={500} placeholder="What does this document support?" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          <button type="submit" disabled={isUploading} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isUploading ? 'Uploading…' : 'Upload supporting document'}
          </button>
        </form>
      )}

      {(error || message) && <p role={error ? 'alert' : 'status'} className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${error ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'}`}>
        {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}{error || message}
      </p>}

      {criteria && documents.length > 0 && <ul className="mt-3 space-y-2" aria-label="Uploaded supporting documents">
        {documents.map((document) => <li key={document.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/70">
          <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200"><FileText className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" /><span className="truncate">{document.originalName}</span></span>
          <a href={document.url} className="shrink-0 font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400">Download</a>
        </li>)}
      </ul>}
    </section>
  );
}
