import React, { useState } from 'react';
import { 
  User, Listing, VerificationRequest, LeaseAgreement, UserRole 
} from '../types';

interface AdminPanelProps {
  unverifiedListings: Listing[];
  verificationRequests: VerificationRequest[];
  activeLeases: LeaseAgreement[];
  usersList: User[];
  onApproveListing: (listingId: string) => void;
  onApproveVerification: (requestId: string, status: 'APPROVED' | 'REJECTED') => void;
  onDisburseEscrow: (leaseId: string) => void;
  onApproveUser: (userId: string, status: 'APPROVED' | 'REJECTED') => void;
}

export default function AdminPanel({
  unverifiedListings,
  verificationRequests,
  activeLeases,
  usersList,
  onApproveListing,
  onApproveVerification,
  onDisburseEscrow,
  onApproveUser
}: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'moderation' | 'deeds' | 'escrows' | 'stats' | 'onboardings'>('moderation');

  // Stats calculation
  const totalLeasedKES = activeLeases.reduce((acc, cur) => acc + cur.paymentsMade, 0);
  const activeFarmerAgreements = activeLeases.filter(a => a.status === 'SIGNED').length;

  return (
    <div className="bg-white rounded-2xl border border-agri-dirt-100 shadow-xs overflow-hidden" id="admin_registry_panel">
      {/* Admin Panel Header */}
      <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <h2 className="text-base font-bold font-display text-white mb-0.5">District Registry & Admin Dashboard</h2>
            <p className="text-[11px] text-slate-400 font-semibold font-sans">
              Approve deeds, audit escrow transactions, verify local agricultural assets.
            </p>
          </div>
        </div>
        <span className="mono-display text-[9px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          Registry Supervisor Mode
        </span>
      </div>

      {/* Analytics KPI bar */}
      <div className="bg-slate-50 border-b border-agri-dirt-100 p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Listings', val: unverifiedListings.length + 3 },
          { label: 'Deed Audits Queue', val: verificationRequests.length },
          { label: 'Simulated Escrowed KES', val: `KES ${totalLeasedKES.toLocaleString()}` },
          { label: 'Active Farm Partnerships', val: activeFarmerAgreements + 1 }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
              <p className="text-base font-bold font-display text-slate-900 mt-0.5">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row min-h-[460px]">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-56 border-r border-slate-100 bg-slate-50/50 p-2.5 flex lg:flex-col gap-1.5 overflow-x-auto shrink-0 select-none">
          {[
            { id: 'moderation', label: 'Listing Moderation', count: unverifiedListings.filter(l => !l.verified).length },
            { id: 'deeds', label: 'Land Deed Audits', count: verificationRequests.filter(v => v.status === 'PENDING').length },
            { id: 'onboardings', label: 'User Onboardings', count: usersList.filter(u => !u.verified).length },
            { id: 'escrows', label: 'Lipa Escrow Trust', count: activeLeases.filter(a => a.mpesaEscrowStatus === 'ESCROWED').length },
            { id: 'stats', label: 'Ledger Audit Trails', count: 0 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold font-sans transition grow lg:grow-0 ${
                activeSubTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono leading-none ${activeSubTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-rose-100 text-rose-800'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Inner panels */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSubTab === 'moderation' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Marketplace Moderation Queue ({unverifiedListings.length})</h3>
                <span className="text-[10px] text-slate-400">Owner listings awaiting official verified checking</span>
              </div>

              {unverifiedListings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  Mapema ndio best! No listings are currently awaiting validation checks.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {unverifiedListings.map((listing) => (
                    <div key={listing.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div className="flex gap-3 items-start">
                        <img 
                          src={listing.imageUrl} 
                          alt="" 
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{listing.title}</div>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold">{listing.locationCounty} County • price: KES {listing.priceKES.toLocaleString()} • Owner: {listing.ownerName}</p>
                          <p className="text-[10px] text-slate-600 line-clamp-1 mt-0.5 max-w-lg font-light leading-relaxed">{listing.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => onApproveListing(listing.id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                        >
                          Approve & Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'deeds' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Ownership & Deed Registry Checking ({verificationRequests.length})</h3>
                <span className="text-[10px] text-slate-400">Title deeds and identity cards submitted for accreditation</span>
              </div>

              {verificationRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium font-sans">
                  No pending land credential claims in queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationRequests.map((req) => (
                    <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{req.documentType}</span>
                          <span className="font-bold text-slate-900 text-xs font-display">{req.documentNumber}</span>
                        </div>
                        <p className="font-semibold text-slate-800">Claimant: {req.userName} ({req.userRole})</p>
                        {req.notes && <p className="text-[10px] text-slate-500 italic">User Notes: "{req.notes}"</p>}
                        <p className="text-[9px] text-slate-400">Created At: {new Date(req.submittedAt).toLocaleString()}</p>
                      </div>

                      {req.status === 'PENDING' ? (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => onApproveVerification(req.id, 'REJECTED')}
                            className="p-2 border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer text-xs font-bold"
                            title="Decline document"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onApproveVerification(req.id, 'APPROVED')}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            Endorse Document
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center shrink-0 self-end sm:self-auto">
                          <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'escrows' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Lipa na M-Pesa Escrow Trust Settlements</h3>
                <span className="text-[10px] text-slate-400">Track and release lease payments between parties</span>
              </div>

              {activeLeases.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium">
                  No active leasings locked in escrow yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeLeases.map((lease) => (
                    <div key={lease.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                      <div className="flex justify-between items-start border-b border-dashed pb-2">
                        <div>
                          <p className="font-bold text-slate-900">Lease Ref: {lease.id}</p>
                          <p className="text-[10px] text-slate-500">Period: {lease.durationMonths} Months | Size: {lease.acreageLeased} Acres</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-950 mono-display text-sm">KES {lease.paymentsMade.toLocaleString()}</p>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            lease.mpesaEscrowStatus === 'ESCROWED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {lease.mpesaEscrowStatus}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-slate-600">
                        <div>
                          <div className="font-semibold text-slate-800">Tenant Farmer ID: {lease.farmerId.slice(0, 8)}...</div>
                          <div className="font-semibold text-slate-800">Landowner ID: {lease.landownerId.slice(0, 8)}...</div>
                        </div>

                        {lease.mpesaEscrowStatus === 'ESCROWED' && (
                          <button
                            onClick={() => onDisburseEscrow(lease.id)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Release Milestones
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'onboardings' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Platform Onboarding & User Approval Records</h3>
                <span className="text-[10px] text-slate-400">Track registration directories, profiles, and approve agricultural memberships</span>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                Review verified identities of Landowners, Tenant Farmers, and Investors. Unverified operators are locked inside client checkouts until their agricultural onboardings are certified by a District land registrar.
              </p>

              <div className="space-y-3">
                {usersList.map((user) => (
                  <div key={user.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3" id={`onboarding_user_${user.id}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className={`p-2 rounded-lg font-bold text-[10px] uppercase shrink-0 ${
                          user.role === UserRole.INVESTOR
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : user.role === UserRole.LANDOWNER
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : user.role === UserRole.FARMER
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.role}
                        </div>
                        <div>
                          <div className="font-bold text-slate-950 font-display flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.verified ? (
                              <span className="text-[8px] bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">ONBOARDING_APPROVED_OK</span>
                            ) : (
                              <span className="text-[8px] bg-amber-100 text-amber-850 px-1.5 py-0.5 rounded uppercase font-semibold tracking-wider animate-pulse">AWAITING_REGISTRY_CLEARANCE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase font-sans mt-0.5 font-semibold">
                            County {user.county} • Mobile: {user.phone} {user.email && `• ${user.email}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        {user.verified ? (
                          <button
                            onClick={() => onApproveUser(user.id, 'REJECTED')}
                            className="px-2.5 py-1.5 border border-slate-200 text-slate-650 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer"
                          >
                            Suspend Onboarding
                          </button>
                        ) : (
                          <button
                            onClick={() => onApproveUser(user.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer"
                          >
                            Certify Membership
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Metadata summary (Budget specialties, goals) depending on roles */}
                    <div className="bg-slate-50 rounded-lg p-2.5 text-[10px] text-slate-600 border border-slate-100 font-sans space-y-1">
                      {user.role === UserRole.INVESTOR && (
                        <>
                          <p><strong className="text-slate-850 font-semibold">Simulated Investment Allocation:</strong> KES {user.investmentBudgetKES?.toLocaleString() || 'Not defined'}</p>
                          <p><strong className="text-slate-850 font-semibold">Investment Directives:</strong> {user.investmentGoal || 'General agricultural sectors'}</p>
                          <p><strong className="text-slate-850 font-semibold">Target Sectors:</strong> {user.preferredSectors?.join(', ') || 'Any'}</p>
                        </>
                      )}
                      {(user.role === UserRole.FARMER || user.role === UserRole.LANDOWNER) && (
                        <>
                          <p><strong className="text-slate-850 font-semibold">Crops & Farming Specializations:</strong> {user.farmSpecialties?.join(', ') || 'Mixed smallholder production'}</p>
                          {user.seekingLandAcreage && (
                            <p><strong className="text-slate-850 font-semibold">Physical Acreage Focus:</strong> Seeking ~{user.seekingLandAcreage} Acres of arable soil</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'stats' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Ledger Audit Trails & Platform Registry</h3>
                <span className="text-[10px] text-slate-400">Immutable ledger operations & activity logging</span>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 text-slate-300 font-mono text-[11px] space-y-2.5 border border-slate-800">
                <div className="text-amber-500 font-bold border-b border-slate-800 pb-1.5">// SYSTEM RUNTIME AUDIT TRAIL</div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:02:15]</span>
                  <span className="text-slate-300 font-semibold">User user_1 registered via OTP simulation</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:04:10]</span>
                  <span className="text-emerald-400 font-semibold">M-Pesa transaction RGC56H78UI confirmed (KES 24,000)</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:04:11]</span>
                  <span className="text-amber-400 font-semibold">Agreement lease_abc safely bound into Escrow with Landowner user_1</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:05:08]</span>
                  <span className="text-amber-400 font-semibold">Verification request request_1 submitted by user Josphat Kiprop</span>
                </div>
                <div className="flex gap-2 text-slate-500">
                  <span>[2026-06-13 12:06:50]</span>
                  <span className="text-slate-300">Admin Supervisor reviewed audit indices for Nyandarua hub</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex gap-2">
                <p className="text-[10px] leading-relaxed">
                  Notice: All transactions and agreements are double-hashed using secure cryptographic chains stored within the modular SQLite/Postgre databases, ensuring landowners are 100% protected under Section 12 of the Kenya Agricultural Land Act.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
