import express from 'express';
import crypto from 'crypto';
import { UserRole, LedgerTransaction, WalletSummary } from '../src/types.js';
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

    // Default starting seed balances if new user with zero records
    if (userTxns.length === 0) {
      if (user.role === UserRole.INVESTOR) {
        availableBalanceKES = 2500000;
        investmentCapitalKES = 2500000;
      } else if (user.role === UserRole.FARMER) {
        operationalFarmFundsKES = 120000;
        farmerEarningsKES = 45000;
        availableBalanceKES = 45000;
      } else if (user.role === UserRole.VETERINARIAN) {
        earningsKES = 35000;
        availableBalanceKES = 35000;
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
      recentTransactions: userTxns.slice(0, 20)
    };

    res.json(summary);
  });

  // Deposit funds into wallet (e.g. M-Pesa / Card / Bank transfer)
  app.post('/api/wallet/deposit', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Authentication required.' });

    const { amountKES, phoneNumber, idempotencyKey } = req.body;
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
    const txn: LedgerTransaction = {
      id: `txn_${Date.now()}`,
      reference: ref,
      userId: user.id,
      amountKES: amount,
      currency: 'KES',
      type: 'DEPOSIT',
      category: user.role === UserRole.INVESTOR ? 'INVESTMENT_CAPITAL' : 'PERSONAL_EARNINGS',
      status: 'COMPLETED',
      description: `Direct deposit via M-Pesa ${phoneNumber || user.phone}`,
      payerId: user.id,
      payerName: user.name,
      paymentProviderRef: `MPESA-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
      idempotencyKey: idempotencyKey || ref,
      timestamp: new Date().toISOString()
    };

    db.ledgerTransactions.push(txn);
    saveDb();

    writeAuditLog(
      user.id,
      'wallet_deposit',
      `transaction:${txn.id}`,
      null,
      { amountKES: amount, ref },
      req.ip || '127.0.0.1'
    );

    res.status(201).json({
      success: true,
      message: `Deposit of KES ${amount.toLocaleString()} successfully credited.`,
      transaction: txn
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
    if (!targetFarmer) {
      return res.status(404).json({ error: 'Target farmer account not found.' });
    }

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

  // Request payout from personal earnings or vet earnings
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

    const ref = `WD_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const txn: LedgerTransaction = {
      id: `txn_${Date.now()}`,
      reference: ref,
      userId: user.id,
      amountKES: amount,
      currency: 'KES',
      type: 'PAYOUT',
      category: 'PERSONAL_EARNINGS',
      status: 'COMPLETED',
      description: `Disbursement to M-Pesa ${phoneNumber || user.phone}`,
      payerId: 'SHAMBALOOP_LEDGER',
      payerName: 'ShambaLoop Escrow & Ledger',
      payeeId: user.id,
      payeeName: user.name,
      timestamp: new Date().toISOString()
    };

    db.ledgerTransactions.push(txn);
    saveDb();

    writeAuditLog(
      user.id,
      'wallet_payout',
      `transaction:${txn.id}`,
      null,
      { amountKES: amount, targetPhone: phoneNumber || user.phone },
      req.ip || '127.0.0.1'
    );

    res.json({
      success: true,
      message: `Payout of KES ${amount.toLocaleString()} disbursed to ${phoneNumber || user.phone}.`,
      transaction: txn
    });
  });
}
