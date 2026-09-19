import { test, expect } from 'vitest';
import { availableWalletBalance } from '../../server/walletBalance';
import { UserRole } from '../types';
test('reserves pending withdrawals and excludes operational funds from farmer earnings', () => {
  const tx = (type: string, category: string, amountKES: number, status = 'COMPLETED') => ({ userId: 'farmer', type, category, amountKES, status });
  expect(availableWalletBalance('farmer', UserRole.FARMER, [tx('RELEASE', 'OPERATIONAL', 5000), tx('DEPOSIT', 'PERSONAL_EARNINGS', 300), tx('PAYOUT', 'PERSONAL_EARNINGS', 100, 'PENDING')] as any)).toBe(200);
});
test('subtracts investor releases even when the farmer owns the ledger entry', () => {
  expect(availableWalletBalance('investor', UserRole.INVESTOR, [
    { userId: 'investor', type: 'DEPOSIT', amountKES: 1000, status: 'COMPLETED' },
    { userId: 'farmer', payerId: 'investor', type: 'RELEASE', amountKES: 400, status: 'COMPLETED' },
    { userId: 'investor', type: 'PAYOUT', amountKES: 100, status: 'PENDING' }
  ] as any)).toBe(500);
});
test('subtracts treasury-controlled releases from their funding investor', () => {
  expect(availableWalletBalance('investor', UserRole.INVESTOR, [
    { userId: 'investor', type: 'DEPOSIT', amountKES: 1000, status: 'COMPLETED' },
    { userId: 'farmer', payerId: 'SHAMBALOOP_TREASURY', fundingSourceUserId: 'investor', type: 'RELEASE', amountKES: 400, status: 'COMPLETED' }
  ] as any)).toBe(600);
});
