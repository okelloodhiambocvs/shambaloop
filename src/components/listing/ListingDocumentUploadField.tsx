import React from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface ListingDocumentUploadFieldProps {
  documentFile: File | null;
  onFileSelect: (file: File | null) => void;
  documentType: string;
  onTypeChange: (type: string) => void;
}

export const ListingDocumentUploadField: React.FC<ListingDocumentUploadFieldProps> = ({
  documentFile,
  onFileSelect,
  documentType,
  onTypeChange,
}) => {
  return (
    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-emerald-600" />
          <span>Upload Supporting Verification Documentation</span>
        </label>
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          Registry Audit
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        Upload supporting ownership or capital documents (e.g. Title deed, Registry lease, Animal pedigree/health card, or Investor brief).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
            Documentation Type
          </label>
          <select
            value={documentType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full p-2 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <option value="LAND_TITLE_DEED">Title Deed / Land Registry Lease</option>
            <option value="LIVESTOCK_CERT">Pedigree / Veterinary Health Card</option>
            <option value="INVESTMENT_VERIFICATION">Investor Proof of Capital / Mandate</option>
            <option value="ID_CARD">National Identification Card</option>
            <option value="OTHER">Other Certified Supporting Evidence</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
            Choose File (Image or PDF)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            className="w-full p-1.5 text-xs bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
            id="listing_supporting_document_input"
          />
        </div>
      </div>

      {documentFile && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Attached: {documentFile.name} ({(documentFile.size / 1024).toFixed(1)} KB)</span>
        </div>
      )}
    </div>
  );
};
