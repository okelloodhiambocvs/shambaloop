import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  HelpCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  X
} from 'lucide-react';
import { User, MpesaAccountLink } from '../types.js';

interface MpesaLinkPanelProps {
  currentUser: User;
  token?: string;
  onLinkUpdated?: (link: MpesaAccountLink | null) => void;
  isModal?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function MpesaLinkPanel({
  currentUser,
  token,
  onLinkUpdated,
  isModal = false,
  isOpen = true,
  onClose
}: MpesaLinkPanelProps) {
  const [mpesaLink, setMpesaLink] = useState<MpesaAccountLink | null>(
    currentUser.mpesaLink || null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone || '');
  const [accountHolderName, setAccountHolderName] = useState(currentUser.name || '');
  const [idNumber, setIdNumber] = useState('');
  const [accountType, setAccountType] = useState<'PERSONAL' | 'TILL' | 'PAYBILL'>('PERSONAL');

  const authToken = token || localStorage.getItem('sl_token') || '';

  // Fetch status on mount
  useEffect(() => {
    if (!authToken) return;
    let isMounted = true;
    setLoading(true);
    fetch('/api/wallet/mpesa-link', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.mpesaLink) {
          setMpesaLink(data.mpesaLink);
          setPhoneNumber(data.mpesaLink.phoneNumber);
          setAccountHolderName(data.mpesaLink.accountHolderName);
          if (data.mpesaLink.idNumber) setIdNumber(data.mpesaLink.idNumber);
          if (data.mpesaLink.accountType) setAccountType(data.mpesaLink.accountType);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your Kenyan M-Pesa mobile number.');
      return;
    }
    if (!accountHolderName.trim()) {
      setErrorMsg('Please enter the account holder name registered with Safaricom.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/mpesa-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          accountHolderName: accountHolderName.trim(),
          idNumber: idNumber.trim() || undefined,
          accountType
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to link M-Pesa account.');
      }
      setMpesaLink(data.mpesaLink);
      setIsEditing(false);
      setSuccessMsg(data.message || 'M-Pesa account linked successfully!');
      if (onLinkUpdated) onLinkUpdated(data.mpesaLink);
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error occurred while linking account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to disconnect this M-Pesa account? Direct Daraja payouts and instant STK push will be disabled.')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/mpesa-link', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlink account.');
      }
      setMpesaLink(null);
      setIsEditing(false);
      setSuccessMsg('M-Pesa account disconnected successfully.');
      if (onLinkUpdated) onLinkUpdated(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not unlink M-Pesa account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isModal && !isOpen) return null;

  const content = (
    <div className="space-y-5 text-slate-900 dark:text-white" id="mpesa_link_container">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Safaricom Daraja M-Pesa Integration
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct connection for instant escrow STK Push top-ups and automated B2C payout disbursements
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="shrink-0">
          {mpesaLink?.status === 'CONNECTED' ? (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold shadow-2xs"
              id="mpesa_wallet_status_connected"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Wallet Connected</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold shadow-2xs"
              id="mpesa_wallet_status_disconnected"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>Wallet Not Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Error & Success alerts */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CONNECTED STATE VIEW */}
      {mpesaLink?.status === 'CONNECTED' && !isEditing && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Linked Mobile Account
              </span>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {mpesaLink.phoneNumber}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Registered To: <strong className="text-slate-700 dark:text-slate-200">{mpesaLink.accountHolderName}</strong>
                {mpesaLink.idNumber && ` • National ID: ${mpesaLink.idNumber}`}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 block">Account Type</span>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {mpesaLink.accountType}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Daraja API Gateway</span>
              <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{mpesaLink.darajaStatus}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Verified & Bound</span>
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                {new Date(mpesaLink.linkedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              id="btn_mpesa_change_number"
            >
              Update / Change Line
            </button>
            <button
              type="button"
              onClick={handleUnlink}
              disabled={submitting}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition flex items-center gap-1.5 cursor-pointer"
              id="btn_mpesa_unlink"
            >
              <Unlink className="h-3.5 w-3.5" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      )}

      {/* CLEAR INSTRUCTIONS & VALUE PROPOSITION */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
          <HelpCircle className="h-4 w-4 text-emerald-600" />
          <span>How Safaricom Daraja Account Linking Works</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
              1. Safaricom Mobile Line
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Enter your active Kenyan mobile number registered for M-Pesa. Standard Safaricom subscriber charges apply.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
              2. KYC Identity Matching
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Account holder name must match your legal registration to satisfy Central Bank of Kenya (CBK) AML/CFT rules.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 block text-[11px]">
              3. Automated STK & B2C
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Instant STK Push on phone for deposit top-ups, and real-time B2C bulk disbursements directly to your line.
            </p>
          </div>
        </div>
      </div>

      {/* INPUT FORM (When disconnected or editing) */}
      {(!mpesaLink || isEditing) && (
        <form onSubmit={handleLinkSubmit} className="space-y-4" id="form_link_mpesa_account">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Kenyan M-Pesa Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 0712345678 or 254712345678"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  id="input_mpesa_link_phone"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Accepts Safaricom 07XX or 01XX lines
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Account Holder Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="Name as registered with Safaricom"
                value={accountHolderName}
                onChange={e => setAccountHolderName(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="input_mpesa_link_name"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Must match your Safaricom SIM KYC
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                National ID / Passport Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 24890123"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="input_mpesa_link_id_number"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="select_mpesa_account_type"
              >
                <option value="PERSONAL">Personal Mobile Wallet (STK & B2C)</option>
                <option value="TILL">Buy Goods / Till Number</option>
                <option value="PAYBILL">Cooperative Paybill Account</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-normal">
              Your connection details are encrypted and bound directly to Safaricom Daraja API Paybill 4128901. PIN entry is strictly executed on your mobile SIM handset.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              id="btn_submit_mpesa_link"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying Line...</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>{isEditing ? 'Update M-Pesa Account' : 'Link M-Pesa Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs select-none"
        id="mpesa_link_modal_backdrop"
      >
        <div
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
          id="mpesa_link_modal_dialog"
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>Link M-Pesa Account</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
                id="btn_close_mpesa_modal"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="p-6 overflow-y-auto flex-1">{content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
      {content}
    </div>
  );
}
