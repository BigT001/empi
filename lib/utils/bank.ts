import Settings from '@/lib/models/Settings';
import connectDB from '@/lib/mongodb';

export interface ActiveBankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
}

/**
 * Retrieves the currently active bank account from the settings.
 * Falls back to legacy bank fields if no active multi-bank account is configured.
 */
export async function getActiveBankAccount(): Promise<ActiveBankDetails | null> {
  try {
    await connectDB();
    const settings = await Settings.findOne({});
    
    if (settings) {
      // 1. Check multi-bank accounts
      if (settings.bankAccounts && settings.bankAccounts.length > 0) {
        const active = settings.bankAccounts.find((b: any) => b.isActive);
        if (active) {
          return {
            bankName: active.bankName,
            accountName: active.accountName,
            accountNumber: active.accountNumber,
          };
        }
      }
      
      // 2. Fallback to legacy single bank fields if available
      if (settings.bankName && settings.bankAccountNumber && settings.bankAccountName) {
        return {
          bankName: settings.bankName,
          accountName: settings.bankAccountName,
          accountNumber: settings.bankAccountNumber,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[getActiveBankAccount] Error:', error);
    return null;
  }
}
