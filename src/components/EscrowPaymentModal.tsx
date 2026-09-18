import React, { useState } from 'react';
import { Listing, ListingType } from '../types';
interface Props { listing: Listing; onClose: () => void; onPaymentSuccess: (data: any) => void; currentUserPhone: string; currentUserId: string }
export default function EscrowPaymentModal({ listing, onClose, onPaymentSuccess, currentUserPhone, currentUserId }: Props) {
  const [phone, setPhone] = useState(currentUserPhone);
  const [acres, setAcres] = useState(listing.landDetails?.acreage || 1);
  const [months, setMonths] = useState(12);
  const [transaction, setTransaction] = useState<any>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const amount = Math.round(listing.type === ListingType.LAND ? acres * listing.priceKES * months / 12 : listing.type === ListingType.LIVESTOCK ? listing.priceKES * 0.1 : 1500);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(transaction ? `/api/payments/${transaction.id}/refresh` : '/api/payments/stkpush', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('sl_token') || ''}` }, body: JSON.stringify({ phone, listingId: listing.id, acreageLeased: acres, durationMonths: months }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Payment request failed.');
      setTransaction(data.transaction);
      if (data.transaction.status === 'FAILED') throw new Error('Payment failed. Close this panel and try again.');
      if (data.transaction.status === 'SUCCESS') {
        await onPaymentSuccess({ listingId: listing.id, landownerId: listing.ownerId, farmerId: listing.type === ListingType.LAND ? currentUserId : listing.ownerId, investorId: currentUserId, paymentId: data.transaction.id, mpesaTxId: data.transaction.transactionId, paymentsMade: data.transaction.amountKES, acreageLeased: acres, pricePerAcreKES: listing.priceKES, durationMonths: months, animalTagId: listing.livestockDetails?.tagId, animalType: listing.livestockDetails?.species, breed: listing.livestockDetails?.breed, splitPercentInvestor: listing.revenueSplitPercent || 40 });
      }
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <div role="dialog" aria-modal="true" aria-labelledby="payment-heading" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 text-slate-900">
    <div className="flex justify-between"><h2 id="payment-heading">Pay for {listing.title}</h2><button type="button" onClick={onClose}>Close</button></div>
    <p>Approve the Safaricom prompt on your phone. Never enter your M-Pesa PIN on this website.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <label className="block">M-Pesa number<input required disabled={Boolean(transaction)} value={phone} onChange={event => setPhone(event.target.value)} className="w-full rounded border p-2" /></label>
    {listing.type === ListingType.LAND && <><label className="block">Acres<input type="number" min="0.1" step="0.1" max={listing.landDetails?.acreage} required disabled={Boolean(transaction)} value={acres} onChange={event => setAcres(Number(event.target.value))} className="w-full rounded border p-2" /></label><label className="block">Months<input type="number" min="1" max="120" required disabled={Boolean(transaction)} value={months} onChange={event => setMonths(Number(event.target.value))} className="w-full rounded border p-2" /></label></>}
    <p>KES {amount.toLocaleString()} · {transaction?.status || 'Not submitted'}</p>
    <button disabled={busy || transaction?.status === 'FAILED'} className="rounded bg-emerald-700 p-3 text-white">{busy ? 'Checking…' : transaction ? 'Check payment and continue' : 'Request payment prompt'}</button>
  </form></div>;
}
