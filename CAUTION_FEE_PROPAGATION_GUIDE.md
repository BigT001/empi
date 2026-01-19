# CAUTION FEE PROPAGATION GUIDE

## How to Add Caution Fees to Other Pages

This guide shows you how to display caution fee information on customer-facing and admin pages throughout your application.

---

## 1. CUSTOMER INVOICE/RECEIPT PAGE

### Location
Create or update: `app/invoice/[orderId]/page.tsx`

### Implementation

```tsx
import { formatCurrency } from '@/lib/utils/format';
import Order from '@/lib/models/Order';

export default async function InvoicePage({ params }: { params: { orderId: string } }) {
  const order = await Order.findById(params.orderId).lean();
  
  if (!order) return <div>Order not found</div>;

  const cautionFee = (order.cautionFee as number) || 0;
  const rentalItems = order.items?.filter((item: any) => item.mode === 'rent') || [];

  return (
    <div className="invoice-container">
      {/* ... existing invoice content ... */}
      
      {/* Caution Fee Section */}
      {cautionFee > 0 && (
        <div className="caution-fee-section border-t-2 border-purple-200 mt-6 pt-6">
          <div className="flex justify-between mb-4">
            <span className="text-sm font-semibold text-gray-700">
              🔒 Caution Fee (Refundable Deposit)
            </span>
            <span className="text-sm font-bold text-purple-900">
              {formatCurrency(cautionFee)}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 bg-purple-50 p-3 rounded">
            <p className="mb-2">
              This deposit covers {rentalItems.length} rental item(s) and will be refunded 
              within 7-10 business days of return in good condition.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Full refund for items returned undamaged</li>
              <li>Partial refund if cleaning or minor repairs needed</li>
              <li>Forfeited only for lost or severely damaged items</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Order Total with Caution Fee */}
      <div className="flex justify-between text-lg font-bold mt-4">
        <span>Total (including deposit):</span>
        <span className="text-purple-900">
          {formatCurrency((order.total as number) + cautionFee)}
        </span>
      </div>
    </div>
  );
}
```

---

## 2. CUSTOMER ORDER HISTORY PAGE

### Location
Update: `app/account/orders/page.tsx`

### Implementation

```tsx
import Order from '@/lib/models/Order';

interface OrderItemProps {
  order: any;
}

export function OrderHistoryItem({ order }: OrderItemProps) {
  const cautionFee = (order.cautionFee as number) || 0;
  const hasRentals = order.items?.some((item: any) => item.mode === 'rent');

  return (
    <div className="order-card border rounded-lg p-4 mb-4">
      {/* ... existing order info ... */}
      
      {/* Caution Fee Display */}
      {hasRentals && cautionFee > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-600">🔒 Caution Fee: </span>
              <span className="font-semibold text-purple-900">
                ₦{Math.round(cautionFee).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              {/* Show refund status here - tied to CautionFeeTransaction */}
              Status: Pending Return
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// In main component:
export default async function OrderHistoryPage() {
  const orders = await Order.find({ buyerId: userId }).lean();

  return (
    <div>
      {orders.map((order) => (
        <OrderHistoryItem key={order._id.toString()} order={order} />
      ))}
    </div>
  );
}
```

---

## 3. ADMIN ORDER DETAIL PAGE

### Location
Update: `app/admin/orders/[orderId]/page.tsx`

### Implementation

```tsx
import { getCautionFeeInfo, getRefundStatus } from '@/lib/utils/cautionFeeUtils';

export default async function AdminOrderDetailPage({ params }: { params: { orderId: string } }) {
  const order = await Order.findById(params.orderId).lean();
  const cautionFee = (order.cautionFee as number) || 0;
  
  // Get associated caution fee transaction record
  const feeTransaction = cautionFee > 0 
    ? await CautionFeeTransaction.findOne({ orderId: params.orderId }).lean()
    : null;

  return (
    <div className="order-detail-page">
      {/* ... existing order content ... */}
      
      {/* Caution Fee Management Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border-2 border-purple-200 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Caution Fee Management</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fee Amount */}
          <div>
            <p className="text-sm font-medium text-gray-600">Fee Amount</p>
            <p className="text-2xl font-bold text-purple-900">
              ₦{Math.round(cautionFee).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">50% of rental items subtotal</p>
          </div>
          
          {/* Current Status */}
          <div>
            <p className="text-sm font-medium text-gray-600">Current Status</p>
            <div className="mt-1">
              {feeTransaction ? (
                <StatusBadge status={feeTransaction.status} />
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  Pending Return
                </span>
              )}
            </div>
          </div>
          
          {/* Collection Date */}
          <div>
            <p className="text-sm font-medium text-gray-600">Collection Date</p>
            <p className="text-gray-900">
              {order.createdAt ? new Date(order.createdAt as Date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          {/* Refund Status */}
          {feeTransaction && (
            <div>
              <p className="text-sm font-medium text-gray-600">Refund Timeline</p>
              <p className="text-gray-900">
                {feeTransaction.timeline?.refundedAt 
                  ? `Refunded: ${new Date(feeTransaction.timeline.refundedAt as Date).toLocaleDateString()}`
                  : 'Awaiting return'}
              </p>
            </div>
          )}
        </div>
        
        {/* Rental Items Breakdown */}
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-medium text-gray-600 mb-3">Rental Items (Caution Fee Base)</p>
          <div className="space-y-2">
            {order.items?.filter((item: any) => item.mode === 'rent').map((item: any) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name} × {item.quantity}</span>
                <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm font-semibold mt-3 pt-3 border-t">
            <span>Caution Fee (50%)</span>
            <span className="text-purple-900">₦{Math.round(cautionFee).toLocaleString()}</span>
          </div>
        </div>
        
        {/* Admin Actions */}
        <div className="mt-6 pt-6 border-t flex gap-2">
          {feeTransaction?.status === 'pending_return' && (
            <>
              <button className="px-4 py-2 bg-green-100 text-green-900 rounded hover:bg-green-200">
                Mark as Returned & Refund
              </button>
              <button className="px-4 py-2 bg-blue-100 text-blue-900 rounded hover:bg-blue-200">
                Process Partial Refund
              </button>
              <button className="px-4 py-2 bg-red-100 text-red-900 rounded hover:bg-red-200">
                Mark as Lost/Forfeited
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. FINANCE/ACCOUNTING REPORTS PAGE

### Location
Create: `app/admin/reports/caution-fees/page.tsx`

### Implementation

```tsx
import { formatCurrency } from '@/lib/utils/format';

export default async function CautionFeeReportsPage() {
  // Fetch analytics
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics`);
  const analytics = await res.json();
  const metrics = analytics.cautionFeeMetrics;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🔒 Caution Fee Financial Report</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <ReportCard 
          title="Total Collected"
          amount={metrics.totalCollected}
          color="purple"
          description="Deposits held"
        />
        <ReportCard 
          title="Refunded"
          amount={metrics.totalRefunded}
          color="blue"
          description="Full refunds"
        />
        <ReportCard 
          title="Partial Refunds"
          amount={metrics.totalPartiallyRefunded}
          color="yellow"
          description="With deductions"
        />
        <ReportCard 
          title="Forfeited"
          amount={metrics.totalForfeited}
          color="red"
          description="Lost items"
        />
        <ReportCard 
          title="Refund Rate"
          amount={`${metrics.refundRate.toFixed(1)}%`}
          color="green"
          description={`~${metrics.averageRefundDays}d avg`}
        />
      </div>

      {/* Liability Assessment */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">Current Liability</h2>
        <div className="text-3xl font-bold text-purple-900 mb-2">
          ₦{formatCurrency(metrics.totalCollected - metrics.totalRefunded - metrics.totalPartiallyRefunded - metrics.totalForfeited)}
        </div>
        <p className="text-sm text-gray-600">
          Caution fees still pending return to customers
        </p>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Refund Trends (Last 30 Days)</h2>
        {/* Add chart library (Chart.js, Recharts, etc.) */}
        <p className="text-gray-600">Chart visualization here</p>
      </div>
    </div>
  );
}

function ReportCard({ title, amount, color, description }: any) {
  const bgColor = `bg-${color}-50`;
  const borderColor = `border-${color}-200`;
  const textColor = `text-${color}-900`;

  return (
    <div className={`${bgColor} border ${borderColor} p-4 rounded-lg`}>
      <p className={`text-xs font-medium ${textColor} mb-1`}>{title}</p>
      <p className={`text-lg font-bold ${textColor}`}>{amount}</p>
      <p className={`text-xs text-${color}-600 mt-2`}>{description}</p>
    </div>
  );
}
```

---

## 5. EMAIL NOTIFICATION TEMPLATES

### Location
Create: `lib/email-templates/caution-fee-notification.tsx`

### Implementation

```tsx
import { formatCurrency } from '@/lib/utils/format';

interface CautionFeeEmailProps {
  customerName: string;
  orderId: string;
  cautionFee: number;
  items: any[];
  rentalEndDate: string;
}

export function CautionFeeNotificationEmail({
  customerName,
  orderId,
  cautionFee,
  items,
  rentalEndDate,
}: CautionFeeEmailProps) {
  return (
    <div>
      <h2>Caution Fee Confirmation - Order {orderId}</h2>
      
      <p>Hi {customerName},</p>
      
      <p>
        Thank you for your rental order! We've charged a refundable caution fee (deposit) 
        to ensure our costumes are returned in excellent condition.
      </p>
      
      <div style={{ backgroundColor: '#f3e8ff', padding: '16px', borderRadius: '8px', marginY: '16px' }}>
        <strong>Caution Fee: ₦{formatCurrency(cautionFee)}</strong>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
          This covers {items.length} rental items and is 100% refundable.
        </p>
      </div>
      
      <h3>Rental Items:</h3>
      <ul>
        {items.map((item) => (
          <li key={item.productId}>
            {item.name} × {item.quantity} - ₦{formatCurrency(item.price * item.quantity)}
          </li>
        ))}
      </ul>
      
      <h3>Refund Terms:</h3>
      <ul>
        <li>✅ Full refund if items returned by {rentalEndDate} in good condition</li>
        <li>✅ Partial refund available if cleaning or repairs are needed</li>
        <li>⚠️ Fees forfeited only for lost or severely damaged items</li>
        <li>⏱️ Refunds processed within 7-10 business days</li>
      </ul>
      
      <p>Need help? Contact our support team at support@company.com</p>
    </div>
  );
}

// Usage in order confirmation email:
export function OrderConfirmationEmail(order: any) {
  return (
    <div>
      {/* ... existing order details ... */}
      
      {order.cautionFee > 0 && (
        <CautionFeeNotificationEmail
          customerName={order.buyerName}
          orderId={order._id}
          cautionFee={order.cautionFee}
          items={order.items.filter((i: any) => i.mode === 'rent')}
          rentalEndDate={/* calculate from rental schedule */}
        />
      )}
    </div>
  );
}
```

---

## 6. QUICK REFERENCE - IMPORT PATHS

```typescript
// Utility functions
import { calculateCautionFeeAmount } from '@/lib/utils/cautionFeeUtils';
import { calculateCautionFeeDetailed } from '@/lib/utils/cautionFeeUtils';
import { validateCautionFeeForOrder } from '@/lib/utils/cautionFeeUtils';

// Formatting
import { formatCurrency } from '@/lib/utils/format';

// Models
import Order from '@/lib/models/Order';
import CautionFeeTransaction from '@/lib/models/CautionFeeTransaction';
```

---

## 7. COMPONENT TEMPLATE - REUSABLE

```tsx
// Create: app/admin/components/CautionFeeSection.tsx

interface CautionFeeSectionProps {
  order: any;
  showActions?: boolean;
  onRefund?: (orderId: string) => void;
}

export function CautionFeeSection({ order, showActions = false, onRefund }: CautionFeeSectionProps) {
  const cautionFee = (order.cautionFee as number) || 0;

  if (!cautionFee || cautionFee === 0) return null;

  return (
    <div className="bg-purple-50 border-2 border-purple-200 p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-900">🔒 Caution Fee</h3>
        <div className="text-2xl font-bold text-purple-900">
          ₦{Math.round(cautionFee).toLocaleString()}
        </div>
      </div>
      
      <p className="text-sm text-gray-700 mb-4">
        Refundable deposit on {order.items.filter((i: any) => i.mode === 'rent').length} rental items
      </p>
      
      {showActions && (
        <div className="flex gap-2">
          <button 
            onClick={() => onRefund?.(order._id)}
            className="px-3 py-2 bg-green-100 text-green-900 rounded hover:bg-green-200 text-sm"
          >
            Refund
          </button>
        </div>
      )}
    </div>
  );
}

// Usage anywhere:
import { CautionFeeSection } from '@/app/admin/components/CautionFeeSection';

export function SomeAdminPage() {
  return (
    <div>
      <CautionFeeSection order={order} showActions={true} />
    </div>
  );
}
```

---

## 8. IMPLEMENTATION CHECKLIST

- [ ] Customer Invoice/Receipt Page - Show caution fee with refund terms
- [ ] Customer Order History - Display caution fee per order
- [ ] Admin Order Detail - Full fee management interface
- [ ] Finance Reports - Liability tracking and trends
- [ ] Email Templates - Confirmation and refund notifications
- [ ] Create Reusable Component - CautionFeeSection for consistency
- [ ] Database Indexes - Add indexes on cautionFee field for reporting
- [ ] Tests - Unit tests for caution fee calculations
- [ ] Documentation - Update user guides with caution fee info

---

## 9. DEPLOYMENT NOTES

1. **Database Migration**: No new migrations needed - `cautionFee` field already in Order model
2. **Feature Flag**: Consider enabling caution fees gradually via feature flags
3. **Monitoring**: Track caution fee metrics in your analytics
4. **Support Training**: Update support team on caution fee refund process
5. **Customer Communication**: Update terms of service with caution fee policy

---

**Ready to implement!** Start with the customer-facing pages (Invoice, Order History) then move to admin pages.
