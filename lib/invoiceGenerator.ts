// Invoice Generator - Creates professional invoices for orders
import { CartItem } from "@/app/components/CartContext";
import { saveBuyerInvoice, saveAdminInvoice, StoredInvoice } from "./invoiceStorage";
import { generateProfessionalInvoiceHTML } from "./professionalInvoice";

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  orderNumber: string;
  
  // Customer details
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostalCode: string;
  
  // Items
  items: CartItem[];
  
  // Pricing
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  
  // Shipping preference
  shippingPreference: "empi" | "self";
  shippingMethod: string;
  
  // Company details
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  
  // Payment status
  paymentStatus: "pending" | "completed" | "failed";
  paymentMethod: string;
  
  currency: string;
  currencySymbol: string;
}

// Generate unique invoice number
export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

// Generate order number
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${random}${timestamp.toString().slice(-4)}`;
}

// Get due date (30 days from now)
export function getDueDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Format currency
export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Generate invoice data
export function createInvoiceData(params: {
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerPostalCode: string;
  shippingPreference: "empi" | "self";
  paymentMethod: string;
  currency: string;
  currencySymbol: string;
}): InvoiceData {
  const invoiceNumber = generateInvoiceNumber();
  const orderNumber = generateOrderNumber();
  const today = new Date().toISOString().split('T')[0];
  const dueDate = getDueDate(30);

  const shippingMethods: Record<string, string> = {
    empi: "EMPI Professional Delivery",
    self: "Self-Arranged Shipping",
  };

  return {
    invoiceNumber,
    invoiceDate: today,
    dueDate,
    orderNumber,
    
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    customerPhone: params.customerPhone,
    customerAddress: params.customerAddress,
    customerCity: params.customerCity,
    customerState: params.customerState,
    customerPostalCode: params.customerPostalCode,
    
    items: params.items,
    
    subtotal: params.subtotal,
    shippingCost: params.shippingCost,
    taxAmount: params.taxAmount,
    totalAmount: params.totalAmount,
    
    shippingPreference: params.shippingPreference,
    shippingMethod: shippingMethods[params.shippingPreference] || "Standard Shipping",
    
    companyName: "EMPI - Costume Rental & Sales",
    companyEmail: "info@empi.com",
    companyPhone: "+234 (0) 123-456-7890",
    companyAddress: "22 Ejire Street",
    companyCity: "Lagos",
    companyState: "Lagos State",
    
    paymentStatus: "completed",
    paymentMethod: params.paymentMethod,
    
    currency: params.currency,
    currencySymbol: params.currencySymbol,
  };
}

// Generate HTML invoice (for printing/PDF)
export function generateInvoiceHTML(invoice: InvoiceData): string {
  const itemsHTML = invoice.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price, invoice.currencySymbol)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(
        item.price * item.quantity,
        invoice.currencySymbol
      )}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .invoice-container {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 40px;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 2px solid #84cc16;
      padding-bottom: 20px;
    }
    .company-info h1 {
      margin: 0 0 10px 0;
      color: #84cc16;
      font-size: 28px;
    }
    .company-details {
      font-size: 13px;
      color: #666;
      line-height: 1.8;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details div {
      margin-bottom: 8px;
      font-size: 13px;
    }
    .detail-label {
      font-weight: bold;
      color: #333;
      display: inline-block;
      width: 120px;
      text-align: left;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      background: #f5f5f5;
      padding: 10px 15px;
      border-left: 4px solid #84cc16;
      font-weight: bold;
      margin-bottom: 15px;
      font-size: 13px;
      text-transform: uppercase;
    }
    .customer-info, .shipping-info {
      font-size: 13px;
      line-height: 1.8;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }
    table th {
      background: #84cc16;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    table td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    .totals {
      text-align: right;
      width: 100%;
      margin-bottom: 30px;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .totals-label {
      width: 150px;
      text-align: right;
      margin-right: 20px;
      color: #666;
    }
    .totals-amount {
      width: 120px;
      text-align: right;
      font-weight: bold;
    }
    .total-final {
      border-top: 2px solid #84cc16;
      border-bottom: 2px solid #84cc16;
      padding: 15px 0;
      font-size: 16px;
      font-weight: bold;
      color: #84cc16;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 11px;
      color: #999;
      text-align: center;
    }
    .status-badge {
      display: inline-block;
      background: #84cc16;
      color: white;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .invoice-container {
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>${invoice.companyName}</h1>
        <div class="company-details">
          <div>${invoice.companyAddress}</div>
          <div>${invoice.companyCity}, ${invoice.companyState}</div>
          <div>Email: ${invoice.companyEmail}</div>
          <div>Phone: ${invoice.companyPhone}</div>
        </div>
      </div>
      <div class="invoice-details">
        <div><span class="detail-label">Invoice Number:</span> ${invoice.invoiceNumber}</div>
        <div><span class="detail-label">Order Number:</span> ${invoice.orderNumber}</div>
        <div><span class="detail-label">Invoice Date:</span> ${invoice.invoiceDate}</div>
        <div><span class="detail-label">Due Date:</span> ${invoice.dueDate}</div>
        <div style="margin-top: 12px;"><span class="status-badge">✓ PAID</span></div>
      </div>
    </div>

    <!-- Customer Info -->
    <div class="section">
      <div class="section-title">Bill To</div>
      <div class="customer-info">
        <div><strong>${invoice.customerName}</strong></div>
        <div>${invoice.customerAddress}</div>
        <div>${invoice.customerCity}, ${invoice.customerState} ${invoice.customerPostalCode}</div>
        <div>Email: ${invoice.customerEmail}</div>
        <div>Phone: ${invoice.customerPhone}</div>
      </div>
    </div>

    <!-- Shipping Info -->
    <div class="section">
      <div class="section-title">Shipping Method</div>
      <div class="shipping-info">
        <div><strong>${invoice.shippingMethod}</strong></div>
        <div>Estimated Delivery: 3-5 business days</div>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th>Product Description</th>
          <th style="text-align: center; width: 80px;">Qty</th>
          <th style="text-align: right; width: 120px;">Unit Price</th>
          <th style="text-align: right; width: 120px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <div class="totals-label">Subtotal:</div>
        <div class="totals-amount">${formatCurrency(invoice.subtotal, invoice.currencySymbol)}</div>
      </div>
      <div class="totals-row">
        <div class="totals-label">Shipping:</div>
        <div class="totals-amount">${formatCurrency(invoice.shippingCost, invoice.currencySymbol)}</div>
      </div>
      <div class="totals-row">
        <div class="totals-label">VAT (7.5%):</div>
        <div class="totals-amount">${formatCurrency(invoice.taxAmount, invoice.currencySymbol)}</div>
      </div>
      <div class="totals-row total-final">
        <div class="totals-label">Total Amount:</div>
        <div class="totals-amount">${formatCurrency(invoice.totalAmount, invoice.currencySymbol)}</div>
      </div>
    </div>

    <!-- Payment Info -->
    <div class="section">
      <div class="section-title">Payment Information</div>
      <div style="font-size: 13px; color: #555; line-height: 1.8;">
        <div><strong>Payment Method:</strong> ${invoice.paymentMethod}</div>
        <div><strong>Payment Status:</strong> <span style="color: #84cc16; font-weight: bold;">✓ COMPLETED</span></div>
        <div><strong>Payment Date:</strong> ${invoice.invoiceDate}</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your business! Please keep this invoice for your records.</p>
      <p>For any questions, contact us at ${invoice.companyEmail} or ${invoice.companyPhone}</p>
      <p>Invoice generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Auto-print on load (optional)
    // window.print();
  </script>
</body>
</html>
  `;
}

// Generate plain text invoice
export function generateInvoiceText(invoice: InvoiceData): string {
  const itemsText = invoice.items
    .map(
      (item) =>
        `${item.name.padEnd(40)} ${item.quantity.toString().padStart(5)} ${formatCurrency(item.price, invoice.currencySymbol).padStart(15)} ${formatCurrency(
          item.price * item.quantity,
          invoice.currencySymbol
        ).padStart(15)}`
    )
    .join("\n");

  return `
╔══════════════════════════════════════════════════════════════════════╗
║                            INVOICE RECEIPT                           ║
╚══════════════════════════════════════════════════════════════════════╝

INVOICE NUMBER: ${invoice.invoiceNumber}
ORDER NUMBER: ${invoice.orderNumber}
INVOICE DATE: ${invoice.invoiceDate}
DUE DATE: ${invoice.dueDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BILL TO:
${invoice.customerName}
${invoice.customerAddress}
${invoice.customerCity}, ${invoice.customerState} ${invoice.customerPostalCode}
Email: ${invoice.customerEmail}
Phone: ${invoice.customerPhone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SHIPPING METHOD: ${invoice.shippingMethod}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ITEMS:
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                                                Subtotal: ${formatCurrency(invoice.subtotal, invoice.currencySymbol).padStart(20)}
                                                Shipping: ${formatCurrency(invoice.shippingCost, invoice.currencySymbol).padStart(20)}
                                              VAT (7.5%): ${formatCurrency(invoice.taxAmount, invoice.currencySymbol).padStart(20)}
                                         ─────────────────────
                                        TOTAL AMOUNT: ${formatCurrency(invoice.totalAmount, invoice.currencySymbol).padStart(20)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PAYMENT INFORMATION:
Payment Method: ${invoice.paymentMethod}
Payment Status: ✓ COMPLETED
Payment Date: ${invoice.invoiceDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Thank you for your business!
For support, contact: ${invoice.companyEmail} | ${invoice.companyPhone}

Generated: ${new Date().toLocaleString()}

  `;
}

// Save invoice to localStorage (both buyer and admin)
export function saveInvoice(invoice: InvoiceData, buyerId?: string): void {
  if (typeof window === "undefined") return;

  try {
    // Convert InvoiceData to StoredInvoice format
    const storedInvoice: StoredInvoice = {
      invoiceNumber: invoice.invoiceNumber,
      orderNumber: invoice.orderNumber,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      customerCity: invoice.customerCity,
      customerState: invoice.customerState,
      customerPostalCode: invoice.customerPostalCode,
      
      buyerId: buyerId,
      
      items: invoice.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        mode: item.mode,
      })),
      
      subtotal: invoice.subtotal,
      shippingCost: invoice.shippingCost,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      
      shippingPreference: invoice.shippingPreference,
      shippingMethod: invoice.shippingMethod,
      
      paymentStatus: invoice.paymentStatus,
      paymentMethod: invoice.paymentMethod,
      
      currency: invoice.currency,
      currencySymbol: invoice.currencySymbol,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to both buyer and admin storage
    saveBuyerInvoice(storedInvoice);
    saveAdminInvoice(storedInvoice);
    
    console.log("✅ Invoice saved to both buyer and admin:", invoice.invoiceNumber, "for buyer:", buyerId);
  } catch (error) {
    console.error("❌ Failed to save invoice:", error);
  }
}

// Get invoice by number
export function getInvoice(invoiceNumber: string): InvoiceData | null {
  if (typeof window === "undefined") return null;

  try {
    const invoices = JSON.parse(localStorage.getItem("empi_invoices") || "[]");
    return invoices.find((inv: InvoiceData) => inv.invoiceNumber === invoiceNumber) || null;
  } catch (error) {
    console.error("❌ Failed to get invoice:", error);
    return null;
  }
}

// Get all invoices
export function getAllInvoices(): InvoiceData[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem("empi_invoices") || "[]");
  } catch (error) {
    console.error("❌ Failed to get invoices:", error);
    return [];
  }
}
