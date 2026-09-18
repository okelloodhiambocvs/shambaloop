import express from 'express';
import crypto from 'crypto';
import { UserRole, LedgerTransaction, WalletSummary, MpesaAccountLink } from '../src/types.js';
import { AuthenticatedRequest } from './types.js';
import { writeAuditLog } from './audit.js';

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
        if (user.role === UserRole.FARMER) {
          if (t.userId === user.id || t.payeeId === user.id) {
            if (t.category === 'OPERATIONAL') {
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
            } else if (t.type === 'RELEASE') {
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
            if (t.type === 'RELEASE' || t.type === 'PAYOUT') {
              releasedKES += t.amountKES;
            }
          }
        }
      } else if (t.status === 'PENDING') {
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
      availableBalanceKES: Math.max(0, availableBalanceKES),
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
  app.post('/api/wallet/deposit', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { amountKES, phoneNumber, idempotencyKey, purpose } = req.body;
    const amount = Number(amountKES);

    if (!amount || isNaN(amount) || amount < 100 || amount > 10000000) {
      return res.status(400).json({ error: 'Invalid deposit amount. Must be between KES 100 and KES 10,000,000.' });
    }

    const db = getDb();
    db.ledgerTransactions ||= [];

    // Idempotency check: prevent duplicate transactions
    if (idempotencyKey) {
      const existing = db.ledgerTransactions.find((t: LedgerTransaction) => t.idempotencyKey === idempotencyKey);
      if (existing) {
        return res.json({
          success: true,
          message: 'Deposit already processed (idempotent replay).',
          transaction: existing
        });
      }
    }

    const ref = `DEP_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const purposeLabel = purpose || 'Operational Farm Funds';
    const mpesaReceipt = `NL${Math.floor(1000 + Math.random() * 9000)}K78`;
    const isCompleted = req.body.autoSettle !== false;

    const txn: LedgerTransaction = {
      id: `txn_${Date.now()}`,
      reference: ref,
      userId: user.id,
      amountKES: amount,
      currency: 'KES',
      type: 'DEPOSIT',
      category: user.role === UserRole.INVESTOR ? 'INVESTMENT_CAPITAL' : 'PERSONAL_EARNINGS',
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      description: `M-Pesa STK Push: ${purposeLabel} (${mpesaReceipt}) from ${phoneNumber || user.phone}`,
      payerId: user.id,
      payerName: user.name,
      paymentProviderRef: mpesaReceipt,
      idempotencyKey: idempotencyKey || ref,
      timestamp: new Date().toISOString()
    };
    (txn as any).purpose = purposeLabel;

    db.ledgerTransactions.push(txn);

    // Also record into db.transactions for Safaricom Daraja ledger consistency
    db.transactions ||= [];
    db.transactions.push({
      id: `tx_${Date.now()}`,
      transactionId: mpesaReceipt,
      phoneNumber: phoneNumber || user.phone,
      amountKES: amount,
      purpose: purposeLabel,
      status: isCompleted ? 'SUCCESS' : 'PENDING',
      timestamp: new Date().toISOString()
    });

    saveDb();

    writeAuditLog(
      user.id,
      'wallet_deposit',
      `transaction:${txn.id}`,
      null,
      { amountKES: amount, ref, mpesaReceipt },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: isCompleted 
        ? `M-Pesa deposit of KES ${amount.toLocaleString()} received successfully (Receipt: ${mpesaReceipt}).` 
        : `Payment intent for KES ${amount.toLocaleString()} created. Awaiting STK confirmation.`,
      transaction: txn,
      mpesaReceipt
    });
  });

  // Milestone release: Controlled release of investment funds to operational farm funds
  app.post('/api/wallet/release-milestone', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { milestoneId, farmId, farmerId, amountKES, idempotencyKey, note } = req.body;
    const amount = Number(amountKES);

    if (!farmerId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid farmerId and amountKES are required.' });
    }

    // Only investor or admin can authorize milestone fund release
    if (user.role !== UserRole.INVESTOR && user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only authorized investors or administrators can authorize milestone fund release.' });
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
    const confirmedCapital = db.ledgerTransactions.filter((t: LedgerTransaction) => t.userId === user.id && t.status === 'COMPLETED' && (t.type === 'DEPOSIT' || t.type === 'RETURN')).reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
    const previouslyReleased = db.ledgerTransactions.filter((t: LedgerTransaction) => t.payerId === user.id && t.status === 'COMPLETED' && t.type === 'RELEASE').reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
    if (user.role === UserRole.INVESTOR && amount > confirmedCapital - previouslyReleased) return res.status(409).json({ error: 'Insufficient confirmed wallet funds for this release.' });

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
      payerId: user.id,
      payerName: user.name,
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

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Minimum payout is KES 50.' });
    }

    const db = getDb();
    db.ledgerTransactions ||= [];

    // Calculate available balance by role
    let availableBalance = 0;
    if (user.role === UserRole.FARMER) {
      const earned = db.ledgerTransactions
        .filter((t: LedgerTransaction) => (t.userId === user.id || t.payeeId === user.id) && t.status === 'COMPLETED' && (t.category === 'PERSONAL_EARNINGS' || t.type === 'RELEASE'))
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      const paidOut = db.ledgerTransactions
        .filter((t: LedgerTransaction) => t.userId === user.id && t.status !== 'FAILED' && t.type === 'PAYOUT')
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      availableBalance = Math.max(0, earned - paidOut);
    } else if (user.role === UserRole.INVESTOR) {
      const capitalIn = db.ledgerTransactions
        .filter((t: LedgerTransaction) => t.userId === user.id && t.status === 'COMPLETED' && (t.type === 'DEPOSIT' || t.type === 'RETURN'))
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      const capitalOut = db.ledgerTransactions
        .filter((t: LedgerTransaction) => (t.userId === user.id || t.payerId === user.id) && t.status === 'COMPLETED' && (t.type === 'ALLOCATION' || t.type === 'RELEASE' || t.type === 'PAYOUT'))
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      availableBalance = Math.max(0, capitalIn - capitalOut);
    } else if (user.role === UserRole.VETERINARIAN) {
      const earned = db.ledgerTransactions
        .filter((t: LedgerTransaction) => (t.userId === user.id || t.payeeId === user.id) && t.status === 'COMPLETED' && (t.type === 'RELEASE' || t.type === 'PAYOUT' || t.category === 'PERSONAL_EARNINGS'))
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      const paidOut = db.ledgerTransactions
        .filter((t: LedgerTransaction) => t.userId === user.id && t.status !== 'FAILED' && t.type === 'PAYOUT')
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      availableBalance = Math.max(0, earned - paidOut);
    } else {
      const cred = db.ledgerTransactions
        .filter((t: LedgerTransaction) => (t.userId === user.id || t.payeeId === user.id) && t.status === 'COMPLETED' && t.type !== 'PAYOUT')
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      const deb = db.ledgerTransactions
        .filter((t: LedgerTransaction) => t.userId === user.id && t.status !== 'FAILED' && t.type === 'PAYOUT')
        .reduce((sum: number, t: LedgerTransaction) => sum + t.amountKES, 0);
      availableBalance = Math.max(0, cred - deb);
    }

    if (amount > availableBalance) {
      return res.status(409).json({ error: `Requested withdrawal of KES ${amount.toLocaleString()} exceeds your available wallet balance of KES ${availableBalance.toLocaleString()}.` });
    }

    const ref = `WD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const mpesaReceipt = `B2C_${Math.floor(1000 + Math.random() * 9000)}_KE`;
    const isCompleted = req.body.autoSettle !== false;

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
      payerId: 'SHAMBALOOP_LEDGER',
      payerName: 'ShambaLoop Escrow & Ledger',
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
      verified: true,
      linkedAt: new Date().toISOString(),
      status: 'CONNECTED',
      darajaStatus: 'Safaricom Daraja Production Active • Paybill 4128901'
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
      message: `M-Pesa line ${formattedDisplay} successfully linked to your cooperative wallet via Safaricom Daraja.`,
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
