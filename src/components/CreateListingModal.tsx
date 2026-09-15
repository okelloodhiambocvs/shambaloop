import React, { useState } from 'react';
import { ListingType, LandDetails, LivestockDetails, OpportunityDetails } from '../types';

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

export default function CreateListingModal({ onClose, onSubmit, ownerId, ownerName, ownerPhone }: CreateListingModalProps) {
  const [type, setType] = useState<ListingType>(ListingType.LAND);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationCounty, setLocationCounty] = useState('Nyandarua');
  const [priceKES, setPriceKES] = useState<number>(10000);
  const [imageUrl, setImageUrl] = useState('');
  
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

  const handleAddCrop = () => {
    if (idealCropInput && !idealCrops.includes(idealCropInput)) {
      setIdealCrops([...idealCrops, idealCropInput]);
      setIdealCropInput('');
    }
  };

  const handleAddSkill = () => {
    if (skillInput && !requiredSkills.includes(skillInput)) {
      setRequiredSkills([...requiredSkills, skillInput]);
      setSkillInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !priceKES) {
      alert('Tafadhali jaza sehemu zote muhimu (Please fill in all mandatory fields)');
      return;
    }

    const listingData: any = {
      type,
      title,
      description,
      locationCounty,
      priceKES: Number(priceKES),
      verified: false, // Starts as false prior to admin verification
      imageUrl: imageUrl || getDefaultImage(type),
      ownerId,
      ownerName,
      ownerPhone,
    };

    if (type === ListingType.LAND) {
      listingData.landDetails = {
        acreage: Number(acreage),
        soilType,
        waterSource,
        accessibility,
        idealCrops
      };
    } else if (type === ListingType.LIVESTOCK) {
      listingData.revenueSplitPercent = Number(revenueSplitPercent);
      listingData.livestockDetails = {
        species,
        tagId,
        breed,
        expectedYield,
        revenueShareConfig
      };
    } else if (type === ListingType.OPPORTUNITY) {
      listingData.opportunityDetails = {
        requiredSkills,
        durationMonths: Number(durationMonths),
        expectedWorkforce: Number(expectedWorkforce),
        compensationType
      };
    }

    onSubmit(listingData);
  };

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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="create_listing_modal_viewport">
      <div className="bg-white rounded-2xl w-full max-w-2xl border border-agri-dirt-100 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-agri-green-900 px-6 py-4 flex items-center justify-between text-white select-none">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold font-display text-white m-0">Create Marketplace Listing</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white font-bold text-sm">
            Close [X]
          </button>
        </div>

        {/* Modal Body form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Warning disclaimer about Trust verification */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <div>
              <p className="font-semibold text-amber-900 text-[11px] mb-0.5">ShambaLoop Transparency Accord</p>
              <p className="text-[10px] text-amber-800 leading-relaxed">
                Every listed asset begins with a "Pending Check" status. Local ward authorities or administrators will endorse ownership certificates (title deed details) prior to public syndication.
              </p>
            </div>
          </div>

          {/* Type Picker Selection */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">What are you listing?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: ListingType.LAND, label: 'Lease Land' },
                { type: ListingType.LIVESTOCK, label: 'Livestock Partnership' },
                { type: ListingType.OPPORTUNITY, label: 'Farm Opportunity' }
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setType(item.type)}
                  className={`flex items-center justify-center p-3 rounded-lg border font-semibold transition-all cursor-pointer ${
                    type === item.type
                      ? 'bg-agri-green-50 text-agri-green-900 border-agri-green-600 shadow-xs scale-[1.01]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic standard fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">Listing Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 3-Acre parcel with tea plantation"
                required
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-agri-green-600 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">Kenyan County Hub *</label>
              <select
                value={locationCounty}
                onChange={(e) => setLocationCounty(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-agri-green-600 text-xs"
              >
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c} County</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details about access roads, soil preparation, history, or livestock yield records."
              required
              rows={3}
              className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-agri-green-600 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                {type === ListingType.LAND ? 'Price (KES per Acre / Year) *' : 
                 type === ListingType.LIVESTOCK ? 'Animal Estimated Valuation (KES) *' : 'Monthly Stipend Basis (KES) *'}
              </label>
              <input
                type="number"
                value={priceKES}
                onChange={(e) => setPriceKES(Number(e.target.value))}
                required
                min={1}
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-agri-green-600 text-xs text-agri-green-900 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[10px]">Listing Cover Link (Optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste an Unsplash image link or leave empty for default"
                className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-agri-green-600 text-xs"
              />
            </div>
          </div>

          {/* Conditional Fields: LAND details */}
          {type === ListingType.LAND && (
            <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-100/70 space-y-4">
              <h3 className="text-[11px] font-bold text-amber-900 uppercase tracking-widest border-b border-amber-100/60 pb-1.5 flex items-center gap-1.5">
                SPECIFIC LAND SPECIFICATIONS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Total Acreage *</label>
                  <input
                    type="number"
                    value={acreage}
                    onChange={(e) => setAcreage(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Soil Analysis</label>
                  <input
                    type="text"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    placeholder="e.g. Clay, Red Volcanic, Sandy"
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Water Infrastructure</label>
                  <input
                    type="text"
                    value={waterSource}
                    onChange={(e) => setWaterSource(e.target.value)}
                    placeholder="e.g. Borehole, Gravity stream, rainfed"
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-600">Ideal crops suggestion tagger</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={idealCropInput}
                    onChange={(e) => setIdealCropInput(e.target.value)}
                    placeholder="Type crop e.g., Maize, Onion, Potatoes"
                    className="flex-1 p-2 bg-white rounded border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCrop}
                    className="bg-amber-600 text-white rounded px-3 py-2 font-bold hover:bg-amber-700 transition"
                  >
                    Add
                  </button>
                </div>
                {idealCrops.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {idealCrops.map((c) => (
                      <span key={c} className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <span>{c}</span>
                        <button type="button" onClick={() => setIdealCrops(idealCrops.filter(i => i !== c))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Conditional Fields: LIVESTOCK details */}
          {type === ListingType.LIVESTOCK && (
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 space-y-4">
              <h3 className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest border-b border-emerald-100/60 pb-1.5 flex items-center gap-1.5">
                LIVESTOCK ASSET RECORDS
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Animal Species</label>
                  <select
                    value={species}
                    onChange={(e) => setSpecies(e.target.value as any)}
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  >
                    <option value="dairy">Dairy Cow (Ng'ombe)</option>
                    <option value="poultry">Poultry (Kuku)</option>
                    <option value="goat">Dairy Goat (Mbuzi)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Breed / Pedigree</label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Expected Milking Yield</label>
                  <input
                    type="text"
                    value={expectedYield}
                    onChange={(e) => setExpectedYield(e.target.value)}
                    placeholder="e.g. 20 Liters daily"
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Investor Profit split percentage (%)</label>
                  <input
                    type="number"
                    value={revenueSplitPercent}
                    onChange={(e) => setRevenueSplitPercent(Number(e.target.value))}
                    max={100}
                    min={1}
                    className="w-full p-2 bg-white rounded border border-slate-200 text-xs font-bold text-emerald-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Revenue split contract description</label>
                  <input
                    type="text"
                    value={revenueShareConfig}
                    onChange={(e) => setRevenueShareConfig(e.target.value)}
                    className="w-full p-2 bg-white rounded border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Fields: OPPORTUNITY actions */}
          {type === ListingType.OPPORTUNITY && (
            <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 space-y-4">
              <h3 className="text-[11px] font-bold text-amber-950 uppercase tracking-widest border-b border-amber-100 pb-1.5">
                CONTRACT CO-FARMING OPPORTUNITIES
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Duration (Months)</label>
                  <input
                    type="number"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Required Workforce</label>
                  <input
                    type="number"
                    value={expectedWorkforce}
                    onChange={(e) => setExpectedWorkforce(Number(e.target.value))}
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-600">Payout Model</label>
                  <select
                    value={compensationType}
                    onChange={(e) => setCompensationType(e.target.value as any)}
                    className="w-full p-2 bg-white rounded border border-slate-200"
                  >
                    <option value="Salary">Fixed Salaried / Wages</option>
                    <option value="Profit-Share">Pure Profit-Sharing</option>
                    <option value="Mixed">Mixed (Salary + Bonus)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-600">Required experience badges</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Type e.g., Poultry vaccination, pruning"
                    className="flex-1 p-2 bg-white rounded border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-emerald-600 text-white rounded px-3 py-2 font-bold hover:bg-emerald-700 transition"
                  >
                    Add
                  </button>
                </div>
                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {requiredSkills.map((s) => (
                      <span key={s} className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
                        <span>{s}</span>
                        <button type="button" onClick={() => setRequiredSkills(requiredSkills.filter(i => i !== s))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-agri-green-900 hover:bg-agri-green-800 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              Save Listing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
