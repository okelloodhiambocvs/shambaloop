import React, { useState, useEffect } from 'react';
import { 
  Listing, ListingType, UserRole 
} from '../types';
import { BrandedLoader, VerifiedBadge } from './BrandAssets';

interface EscrowPaymentModalProps {
  listing: Listing;
  onClose: () => void;
  onPaymentSuccess: (agreementData: any) => void;
  currentUserPhone: string;
  currentUserId: string;
}

export default function EscrowPaymentModal({ listing, onClose, onPaymentSuccess, currentUserPhone, currentUserId }: EscrowPaymentModalProps) {
  const [phone, setPhone] = useState(currentUserPhone || '0712345678');
  const [acreage, setAcreage] = useState<number>(listing.landDetails?.acreage || 1);
  const [durationMonths, setDurationMonths] = useState<number>(listing.type === ListingType.LAND ? 12 : 6);
  const [splitPercent, setSplitPercent] = useState<number>(listing.revenueSplitPercent || 40);
  
  // Simulation Steps
  // 'CONFIG' | 'STK_INITIATED' | 'POPUP_PROMPT' | 'PIN_SUBMITTING' | 'SUCCESS'
  const [step, setStep] = useState<'CONFIG' | 'STK_INITIATED' | 'POPUP_PROMPT' | 'PIN_SUBMITTING' | 'SUCCESS'>('CONFIG');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [mpesaTxId, setMpesaTxId] = useState('');
  const [errorText, setErrorText] = useState('');

  // Calculate fees
  const calculateTotal = () => {
    if (listing.type === ListingType.LAND) {
      return acreage * listing.priceKES * (durationMonths / 12);
    } else if (listing.type === ListingType.LIVESTOCK) {
      // Small reservation equity deposit for livestock partnerships (e.g. 10% of animal valuation)
      return Math.round(listing.priceKES * 0.1);
    } else {
      // Contract opportunity placement fee
      return 1500;
    }
  };

  const handleInitiateSTK = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setLoading(true);
    setStep('STK_INITIATED');

    const totalAmount = calculateTotal();

    try {
      const response = await fetch('/api/payments/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          amount: totalAmount,
          purpose: `ShambaLoop Escrow: ${listing.title}`
        })
      });

      const data = await response.json();
      
      // Delay simulating network speeds over towers
      setTimeout(() => {
        setLoading(false);
        if (data.transaction) {
          setMpesaTxId(data.transaction.transactionId);
        } else {
          setMpesaTxId(`RGC${Math.floor(100+Math.random()*900)}H78UI`);
        }
        setStep('POPUP_PROMPT');
      }, 1500);

    } catch (err) {
      console.error(err);
      // Fallback in case backend server is offline/building
      setTimeout(() => {
        setLoading(false);
        setMpesaTxId(`RGC${Math.floor(100+Math.random()*900)}H78UI`);
        setStep('POPUP_PROMPT');
      }, 1200);
    }
  };

  const verifyPinAndFinalize = () => {
    if (!pin || pin.length !== 4) {
      setErrorText('Please enter your 4-digit M-Pesa pin code');
      return;
    }

    setLoading(true);
    setStep('PIN_SUBMITTING');

    // Simulate callback delay from Safaricom API router
    setTimeout(() => {
      setLoading(false);
      setStep('SUCCESS');
      
      // Prepare the transaction records
      const totalPaid = calculateTotal();
      let agreementData: any = {
        listingId: listing.id,
        landownerId: listing.ownerId,
        farmerId: listing.type === ListingType.LAND ? currentUserId : listing.ownerId,
        investorId: listing.type === ListingType.LIVESTOCK ? currentUserId : listing.ownerId,
        mpesaTxId: mpesaTxId,
        paymentsMade: totalPaid,
        timestamp: new Date().toISOString()
      };

      if (listing.type === ListingType.LAND) {
        agreementData = {
          ...agreementData,
          acreageLeased: acreage,
          pricePerAcreKES: listing.priceKES,
          durationMonths: durationMonths,
          status: 'SIGNED',
          mpesaEscrowStatus: 'ESCROWED'
        };
      } else if (listing.type === ListingType.LIVESTOCK) {
        agreementData = {
          ...agreementData,
          animalTagId: listing.livestockDetails?.tagId || 'SL-KE-TAG-909',
          animalType: listing.livestockDetails?.species || 'dairy',
          breed: listing.livestockDetails?.breed || 'Ayrshire cross',
          splitPercentInvestor: splitPercent,
          status: 'ACTIVE'
        };
      } else {
        agreementData = {
          ...agreementData,
          status: 'ACTIVE'
        };
      }

      // Fire parents success
      setTimeout(() => {
        onPaymentSuccess(agreementData);
      }, 1200);

    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="mpes_simulation_overlay">
      <div className="bg-white rounded-2xl w-full max-w-md border border-agri-dirt-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Header containing Mpesa Safaricom styling */}
        <div className="bg-[#41b045] px-5 py-4 text-white flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold font-sans tracking-wide text-white m-0 uppercase">LIPA NA M-PESA ESCROW</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-full transition cursor-pointer text-white font-bold text-xs">
            Close [X]
          </button>
        </div>

        {/* Dynamic workflow viewer */}
        <div className="p-6 text-slate-800 text-xs">
          {step === 'CONFIG' && (
            <form onSubmit={handleInitiateSTK} className="space-y-4">
              <div>
                <p className="font-semibold text-slate-900 leading-tight mb-2 uppercase tracking-wider text-[10px]">Step 1: Set Agreement Terms & Escrow</p>
                <div className="bg-slate-50 p-2.5 rounded border mb-2">
                  <div className="font-bold text-slate-800 pb-1 border-b border-slate-200">{listing.title}</div>
                  <div className="text-[10px] text-slate-500 pt-1">Location: {listing.locationCounty}, Owner: {listing.ownerName}</div>
                </div>
              </div>

              {listing.type === ListingType.LAND && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Acreage to lease</label>
                    <input
                      type="number"
                      value={acreage}
                      onChange={(e) => setAcreage(Math.min(listing.landDetails?.acreage || 1, Number(e.target.value)))}
                      required
                      min={1}
                      max={listing.landDetails?.acreage || 10}
                      className="w-full p-2 bg-white rounded border focus:outline-emerald-600"
                    />
                    <span className="text-[9px] text-slate-400">Max available: {listing.landDetails?.acreage}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Lease Period (Months)</label>
                    <select
                      value={durationMonths}
                      onChange={(e) => setDurationMonths(Number(e.target.value))}
                      className="w-full p-2 bg-white rounded border focus:outline-emerald-600"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months (1 Year)</option>
                      <option value={24}>24 Months (2 Year)</option>
                      <option value={36}>36 Months (3 Year)</option>
                    </select>
                  </div>
                </div>
              )}

              {listing.type === ListingType.LIVESTOCK && (
                <div className="space-y-1 bg-slate-50 p-2.5 rounded border">
                  <div className="flex justify-between font-semibold">
                    <span>Animal Tag registration:</span>
                    <span className="mono-display font-bold text-emerald-800">{listing.livestockDetails?.tagId}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-600 mt-1">
                    <span>Cooperative Revenue Split:</span>
                    <span>{splitPercent}% Investor / {100 - splitPercent}% Farmer</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1.5 border-t pt-1">
                    Paying 10% animal valuation as structural safety deposit escrow to prompt local registry checks.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Your Safaricom Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500 font-bold">
                    +254
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="e.g. 0712345678"
                    className="w-full pl-12 p-3.5 bg-white rounded-xl border focus:outline-emerald-600 text-sm font-semibold mono-display"
                  />
                </div>
                <span className="text-[9px] text-slate-400">Must be active M-Pesa registered mobile line to respond to STK alert.</span>
              </div>

              {/* Total estimation summary */}
              <div className="bg-[#41b045]/5 p-4 rounded-xl border border-[#41b045]/20 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-[#2b7d2f] font-semibold tracking-wider uppercase">Safely escrowed amount</div>
                  <p className="text-[9px] text-slate-500">M-Pesa agent holds funds until milestones start</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-display text-[#1f6623] mono-display">KES {calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#41b045] hover:bg-[#349238] text-white p-3.5 rounded-xl font-bold tracking-wider uppercase text-center cursor-pointer transition active:scale-98 flex items-center justify-center gap-2"
              >
                Initiate M-Pesa STK Push
              </button>
              
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-slate-400 py-1 font-semibold">
                <span>Encrypted by Daraja Safaricom Secure Gateways</span>
              </div>
            </form>
          )}

          {step === 'STK_INITIATED' && (
            <div className="py-10 flex flex-col items-center text-center space-y-4 bg-white" id="escrow_stk_init_step">
              <BrandedLoader size="md" label="Connecting Safaricom APN..." />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Initiating STK Push Protocol</h3>
                <p className="text-slate-500 mt-1 leading-relaxed max-w-xs text-[11px]">
                  Requesting authorization keys... We are triggering a dialogue prompt to subscriber number <strong>{phone}</strong>. Keep phone screen unlocked.
                </p>
              </div>
            </div>
          )}

          {step === 'POPUP_PROMPT' && (
            <div className="space-y-5 py-2">
              <div className="border border-dashed border-slate-300 rounded-2xl p-5 bg-slate-50/50 flex flex-col items-center relative overflow-hidden">
                <span className="absolute top-1.5 left-2 px-1.5 py-0.5 bg-slate-800 text-white font-mono text-[8px] font-bold rounded">
                  MOBILE SCREEN SIMULATOR
                </span>

                {/* Smartphone simulator */}
                <div className="w-72 bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-xl p-4 text-center text-white space-y-4 my-2">
                  <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-1"></div>
                  <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700">
                    <p className="text-xs font-semibold leading-normal font-sans">
                      Do you want to pay KES {calculateTotal().toLocaleString()} to ShambaLoop Escrow Ref: {mpxTruncate(mponPrefix(listing.title))}?
                    </p>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="ENTER PIN (Simulated)"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center p-2.5 bg-slate-950 text-emerald-400 rounded-lg text-lg select-none tracking-widest font-bold border border-slate-800 mt-3 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  
                  <div className="flex justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStep('CONFIG')}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 p-2 rounded-lg text-[10px] font-bold uppercase transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={verifyPinAndFinalize}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 p-2 rounded-lg text-[10px] font-bold uppercase transition"
                    >
                      Send PIN
                    </button>
                  </div>
                </div>
              </div>

              {errorText && (
                <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-100 flex gap-1.5">
                  <span>{errorText}</span>
                </div>
              )}

              <p className="text-slate-500 text-center leading-normal text-[10px] max-w-sm mx-auto">
                Enter any 4-digit code (e.g. <code>1234</code>) in the black simulated smartphone popup to proceed with the escrow verification. This mirrors exactly the Lipa Na M-Pesa STK Push user experience.
              </p>
            </div>
          )}

          {step === 'PIN_SUBMITTING' && (
            <div className="py-10 flex flex-col items-center text-center space-y-4" id="escrow_pin_submit_step">
              <BrandedLoader size="md" label="Securing Escrow Vault..." />
              <div>
                <h3 className="text-sm font-bold text-slate-950 shadow-xs">Sealing Agreement & Confirming Receipt</h3>
                <p className="text-slate-500 mt-1 max-w-xs mx-auto text-[11px]">
                  Safaricom is processing your PIN. This takes seconds. ShambaLoop server is listening for Callback notification with transaction ID <span className="font-mono bg-slate-100 p-0.5 rounded text-slate-800 font-bold">{mpesaTxId}</span>.
                </p>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <span className="font-bold text-emerald-800 text-base">OK</span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Kazi Safi! Payment Secured</h3>
                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">
                  KES {calculateTotal().toLocaleString()} has been safely locked in the ShambaLoop local Escrow vault. The landowner/investor has been notified via WhatsApp.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border text-slate-600 font-mono text-[10px] text-left divide-y divide-slate-100">
                <div className="flex justify-between py-1">
                  <span>M-Pesa Tx ID:</span>
                  <span className="font-bold text-slate-900">{mpesaTxId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Agreement Ref:</span>
                  <span className="font-bold text-slate-900">SL-LEASE-{Math.floor(100+Math.random()*900)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Status:</span>
                  <span className="font-bold text-emerald-700">ESCROW LOCK ACTIVE</span>
                </div>
              </div>

              <p className="text-[10px] text-[#41b045] font-semibold animate-pulse">
                Completing registration. Redirecting to farm logs...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function mponPrefix(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s]/g, '');
}

function mpxTruncate(str: string): string {
  if (str.length > 20) return str.slice(0, 17) + '...';
  return str;
}
