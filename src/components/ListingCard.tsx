import React from 'react';
import { 
  Listing, ListingType, UserRole 
} from '../types';
import { VerifiedBadge } from './BrandAssets';
import { WorkflowTooltip } from './WorkflowTooltip';

interface ListingCardProps {
  listing: Listing;
  onAction: (listing: Listing) => void;
  currentUserRole?: UserRole;
}

export default function ListingCard({ listing, onAction, currentUserRole }: ListingCardProps) {
  const getBadgeColor = (type: ListingType) => {
    switch (type) {
      case ListingType.LAND:
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case ListingType.LIVESTOCK:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case ListingType.OPPORTUNITY:
        return 'bg-yellow-50 text-amber-900 border-yellow-200';
    }
  };

  const getLabel = (type: ListingType) => {
    switch (type) {
      case ListingType.LAND:
        return 'Land for Lease';
      case ListingType.LIVESTOCK:
        return 'Livestock Partnership';
      case ListingType.OPPORTUNITY:
        return 'Farming Opportunity';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-agri-dirt-100 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden" id={`listing_card_${listing.id}`}>
      {/* Listing Image banner */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover transition duration-300 hover:scale-[1.03]"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        {/* Type Badge */}
        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${getBadgeColor(listing.type)} shadow-xs`}>
          {getLabel(listing.type)}
        </span>

        {/* Verification Status Banner */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none select-none">
          {listing.verified ? (
            <VerifiedBadge type="listing" showLabel={true} className="!bg-[#1F6B3D] !text-white !border-none shadow-md backdrop-blur-md px-3 font-extrabold uppercase !text-[9px] tracking-wider" />
          ) : (
            <span className="px-2.5 py-1 bg-[#D4A017] text-white text-[9px] font-extrabold tracking-wider uppercase rounded-full shadow-md leading-none border-none">
              In Verification Queue
            </span>
          )}
        </div>

        {/* Price Tag Overlay at the bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
          <div className="text-xs text-slate-100 font-semibold uppercase tracking-wider">Estimated Cost / Split</div>
          <div className="text-lg font-bold font-display flex items-baseline gap-1">
            <span className="mono-display text-agri-gold-500">KES {listing.priceKES.toLocaleString()}</span>
            <span className="text-[11px] text-slate-200 font-normal">
              {listing.type === ListingType.LAND ? '/ acre / year' : 
               listing.type === ListingType.LIVESTOCK ? `(${listing.revenueSplitPercent}% Split)` : '/ month'}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* County / location and Date posting details */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <span>{listing.locationCounty} County, Kenya</span>
            </div>
            <span className="mono-display text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
              {new Date(listing.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight line-clamp-1">{listing.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">{listing.description}</p>

          {/* Conditional modules depending on sub-types */}
          {listing.type === ListingType.LAND && listing.landDetails && (
            <div className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-800 flex items-center gap-1">
                  Total Farm Size:
                </span>
                <span className="mono-display text-slate-900">{listing.landDetails.acreage} Acres</span>
              </div>
              <div className="flex justify-between">
                <span>Soil type:</span>
                <span className="font-semibold">{listing.landDetails.soilType || 'Soil not analysed yet'}</span>
              </div>
              <div className="flex justify-between">
                <span>Water access:</span>
                <span className="font-semibold">{listing.landDetails.waterSource}</span>
              </div>
              <div className="flex justify-between flex-wrap gap-1 mt-1 pt-1.5 border-t border-amber-100/60">
                <span className="text-[10px] text-amber-800 font-semibold w-full">Best crops to grow:</span>
                {listing.landDetails.idealCrops.map((crop, idx) => (
                  <span key={idx} className="bg-amber-200/50 px-2 py-0.5 rounded text-[10px] text-amber-900 font-medium">
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          )}

          {listing.type === ListingType.LIVESTOCK && listing.livestockDetails && (
            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-800 flex items-center gap-1">
                  Animal ID tag:
                </span>
                <span className="mono-display bg-white px-1.5 py-0.5 rounded border border-emerald-100 text-slate-950 font-bold">{listing.livestockDetails.tagId}</span>
              </div>
              <div className="flex justify-between">
                <span>Breed:</span>
                <span className="font-semibold">{listing.livestockDetails.breed}</span>
              </div>
              <div className="flex justify-between">
                <span>Expected Output:</span>
                <span className="font-semibold text-emerald-900">{listing.livestockDetails.expectedYield || 'Not documented'}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] bg-emerald-100/40 p-1.5 rounded mt-1">
                <span className="font-bold text-emerald-800">Profit Agreement:</span>
                <span className="font-medium text-slate-800 truncate max-w-[150px]">{listing.livestockDetails.revenueShareConfig}</span>
              </div>
            </div>
          )}

          {listing.type === ListingType.OPPORTUNITY && listing.opportunityDetails && (
            <div className="bg-amber-50/30 p-2.5 rounded-lg border border-amber-100 text-xs space-y-1.5 text-slate-700">
              <div className="flex justify-between font-semibold">
                <span className="text-amber-800 flex items-center gap-1">
                  Compensation Model:
                </span>
                <span className="bg-amber-100 px-1.5 py-0.5 text-amber-900 text-[10px] uppercase font-bold rounded">
                  {listing.opportunityDetails.compensationType}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duration Contract:</span>
                <span className="font-semibold text-slate-900">{listing.opportunityDetails.durationMonths} Months</span>
              </div>
              <div className="flex justify-between flex-wrap gap-1 mt-1 pt-1 border-t border-amber-100/60">
                <span className="text-[10px] text-amber-800 font-semibold w-full">Required Experience:</span>
                {listing.opportunityDetails.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="bg-amber-200/40 px-1.5 py-0.5 rounded text-[10px] text-amber-900 font-normal">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Owner information & leasing CTA */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            {/* Owner profile */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-[11px]">
                {listing.ownerName ? listing.ownerName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="font-semibold text-slate-800 truncate max-w-[100px]">{listing.ownerName}</div>
                <div className="text-[10px] text-slate-400 capitalize">Land Owner</div>
              </div>
            </div>

            {/* Direct owner phone calling contact feedback */}
            <a 
              href={`tel:${listing.ownerPhone}`} 
              className="p-1 px-2 border border-slate-200 rounded-full hover:bg-slate-50 transition flex items-center gap-1 text-slate-600 font-medium"
              title="Call advertiser"
            >
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mr-1">Tel:</span>
              <span className="mono-display text-[10px] font-bold">{listing.ownerPhone}</span>
            </a>
          </div>

          {/* Workflow guide tooltip next to action button */}
          <div className="flex items-center justify-between text-[10px] bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
            <span className="text-slate-500 dark:text-slate-400 font-medium font-sans flex items-center gap-1">
              <span>Workflow Guide:</span>
              <span className="text-slate-700 dark:text-slate-200 font-bold">
                {listing.type === ListingType.LAND ? 'Land Leasing' : 
                 listing.type === ListingType.LIVESTOCK ? 'Shared Livestock' : 'Opportunity contract'}
              </span>
            </span>
            <WorkflowTooltip 
              role={currentUserRole || UserRole.FARMER} 
              actionType={
                listing.type === ListingType.LAND ? 'propose_lease' : 
                listing.type === ListingType.LIVESTOCK ? 'partner_equity' : 'pitch_investor'
              } 
              align="right"
              buttonLabel="View Steps"
            />
          </div>

          <button
            onClick={() => onAction(listing)}
            className="w-full font-display font-bold text-xs leading-none uppercase tracking-wide tracking-wider cursor-pointer bg-agri-green-900 hover:bg-agri-green-800 text-white p-3.5 rounded-xl shadow-xs transition hover:translate-y-[-1px] text-center"
          >
            {listing.type === ListingType.LAND ? 'Start Lease Request' : 
             listing.type === ListingType.LIVESTOCK ? 'Submit Partnership Draft' : 'Apply For Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}
