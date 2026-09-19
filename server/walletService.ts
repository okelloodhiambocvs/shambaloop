import { availableWalletBalance } from './walletBalance.js';
import { darajaConfigured, normalizeMpesaPhone, initiateStk, queryStk } from './daraja.js';
import express from 'express';
import crypto from 'crypto';
import { UserRole, LedgerTransaction, WalletSummary, MpesaAccountLink } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

const TREASURY_ID = 'SHAMBALOOP_TREASURY';
const completed = (transaction: LedgerTransaction) => transaction.status === 'COMPLETED';

function buildTreasurySnapshot(db: any) {
  const transactions: LedgerTransaction[] = db.ledgerTransactions || [];
  const treasuryBalanceKES = transactions.reduce((balance, transaction) => {
    if (!completed(transaction)) return balance;
    if (transaction.type === 'DEPOSIT') return balance + transaction.amountKES;
    if (['RELEASE', 'RETURN', 'PAYOUT', 'EXPENSE'].includes(transaction.type)) return balance - transaction.amountKES;
    return balance;
  }, 0);
  const participants = (db.users || [])
    .filter((user: any) => [UserRole.INVESTOR, UserRole.FARMER, UserRole.VETERINARIAN].includes(user.role))
    .map((user: any) => {
      const completedTransactions = transactions.filter((transaction) => completed(transaction));
      const incomingKES = completedTransactions.filter((transaction) => (transaction.payeeId === user.id && ['RELEASE', 'RETURN'].includes(transaction.type)) || (transaction.userId === user.id && transaction.type === 'RETURN')).reduce((sum, transaction) => sum + transaction.amountKES, 0);
      const outgoingKES = completedTransactions.filter((transaction) => (transaction.userId === user.id && ['DEPOSIT', 'PAYOUT'].includes(transaction.type)) || transaction.payerId === user.id || transaction.fundingSourceUserId === user.id).reduce((sum, transaction) => sum + transaction.amountKES, 0);
      return {
        userId: user.id,
        name: user.name,
        role: user.role,
        availableBalanceKES: availableWalletBalance(user.id, user.role, transactions),
        incomingKES,
        outgoingKES,
        transactionCount: transactions.filter((transaction) => transaction.userId === user.id || transaction.payeeId === user.id || transaction.payerId === user.id || transaction.fundingSourceUserId === user.id).length
      };
    });
  const pendingPayouts = transactions.filter((transaction) => transaction.type === 'PAYOUT' && ['PENDING', 'PROCESSING'].includes(transaction.status));
  return {
    treasuryBalanceKES: Math.max(0, treasuryBalanceKES),
    pendingPayoutKES: pendingPayouts.reduce((sum, transaction) => sum + transaction.amountKES, 0),
    participants,
    pendingPayouts: pendingPayouts.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100),
    recentTransactions: transactions.slice().sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100)
  };
}

export function registerWalletRoutes(
  app: express.Express,
  authMiddleware: express.RequestHandler,
  getDb: () => any,
  saveDb: () => void
) {
  // Compute full wallet summary for authenticated user from ledger
  app.get('/api/wallet/summary', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const db = getDb();
    db.ledgerTransactions ||= [];
    db.users ||= [];

    const userInDb = db.users.find((u: any) => u.id === user.id);

    // Filter transactions involving this user as payee or payer
    const userTxns: LedgerTransaction[] = db.ledgerTransactions
      .filter((t: LedgerTransaction) => t.userId === user.id || t.payeeId === user.id || t.payerId === user.id)
      .sort((a: LedgerTransaction, b: LedgerTransaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Compute balances based on user role and ledger entries
    let availableBalanceKES = 0;
    let pendingInKES = 0;
    let approvedKES = 0;
    let releasedKES = 0;

    // Farmer specific
    let operationalFarmFundsKES = 0;
    let farmerEarningsKES = 0;

    // Investor specific
    let investmentCapitalKES = 0;
    let committedFundsKES = 0;
    let allocatedFundsKES = 0;
    let releasedFundsKES = 0;
    let farmExpensesKES = 0;
    let returnsKES = 0;

    // Vet specific
    let pendingJobPaymentsKES = 0;
    let earningsKES = 0;

    for (const t of userTxns) {
      if (t.status === 'COMPLETED') {
        if (t.type === 'PAYOUT') continue;
        if (user.role === UserRole.FARMER) {
          if (t.userId === user.id || t.payeeId === user.id) {
            if (t.category === 'OPERATIONAL' && t.type !== 'EXPENSE') {
              operationalFarmFundsKES += t.amountKES;
            } else if (t.category === 'PERSONAL_EARNINGS') {
              farmerEarningsKES += t.amountKES;
              availableBalanceKES += t.amountKES;
            }
            if (t.type === 'RELEASE') {
              releasedKES += t.amountKES;
            }
          }
          if (t.type === 'EXPENSE' && t.userId === user.id) {
            operationalFarmFundsKES -= t.amountKES;
          }
        } else if (user.role === UserRole.INVESTOR) {
          if (t.userId === user.id) {
            if (t.type === 'DEPOSIT') {
              investmentCapitalKES += t.amountKES;
              availableBalanceKES += t.amountKES;
            } else if (t.type === 'ALLOCATION') {
              committedFundsKES += t.amountKES;
              availableBalanceKES -= t.amountKES;
            } else if (t.type === 'RELEASE' && (t.payerId === user.id || t.fundingSourceUserId === user.id)) {
              releasedFundsKES += t.amountKES;
              farmExpensesKES += t.amountKES;
            } else if (t.type === 'RETURN') {
              returnsKES += t.amountKES;
              availableBalanceKES += t.amountKES;
            }
          }
        } else if (user.role === UserRole.VETERINARIAN) {
          if (t.userId === user.id || t.payeeId === user.id) {
            earningsKES += t.amountKES;
            availableBalanceKES += t.amountKES;
            if (t.type === 'RELEASE') {
              releasedKES += t.amountKES;
            }
          }
        }
      } else if (t.status === 'PENDING' && t.type !== 'PAYOUT') {
        pendingInKES += t.amountKES;
        if (user.role === UserRole.VETERINARIAN) {
          pendingJobPaymentsKES += t.amountKES;
        }
      } else if (t.status === 'PROCESSING') {
        approvedKES += t.amountKES;
      }
    }

    const summary: WalletSummary = {
      userId: user.id,
      role: user.role,
      availableBalanceKES: availableWalletBalance(user.id, user.role, db.ledgerTransactions),
      pendingInKES,
      approvedKES,
      releasedKES,
      operationalFarmFundsKES,
      farmerEarningsKES,
      investmentCapitalKES,
      committedFundsKES,
      allocatedFundsKES,
      releasedFundsKES,
      farmExpensesKES,
      returnsKES,
      pendingJobPaymentsKES,
      earningsKES,
      recentTransactions: userTxns.slice(0, 20),
      mpesaLink: userInDb?.mpesaLink || undefined
    };

    res.json(summary);
  });

  // Creates a payment intent. Only a verified provider callback may credit a wallet.
  app.post('/api/wallet/deposit', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const user = req.user!;
    const amount = Number(req.body.amountKES);
    const phone = normalizeMpesaPhone(req.body.phoneNumber || user.phone);
    if (!Number.isSafeInteger(amount) || amount < 100 || amount > 250000 || !phone) return res.status(400).json({ error: 'Provide a valid M-Pesa number and whole KES amount between 100 and 250,000.' });
    const db = getDb(); db.ledgerTransactions ||= [];
    const key = typeof req.body.idempotencyKey === 'string' ? req.body.idempotencyKey.slice(0, 128) : crypto.randomUUID();
    const existing = db.ledgerTransactions.find((t: any) => t.userId === user.id && t.idempotencyKey === key);
    if (existing) return res.json({ success: true, transaction: existing });
    try {
      const result = await initiateStk(phone, amount, 'ShambaLoop');
      const timestamp = new Date().toISOString();
      const transaction = { id: crypto.randomUUID(), reference: result.CheckoutRequestID, userId: user.id, amountKES: amount, currency: 'KES', type: 'DEPOSIT', category: user.role === UserRole.INVESTOR ? 'INVESTMENT_CAPITAL' : 'PERSONAL_EARNINGS', status: 'PENDING', description: 'Awaiting M-Pesa confirmation into ShambaLoop treasury', phoneNumber: phone, payerId: user.id, payeeId: TREASURY_ID, payeeName: 'ShambaLoop Treasury', paymentProviderRef: result.CheckoutRequestID, idempotencyKey: key, stateHistory: [{ from: null, to: 'PENDING', at: timestamp, source: 'CLIENT' }], timestamp, purpose: String(req.body.purpose || 'WALLET_DEPOSIT').slice(0, 100) };
      db.ledgerTransactions.push(transaction); saveDb();
      return res.status(201).json({ success: true, transaction, message: 'Approve the payment on your phone, then refresh its status.' });
    } catch (error) { return res.status(503).json({ error: (error as Error).message }); }
  });
  app.post('/api/wallet/transactions/:id/refresh', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const transaction = (db.ledgerTransactions || []).find((t: any) => t.id === req.params.id && t.userId === req.user!.id && t.type === 'DEPOSIT');
    if (!transaction) return res.status(404).json({ error: 'Payment not found.' });
    if (transaction.status !== 'PENDING') return res.json({ transaction });
    try {
      const result = await queryStk(transaction.paymentProviderRef);
      const nextState = String(result.ResultCode) === '0' ? 'COMPLETED' : result.ResultCode !== undefined ? 'FAILED' : transaction.status;
      if (nextState !== transaction.status) {
        const previous = transaction.status;
        transaction.status = nextState;
        transaction.stateHistory = [...(transaction.stateHistory || []), { from: previous, to: nextState, at: new Date().toISOString(), source: 'PROVIDER_QUERY' }];
      }
      if (transaction.status === 'COMPLETED') { const user = db.users.find((u: any) => u.id === req.user!.id); if (user?.mpesaLink && normalizeMpesaPhone(user.mpesaLink.phoneNumber) === transaction.phoneNumber) { user.mpesaLink.status = 'CONNECTED'; user.mpesaLink.verified = true; user.mpesaLink.darajaStatus = 'Payment confirmed by Daraja'; } }
      saveDb(); res.json({ transaction });
    } catch (error) { res.status(503).json({ error: (error as Error).message }); }
  });

  // Milestone release: Controlled release of investment funds to operational farm funds
  app.post('/api/wallet/release-milestone', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { milestoneId, farmId, farmerId, amountKES, idempotencyKey, note } = req.body;
    const amount = Number(amountKES);

    if (!farmerId || !Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid farmerId and amountKES are required.' });
    }

    if (user.role !== UserRole.INVESTOR) {
      return res.status(403).json({ error: 'Investor releases must be funded from the investor’s confirmed treasury balance.' });
    }

    const db = getDb();
    db.ledgerTransactions ||= [];

    // Prevent double-releasing the same milestone
    if (milestoneId) {
      const alreadyReleased = db.ledgerTransactions.find(
        (t: LedgerTransaction) => t.relatedEntityId === milestoneId && t.type === 'RELEASE' && t.status === 'COMPLETED'
      );
      if (alreadyReleased) {
        return res.status(400).json({ 
          error: 'Funds for this milestone have already been released. Double-release prevented.',
          transaction: alreadyReleased 
        });
      }
    }

    const targetFarmer = db.users.find((u: any) => u.id === farmerId);
    if (!targetFarmer || targetFarmer.role !== UserRole.FARMER) {
      return res.status(404).json({ error: 'Target farmer account not found.' });
    }
    if (user.role === UserRole.INVESTOR && !db.partnerships?.some((p: any) => p.investorId === user.id && p.farmerId === farmerId && (!farmId || p.id === farmId || `farm_${p.farmerId}` === farmId))) {
      return res.status(403).json({ error: 'You may only release funds to a farmer in your own active collaboration.' });
    }
    if (amount > availableWalletBalance(user.id, user.role, db.ledgerTransactions)) return res.status(409).json({ error: 'Insufficient confirmed wallet funds for this release.' });

    const ref = `REL_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const txn: LedgerTransaction = {
      id: `txn_${Date.now()}`,
      reference: ref,
      userId: targetFarmer.id,
      amountKES: amount,
      currency: 'KES',
      type: 'RELEASE',
      category: 'OPERATIONAL',
      status: 'COMPLETED',
      relatedEntityId: milestoneId,
      relatedEntityType: 'MILESTONE',
      description: note || `Controlled milestone release for ${milestoneId || 'Farm Activity'}`,
      payerId: TREASURY_ID,
      payerName: 'ShambaLoop Treasury',
      fundingSourceUserId: user.id,
      payeeId: targetFarmer.id,
      payeeName: targetFarmer.name,
      idempotencyKey: idempotencyKey || ref,
      timestamp: new Date().toISOString()
    };

    db.ledgerTransactions.push(txn);
    saveDb();

    writeAuditLog(
      user.id,
      'milestone_funds_released',
      `milestone:${milestoneId || 'direct'}`,
      null,
      { amountKES: amount, payeeId: targetFarmer.id },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: `KES ${amount.toLocaleString()} controlled funds released to farmer operational account.`,
      transaction: txn
    });
  });

  // Creates a payout request. A payment provider/admin workflow must settle it.
  app.post('/api/wallet/payout', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { amountKES, phoneNumber } = req.body;
    const amount = Number(amountKES);

    if (!Number.isSafeInteger(amount) || amount < 50) {
      return res.status(400).json({ error: 'Minimum payout is KES 50.' });
    }

    const db = getDb();
    db.ledgerTransactions ||= [];

    const availableBalance = availableWalletBalance(user.id, user.role, db.ledgerTransactions);

    if (amount > availableBalance) {
      return res.status(409).json({ error: `Requested withdrawal of KES ${amount.toLocaleString()} exceeds your available wallet balance of KES ${availableBalance.toLocaleString()}.` });
    }

    if (!normalizeMpesaPhone(phoneNumber || user.phone)) return res.status(400).json({ error: 'Enter a valid M-Pesa number.' });
    const ref = `WD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const mpesaReceipt = ref;
    const isCompleted = false;

    const txn: LedgerTransaction = {
      id: `txn_${Date.now()}`,
      reference: ref,
      userId: user.id,
      amountKES: amount,
      currency: 'KES',
      type: 'PAYOUT',
      category: 'PERSONAL_EARNINGS',
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      description: `M-Pesa B2C Withdrawal (${mpesaReceipt}) to ${phoneNumber || user.phone}`,
      payerId: TREASURY_ID,
      payerName: 'ShambaLoop Treasury',
      payeeId: user.id,
      payeeName: user.name,
      paymentProviderRef: mpesaReceipt,
      timestamp: new Date().toISOString()
    };
    (txn as any).purpose = 'M-Pesa B2C Payout';

    db.ledgerTransactions.push(txn);

    // Also record into db.transactions for Safaricom Daraja ledger consistency
    db.transactions ||= [];
    db.transactions.push({
      id: `tx_${Date.now()}`,
      transactionId: mpesaReceipt,
      phoneNumber: phoneNumber || user.phone,
      amountKES: amount,
      purpose: 'M-Pesa Payout Disbursement',
      status: isCompleted ? 'SUCCESS' : 'PENDING',
      timestamp: new Date().toISOString()
    });

    saveDb();

    writeAuditLog(
      user.id,
      'wallet_payout',
      `transaction:${txn.id}`,
      null,
      { amountKES: amount, targetPhone: phoneNumber || user.phone, mpesaReceipt },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: isCompleted
        ? `M-Pesa B2C withdrawal of KES ${amount.toLocaleString()} disbursed successfully to ${phoneNumber || user.phone} (Receipt: ${mpesaReceipt}).`
        : `Payout request for KES ${amount.toLocaleString()} is queued for Safaricom Daraja batch disbursement.`,
      transaction: txn,
      mpesaReceipt
    });
  });

  /** Admin-only read model: the treasury is derived from the immutable participant ledger. */
  app.get('/api/admin/treasury', authMiddleware, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== UserRole.ADMIN) return res.status(403).json({ error: 'Only administrators may view the cooperative treasury.' });
    const db = getDb();
    db.ledgerTransactions ||= [];
    res.json(buildTreasurySnapshot(db));
  });

  /** Releases confirmed investor capital from the cooperative treasury to an eligible farmer or veterinarian. */
  app.post('/api/admin/treasury/releases', authMiddleware, (req: AuthenticatedRequest, res) => {
    const admin = req.user;
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: 'Only administrators may authorize treasury releases.' });
    const { fundingSourceUserId, recipientId, amountKES, relatedEntityId, note, idempotencyKey } = req.body;
    const amount = Number(amountKES);
    if (typeof fundingSourceUserId !== 'string' || typeof recipientId !== 'string' || !Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'An investor funding source, eligible recipient, and whole positive KES amount are required.' });
    }
    const db = getDb();
    db.ledgerTransactions ||= [];
    const investor = db.users?.find((item: any) => item.id === fundingSourceUserId && item.role === UserRole.INVESTOR);
    const recipient = db.users?.find((item: any) => item.id === recipientId && [UserRole.FARMER, UserRole.VETERINARIAN].includes(item.role));
    if (!investor || !recipient) return res.status(404).json({ error: 'Select a valid investor and a farmer or veterinarian recipient.' });
    const linkedPartnership = (db.partnerships || []).find((partnership: any) => partnership.investorId === investor.id && (recipient.role === UserRole.FARMER ? partnership.farmerId === recipient.id : true));
    const linkedVetJob = recipient.role === UserRole.VETERINARIAN && (db.veterinaryJobs || []).some((job: any) => job.assignedVetId === recipient.id && (linkedPartnership ? [linkedPartnership.id, `farm_${linkedPartnership.farmerId}`].includes(job.farmId) : true));
    if (!linkedPartnership || (recipient.role === UserRole.VETERINARIAN && !linkedVetJob)) return res.status(403).json({ error: 'Treasury releases require an active investor-funded partnership and, for veterinary payments, an assigned related job.' });
    if (amount > availableWalletBalance(investor.id, investor.role, db.ledgerTransactions)) return res.status(409).json({ error: 'The selected investor does not have enough confirmed capital held in treasury.' });
    const key = typeof idempotencyKey === 'string' && idempotencyKey.length ? idempotencyKey.slice(0, 128) : `admin_release_${crypto.randomUUID()}`;
    const existing = db.ledgerTransactions.find((transaction: LedgerTransaction) => transaction.idempotencyKey === key);
    if (existing) return res.json({ success: true, transaction: existing });
    const timestamp = new Date().toISOString();
    const transaction: LedgerTransaction = {
      id: `txn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      reference: `TREL_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      userId: recipient.id,
      amountKES: amount,
      currency: 'KES',
      type: 'RELEASE',
      category: recipient.role === UserRole.FARMER ? 'OPERATIONAL' : 'PERSONAL_EARNINGS',
      status: 'COMPLETED',
      relatedEntityId: typeof relatedEntityId === 'string' ? relatedEntityId.slice(0, 128) : linkedPartnership.id,
      relatedEntityType: 'COLLABORATION',
      description: typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : `Treasury-controlled release to ${recipient.name}`,
      payerId: TREASURY_ID,
      payerName: 'ShambaLoop Treasury',
      fundingSourceUserId: investor.id,
      payeeId: recipient.id,
      payeeName: recipient.name,
      idempotencyKey: key,
      timestamp,
      stateHistory: [{ from: null, to: 'COMPLETED', at: timestamp, source: 'SYSTEM' }]
    };
    db.ledgerTransactions.push(transaction);
    saveDb();
    writeAuditLog(admin.id, 'treasury_release_authorized', `transaction:${transaction.id}`, null, { fundingSourceUserId: investor.id, recipientId: recipient.id, amountKES: amount }, req.ip || '127.0.0.1');
    res.status(201).json({ success: true, transaction, message: 'Treasury release recorded against the selected investor’s confirmed capital.' });
  });

  /** A queued payout requires admin approval before the payment provider may settle it. */
  app.post('/api/admin/treasury/payouts/:id/approve', authMiddleware, (req: AuthenticatedRequest, res) => {
    const admin = req.user;
    if (!admin || admin.role !== UserRole.ADMIN) return res.status(403).json({ error: 'Only administrators may approve payout requests.' });
    const db = getDb();
    const transaction = (db.ledgerTransactions || []).find((item: LedgerTransaction) => item.id === req.params.id && item.type === 'PAYOUT');
    if (!transaction) return res.status(404).json({ error: 'Payout request not found.' });
    if (transaction.status !== 'PENDING') return res.status(409).json({ error: 'Only pending payout requests can be approved.' });
    transaction.status = 'PROCESSING';
    transaction.stateHistory = [...(transaction.stateHistory || []), { from: 'PENDING', to: 'PROCESSING', at: new Date().toISOString(), source: 'SYSTEM' }];
    saveDb();
    writeAuditLog(admin.id, 'treasury_payout_approved', `transaction:${transaction.id}`, null, { amountKES: transaction.amountKES, payeeId: transaction.payeeId }, req.ip || '127.0.0.1');
    res.json({ success: true, transaction, message: 'Payout approved and queued for payment-provider settlement.' });
  });

  // SAFARICOM DARAJA M-PESA ACCOUNT LINKING

  // 1. Get current linked M-Pesa wallet status
  app.get('/api/wallet/mpesa-link', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const db = getDb();
    db.users ||= [];
    const userInDb = db.users.find((u: any) => u.id === user.id);
    const mpesaLink = userInDb?.mpesaLink || null;

    res.json({
      connected: !!mpesaLink && mpesaLink.status === 'CONNECTED',
      mpesaLink
    });
  });

  // 2. Link or update Safaricom M-Pesa account
  app.post('/api/wallet/mpesa-link', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { phoneNumber, accountHolderName, idNumber, accountType } = req.body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return res.status(400).json({ error: 'Kenyan M-Pesa mobile number is required.' });
    }

    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    let normalized = '';
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      normalized = '254' + cleaned.slice(1);
    } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
      normalized = '254' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('254')) {
      normalized = cleaned;
    } else {
      return res.status(400).json({
        error: 'Invalid Kenyan phone number. Provide format 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX.'
      });
    }

    if (!accountHolderName || typeof accountHolderName !== 'string' || accountHolderName.trim().length < 3) {
      return res.status(400).json({ error: 'Account holder full name (as registered on M-Pesa) is required.' });
    }

    if (!normalizeMpesaPhone(phoneNumber)) return res.status(400).json({ error: 'Enter a valid Kenyan mobile number.' });
    if (accountType && accountType !== 'PERSONAL') return res.status(400).json({ error: 'Only personal M-Pesa mobile accounts are supported.' });
    const formattedDisplay = `+254 ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;

    const db = getDb();
    db.users ||= [];
    const userInDb = db.users.find((u: any) => u.id === user.id);
    if (!userInDb) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const mpesaLink: MpesaAccountLink = {
      phoneNumber: formattedDisplay,
      accountHolderName: accountHolderName.trim(),
      idNumber: typeof idNumber === 'string' ? idNumber.trim() : undefined,
      accountType: accountType === 'TILL' || accountType === 'PAYBILL' ? accountType : 'PERSONAL',
      verified: false,
      linkedAt: new Date().toISOString(),
      status: 'PENDING',
      darajaStatus: darajaConfigured() ? 'Number saved; awaiting payment confirmation' : 'Provider not configured'
    };

    userInDb.mpesaLink = mpesaLink;
    saveDb();

    writeAuditLog(
      user.id,
      'wallet_mpesa_linked',
      `user:${user.id}`,
      null,
      { phone: normalized, accountHolderName: mpesaLink.accountHolderName, accountType: mpesaLink.accountType },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `M-Pesa line ${formattedDisplay} saved. Confirm a payment on your phone to verify the number.`,
      mpesaLink
    });
  });

  // 3. Unlink M-Pesa account
  app.delete('/api/wallet/mpesa-link', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const db = getDb();
    db.users ||= [];
    const userInDb = db.users.find((u: any) => u.id === user.id);
    if (!userInDb) return res.status(404).json({ error: 'User account not found.' });

    const prev = userInDb.mpesaLink;
    delete userInDb.mpesaLink;
    saveDb();

    writeAuditLog(
      user.id,
      'wallet_mpesa_unlinked',
      `user:${user.id}`,
      null,
      { previousPhone: prev?.phoneNumber },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: 'M-Pesa account unlinked from cooperative wallet.'
    });
  });
}
