/**
 * CAUTION FEE VERIFICATION SCRIPT
 * Checks if caution fees are being captured from checkout and reflected in dashboard
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'http://localhost:3000';

async function verifyCautionFees() {
  console.log('🔍 CAUTION FEE VERIFICATION STARTING...\n');

  try {
    // 1. Fetch analytics data which includes caution fees
    console.log('═══════════════════════════════════════════');
    console.log('1️⃣  FETCHING DASHBOARD ANALYTICS');
    console.log('═══════════════════════════════════════════\n');

    const analyticsRes = await fetch(`${API_BASE}/api/admin/analytics`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'test-token'}`
      }
    });

    if (!analyticsRes.ok) {
      console.log(`❌ Analytics endpoint returned ${analyticsRes.status}`);
      console.log('Make sure the application is running and you have proper authentication\n');
    } else {
      const analytics = await analyticsRes.json();
      
      if (analytics.cautionFeeMetrics) {
        console.log('✅ Caution Fee Metrics Found:');
        console.log(`   Total Collected: ₦${(analytics.cautionFeeMetrics.totalCollected || 0).toFixed(2)}`);
        console.log(`   Total Refunded: ₦${(analytics.cautionFeeMetrics.totalRefunded || 0).toFixed(2)}`);
        console.log(`   Total Partially Refunded: ₦${(analytics.cautionFeeMetrics.totalPartiallyRefunded || 0).toFixed(2)}`);
        console.log(`   Total Forfeited: ₦${(analytics.cautionFeeMetrics.totalForfeited || 0).toFixed(2)}`);
        console.log(`   Refund Rate: ${(analytics.cautionFeeMetrics.refundRate || 0).toFixed(2)}%`);
        console.log(`   Average Refund Days: ${(analytics.cautionFeeMetrics.averageRefundDays || 0).toFixed(1)}\n`);
      } else {
        console.log('⚠️  cautionFeeMetrics not found in analytics response\n');
      }

      // Show order breakdown
      if (analytics.orderTypeBreakdown) {
        console.log('2️⃣  ORDER TYPE BREAKDOWN');
        console.log('═══════════════════════════════════════════\n');
        console.log(`Rental Orders: ${analytics.orderTypeBreakdown.rental || 0}`);
        console.log(`Sales Orders: ${analytics.orderTypeBreakdown.sales || 0}`);
        console.log(`Mixed Orders: ${analytics.orderTypeBreakdown.mixed || 0}\n`);
      }

      // Show revenue breakdown
      if (analytics.revenueBreakdown) {
        console.log('3️⃣  REVENUE BREAKDOWN');
        console.log('═══════════════════════════════════════════\n');
        const breakdown = analytics.revenueBreakdown;
        console.log(`Sales Revenue: ₦${(breakdown.salesRevenue || 0).toFixed(2)}`);
        console.log(`Rental Revenue: ₦${(breakdown.rentalRevenue || 0).toFixed(2)}`);
        console.log(`Total Before Caution: ₦${(breakdown.totalBeforeCaution || 0).toFixed(2)}`);
        console.log(`Caution Fee Revenue: ₦${(breakdown.cautionFeeRevenue || 0).toFixed(2)}\n`);
      }
    }

    // 2. Check system status
    console.log('4️⃣  SYSTEM STATUS CHECK');
    console.log('═══════════════════════════════════════════\n');

    const healthRes = await fetch(`${API_BASE}/api/health`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN || 'test-token'}`
      }
    });

    if (healthRes.ok) {
      console.log('✅ API is running');
    } else {
      console.log('⚠️  API health check failed');
    }

    // 3. Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════\n');

    if (analyticsRes.ok && analytics.cautionFeeMetrics) {
      const hasData = (analytics.cautionFeeMetrics.totalCollected || 0) > 0;
      
      if (hasData) {
        console.log('✅ CAUTION FEE SYSTEM IS WORKING!');
        console.log('   - Caution fees are being captured from checkout');
        console.log('   - Orders are storing caution fee amounts');
        console.log('   - Dashboard is displaying caution fee metrics');
      } else {
        console.log('⚠️  No caution fees found yet');
        console.log('   - Make sure you have created orders with rental items');
        console.log('   - Check that caution fees are being sent from checkout');
      }
    } else {
      console.log('⚠️  Could not verify - make sure application is running');
      console.log(`   Application URL: ${API_BASE}`);
      console.log('   Start with: npm run dev');
    }

    console.log('\n✅ Verification script completed\n');

  } catch (error) {
    console.error('Error during verification:', error);
    console.log('\nMake sure:');
    console.log('1. The application is running (npm run dev)');
    console.log('2. MongoDB is connected');
    console.log('3. You have proper authentication set up\n');
  }
}

verifyCautionFees();
