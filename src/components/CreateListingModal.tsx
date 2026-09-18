import React, { useState } from 'react';
import { ListingType } from '../types';
import { LandDetailsFields } from './listing/LandDetailsFields';
import { LivestockDetailsFields } from './listing/LivestockDetailsFields';
import { OpportunityDetailsFields } from './listing/OpportunityDetailsFields';
import { ListingDocumentUploadField } from './listing/ListingDocumentUploadField';
import { readFileAsBase64, sharedWorkspaceApi } from '../services/sharedWorkspaceService';

interface CreateListingModalProps {
  onClose: () => void;
  onSubmit: (listingData: any) => void;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
}

const KENYAN_COUNTIES = [
  'Nyandarua', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Trans Nzoia', 'Nairobi', 'Meru', 'Nyeri', 'Kericho', 'Kakamega'
];

export default function CreateListingModal({
  onClose,
  onSubmit,
  ownerId,
  ownerName,
  ownerPhone,
}: CreateListingModalProps) {
  const [type, setType] = useState<ListingType>(ListingType.LAND);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationCounty, setLocationCounty] = useState('Nyandarua');
  const [priceKES, setPriceKES] = useState<number>(10000);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document upload state
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('LAND_TITLE_DEED');

  // Land specific inputs
  const [acreage, setAcreage] = useState<number>(2);
  const [soilType, setSoilType] = useState('Red Volcanic Loam');
  const [waterSource, setWaterSource] = useState('Borehole');
  const [accessibility, setAccessibility] = useState('Excellent access');
  const [idealCropInput, setIdealCropInput] = useState('');
  const [idealCrops, setIdealCrops] = useState<string[]>(['Potatoes', 'Cabbages']);

  // Livestock specific inputs
  const [species, setSpecies] = useState<'dairy' | 'poultry' | 'goat'>('dairy');
  const [breed, setBreed] = useState('Holstein Friesian Heifer');
  const [tagId, setTagId] = useState(`SL-KE-TAG-${Math.floor(100 + Math.random() * 900)}`);
  const [expectedYield, setExpectedYield] = useState('18 Liters / day');
  const [revenueShareConfig, setRevenueShareConfig] = useState('60% Farmer for management, 40% Investor on calves/milk');
  const [revenueSplitPercent, setRevenueSplitPercent] = useState<number>(40);

  // Opportunity specific inputs
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [expectedWorkforce, setExpectedWorkforce] = useState<number>(2);
  const [compensationType, setCompensationType] = useState<'Salary' | 'Profit-Share' | 'Mixed'>('Profit-Share');
  const [skillInput, setSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Fodder preparation', 'Dairy hygiene']);

  const getDefaultImage = (t: ListingType) => {
    switch (t) {
      case ListingType.LAND:
        return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800';
      case ListingType.LIVESTOCK:
        return 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=800';
      case ListingType.OPPORTUNITY:
        return 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceKES) {
      alert('Tafadhali jaza sehemu zote muhimu (Please fill in all mandatory fields)');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedDocId = '';
      if (documentFile) {
        const base64 = await readFileAsBase64(documentFile);
        const res = await sharedWorkspaceApi.upload({
          fileName: documentFile.name,
          mimeType: documentFile.type,
          base64Data: base64,
          documentType,
        });
        if (res.data?.file?.id) {
          uploadedDocId = res.data.file.id;
        }
      }

      const listingData: any = {
        type,
        title,
        description,
        locationCounty,
        priceKES: Number(priceKES),
        verified: false,
        imageUrl: imageUrl || getDefaultImage(type),
        ownerId,
        ownerName,
        ownerPhone,
        supportingDocumentId: uploadedDocId || undefined,
        supportingDocumentName: documentFile?.name || undefined,
      };

      if (type === ListingType.LAND) {
        listingData.landDetails = { acreage: Number(acreage), soilType, waterSource, accessibility, idealCrops };
      } else if (type === ListingType.LIVESTOCK) {
        listingData.revenueSplitPercent = Number(revenueSplitPercent);
        listingData.livestockDetails = { species, tagId, breed, expectedYield, revenueShareConfig };
      } else if (type === ListingType.OPPORTUNITY) {
        listingData.opportunityDetails = { requiredSkills, durationMonths: Number(durationMonths), expectedWorkforce: Number(expectedWorkforce), compensationType };
      }

      onSubmit(listingData);
    } catch (err: any) {
      alert(err.message || 'Error uploading supporting documents.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Registry Gateway</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publish New Agricultural Asset / Space</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 gap-1">
            {[ListingType.LAND, ListingType.LIVESTOCK, ListingType.OPPORTUNITY].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${type === t ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
              >
                {t === ListingType.LAND ? 'Farm Land' : t === ListingType.LIVESTOCK ? 'Livestock Co-ownership' : 'Labor / Management'}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Asset Title</label>
            <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 5 Acres Prime Fertile Land" className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">County Location</label>
              <select value={locationCounty} onChange={(e) => setLocationCounty(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white">
                {KENYAN_COUNTIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Valuation / Price (KES)</label>
              <input required type="number" min="500" value={priceKES} onChange={(e) => setPriceKES(Number(e.target.value))} className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">Description</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe asset details..." className="w-full p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white" />
          </div>

          {type === ListingType.LAND && (
            <LandDetailsFields acreage={acreage} setAcreage={setAcreage} soilType={soilType} setSoilType={setSoilType} waterSource={waterSource} setWaterSource={setWaterSource} accessibility={accessibility} setAccessibility={setAccessibility} idealCropInput={idealCropInput} setIdealCropInput={setIdealCropInput} idealCrops={idealCrops} setIdealCrops={setIdealCrops} />
          )}
          {type === ListingType.LIVESTOCK && (
            <LivestockDetailsFields species={species} setSpecies={setSpecies} breed={breed} setBreed={setBreed} tagId={tagId} setTagId={setTagId} expectedYield={expectedYield} setExpectedYield={setExpectedYield} revenueSplitPercent={revenueSplitPercent} setRevenueSplitPercent={setRevenueSplitPercent} revenueShareConfig={revenueShareConfig} setRevenueShareConfig={setRevenueShareConfig} />
          )}
          {type === ListingType.OPPORTUNITY && (
            <OpportunityDetailsFields durationMonths={durationMonths} setDurationMonths={setDurationMonths} expectedWorkforce={expectedWorkforce} setExpectedWorkforce={setExpectedWorkforce} compensationType={compensationType} setCompensationType={setCompensationType} skillInput={skillInput} setSkillInput={setSkillInput} requiredSkills={requiredSkills} setRequiredSkills={setRequiredSkills} />
          )}

          <ListingDocumentUploadField documentFile={documentFile} onFileSelect={setDocumentFile} documentType={documentType} onTypeChange={setDocumentType} />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50">
              {isSubmitting ? 'Uploading & Saving...' : 'Save & Publish Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
