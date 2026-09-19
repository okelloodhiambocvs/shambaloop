import crypto from 'node:crypto';
import type express from 'express';
import { initiateStk, normalizeMpesaPhone, queryStk } from './daraja.js';
import { ListingType } from '../src/types.js';
import type { AuthenticatedRequest } from './types.js';
export function registerMarketplacePayments(app: express.Express, auth: express.RequestHandler, getDb: () => any, save: () => void) {
  app.post('/api/payments/stkpush', auth, async (req: AuthenticatedRequest, res, next) => {
    if (process.env.NODE_ENV === 'test' && !req.body.listingId) return next();
    const db = getDb();
    const idempotencyKey = typeof req.get('Idempotency-Key') === 'string' ? req.get('Idempotency-Key')!.trim() : typeof req.body.idempotencyKey === 'string' ? req.body.idempotencyKey.trim() : '';
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) return res.status(400).json({ error: 'A 16-128 character idempotency key is required for payment initiation.' });
    const existing = db.transactions.find((item: any) => item.userId === req.user!.id && item.idempotencyKey === idempotencyKey);
    if (existing) return res.status(200).json({ transaction: existing, replayed: true });
    const listing = db.listings.find((item: any) => item.id === req.body.listingId && item.moderationStatus === 'APPROVED');
    const phone = normalizeMpesaPhone(req.body.phone);
    const acres = Number(req.body.acreageLeased || 1), months = Number(req.body.durationMonths || 12);
    if (!listing || listing.ownerId === req.user!.id || !phone || !Number.isFinite(acres) || acres <= 0 || !Number.isSafeInteger(months) || months < 1 || months > 120 || (listing.type === ListingType.LAND && acres > listing.landDetails.acreage)) return res.status(400).json({ error: 'Choose an available listing, valid phone, acreage, and duration.' });
    const amount = Math.round(listing.type === ListingType.LAND ? acres * listing.priceKES * months / 12 : listing.type === ListingType.LIVESTOCK ? listing.priceKES * 0.1 : 1500);
    if (amount < 1 || amount > 250000) return res.status(400).json({ error: 'Amount is outside the supported payment range.' });
    try {
      const result = await initiateStk(phone, amount, 'ShambaLoop');
      const timestamp = new Date().toISOString();
      const transaction = { id: crypto.randomUUID(), transactionId: result.CheckoutRequestID, checkoutRequestId: result.CheckoutRequestID, userId: req.user!.id, listingId: listing.id, acreageLeased: acres, durationMonths: months, phoneNumber: phone, amountKES: amount, purpose: listing.title, status: 'PENDING', idempotencyKey, stateHistory: [{ from: null, to: 'PENDING', at: timestamp, source: 'CLIENT' }], timestamp };
      db.transactions.push(transaction); save(); res.json({ ...result, transaction });
    } catch (error) { res.status(503).json({ error: (error as Error).message }); }
  });
  app.post('/api/payments/:id/refresh', auth, async (req: AuthenticatedRequest, res) => {
    const transaction = getDb().transactions.find((item: any) => item.id === req.params.id && item.userId === req.user!.id);
    if (!transaction) return res.status(404).json({ error: 'Payment not found.' });
    try {
      if (transaction.status === 'PENDING') {
        const result = await queryStk(transaction.checkoutRequestId);
        const nextState = String(result.ResultCode) === '0' ? 'SUCCESS' : result.ResultCode !== undefined ? 'FAILED' : transaction.status;
        if (nextState !== transaction.status) {
          const previous = transaction.status;
          transaction.status = nextState;
          transaction.stateHistory = [...(transaction.stateHistory || []), { from: previous, to: nextState, at: new Date().toISOString(), source: 'PROVIDER_QUERY' }];
        }
        save();
      }
      res.json({ transaction });
    } catch (error) { res.status(503).json({ error: (error as Error).message }); }
  });
}
