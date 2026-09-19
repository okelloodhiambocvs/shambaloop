import { LedgerTransaction, UserRole } from '../src/types.js';
/** Reserve pending withdrawals immediately; operational farm funds are not personal income. */
export function availableWalletBalance(userId: string, role: UserRole, transactions: LedgerTransaction[]) {
  return Math.max(0, transactions.reduce((balance, transaction) => {
    if (transaction.status === 'FAILED') return balance;
    const owner = transaction.userId === userId;
    const recipient = owner || transaction.payeeId === userId;
    if (transaction.type === 'PAYOUT' && owner) return balance - transaction.amountKES;
    if (transaction.status !== 'COMPLETED') return balance;
    if (role === UserRole.INVESTOR) {
      if (owner && ['DEPOSIT', 'RETURN'].includes(transaction.type)) return balance + transaction.amountKES;
      if ((owner || transaction.payerId === userId || transaction.fundingSourceUserId === userId) && ['RELEASE', 'ALLOCATION'].includes(transaction.type)) return balance - transaction.amountKES;
    } else if (recipient && transaction.category === 'PERSONAL_EARNINGS' && ['DEPOSIT', 'RETURN', 'RELEASE'].includes(transaction.type)) return balance + transaction.amountKES;
    return balance;
  }, 0));
}
