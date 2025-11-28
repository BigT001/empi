import { rolloverVAT } from './vatCalculations';

/**
 * Check if today is the VAT remittance day (21st)
 * This can be called from an API endpoint or scheduled task
 */
export function isVATRemittanceDay(): boolean {
  const today = new Date();
  return today.getDate() === 21;
}

/**
 * VAT rollover cron job
 * Should be called via a scheduled task (e.g., vercel crons, AWS Lambda, etc.)
 * This automatically archives the previous month's VAT and initializes a new month
 */
export async function vatRolloverCronJob() {
  try {
    if (!isVATRemittanceDay()) {
      return {
        executed: false,
        reason: 'Not VAT remittance day (21st)',
      };
    }

    console.log('[VAT Cron Job] Starting VAT rollover on the 21st...');
    
    const result = await rolloverVAT();
    
    console.log('[VAT Cron Job] VAT rollover completed:', result);
    
    return {
      executed: true,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[VAT Cron Job] Error during rollover:', error);
    throw error;
  }
}

/**
 * Monthly reconciliation task (can run on any day)
 * Recalculates VAT for all months to ensure accuracy
 */
export async function monthlyReconciliationCronJob() {
  try {
    console.log('[Monthly Reconciliation] Starting reconciliation...');
    
    // Call the rollover function which will update current month
    const result = await rolloverVAT();
    
    console.log('[Monthly Reconciliation] Completed:', result);
    
    return {
      executed: true,
      result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Monthly Reconciliation] Error:', error);
    throw error;
  }
}
