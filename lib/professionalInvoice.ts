// Mobile-Optimized Professional Invoice HTML Template
import { StoredInvoice } from "./invoiceStorage";

export function generateProfessionalInvoiceHTML(invoice: StoredInvoice): string {
  const invoiceDate = new Date(invoice.invoiceDate);
  const dateStr = invoiceDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { font-size: 16px; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
      line-height: 1.6; 
      color: #1f2937; 
      background: #f3f4f6; 
      padding: 12px;
    }
    .invoice-container { 
      max-width: 100%; 
      margin: 0 auto; 
      background: white; 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    
    /* HEADER */
    .invoice-header { 
      background: white; 
      color: #111827; 
      padding: 20px 16px; 
      border-bottom: 3px solid #10b981;
    }
    .header-content { 
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-top { 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      gap: 12px;
    }
    .logo-section { 
      display: flex; 
      align-items: center; 
      gap: 8px;
    }
    .logo-img { 
      width: 40px; 
      height: 40px; 
      object-fit: contain;
    }
    .company-name { 
      font-size: 20px; 
      font-weight: 900; 
      color: #111827;
    }
    .status-badge { 
      background: #10b981; 
      color: white; 
      padding: 5px 12px; 
      border-radius: 20px; 
      font-size: 10px; 
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
    .header-info { 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .info-item { 
      min-width: 0;
    }
    .info-label { 
      font-size: 9px; 
      font-weight: 600; 
      text-transform: uppercase; 
      color: #6b7280; 
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .info-value { 
      font-size: 13px; 
      font-weight: 700; 
      color: #111827;
      word-break: break-word;
    }
    
    /* CONTENT */
    .invoice-content { 
      padding: 16px;
    }
    .section-title { 
      font-size: 11px; 
      font-weight: 800; 
      text-transform: uppercase; 
      color: #374151; 
      letter-spacing: 0.8px;
      margin: 16px 0 12px 0;
      display: flex;
      align-items: center;
    }
    .section-title::before { 
      content: '';
      width: 3px;
      height: 14px;
      background: #10b981;
      border-radius: 2px;
      margin-right: 8px;
    }
    
    /* CUSTOMER INFO CARDS */
    .info-grid { 
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-box { 
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
    }
    .info-box h4 { 
      font-size: 10px; 
      font-weight: 700; 
      color: #6b7280; 
      text-transform: uppercase; 
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .info-box strong { 
      display: block; 
      color: #111827; 
      font-weight: 700; 
      font-size: 14px;
      margin-bottom: 4px;
      word-break: break-word;
    }
    .info-box p { 
      font-size: 12px; 
      color: #6b7280; 
      margin-bottom: 3px;
      word-break: break-word;
    }
    
    /* ITEMS TABLE - SCROLLABLE ROWS */
    .items-section { 
      margin-bottom: 20px;
    }
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .scroll-indicator {
      font-size: 10px;
      color: #10b981;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .items-wrapper {
      position: relative;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: white;
    }
    .items-table { 
      width: 100%;
      min-width: 600px;
      border-collapse: collapse;
      margin: 0;
    }
    .items-table thead { 
      background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);
      border-bottom: 2px solid #10b981;
      display: table-header-group;
    }
    .items-table thead th { 
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #374151;
      letter-spacing: 0.5px;
      white-space: nowrap;
      border-right: 1px solid #d1d5db;
    }
    .items-table thead th:last-child {
      border-right: none;
    }
    .items-table tbody { 
      display: table-row-group;
    }
    .items-table tbody tr { 
      border-bottom: 1px solid #f0f0f0;
      display: table-row;
      background: none;
      border: none;
      margin-bottom: 0;
    }
    .items-table tbody tr:hover { 
      background: linear-gradient(90deg, #f9fafb 0%, #ffffff 100%);
    }
    .items-table td { 
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      display: table-cell;
      font-size: 13px;
      color: #374151;
      font-weight: 500;
      border-right: 1px solid #f0f0f0;
      white-space: nowrap;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .item-name { 
      font-weight: 700; 
      color: #111827;
      font-size: 13px;
    }
      background: white;
    }
    .items-table tbody tr:hover {
      background: linear-gradient(90deg, #f9fafb 0%, #ffffff 100%);
    }
    .items-table td { 
      padding: 14px 16px;
      font-size: 13px;
      color: #374151;
      border-right: 1px solid #e5e7eb;
      display: table-cell;
      white-space: nowrap;
    }
    .items-table td:last-child {
      border-right: none;
    }
    .item-name { 
      font-weight: 700; 
      color: #111827;
      white-space: normal;
    }
    .item-qty {
      font-weight: 700;
      color: #10b981;
      text-align: center;
    }
    .item-price {
      font-weight: 600;
      color: #6b7280;
      text-align: right;
    }
    .item-total {
      font-weight: 800;
      color: #10b981;
      text-align: right;
    }
    
    /* TOTALS */
    .summary-section { 
      margin-bottom: 20px;
    }
    .payment-note { 
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.03));
      border-left: 4px solid #10b981;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      color: #047857;
      font-weight: 500;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .totals-box { 
      background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
      border: 2px solid #fcd34d;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(251, 191, 36, 0.1);
    }
    .totals-row { 
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 13px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255,255,255,0.6);
    }
    .totals-row.total-row { 
      font-size: 16px;
      font-weight: 800;
      color: #10b981;
      border-top: 2px solid #fcd34d;
      border-bottom: none;
      padding-top: 8px;
      margin-top: 4px;
      padding-bottom: 0;
    }
    .totals-row span:first-child { 
      color: #78350f; 
      font-weight: 600;
    }
    .totals-row span:last-child { 
      font-weight: 700; 
      color: #78350f;
    }
    
    /* FOOTER */
    .invoice-footer { 
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-top: 2px solid #e5e7eb;
      padding: 16px;
      font-size: 10px;
      color: #6b7280;
      text-align: center;
    }
    .footer-divider { 
      display: grid;
      grid-template-columns: 1fr;
      gap: 6px;
      margin-bottom: 8px;
    }
    .footer-divider span { 
      border-right: none;
      padding-right: 0;
      font-weight: 500;
      color: #374151;
      word-break: break-all;
    }
    .footer-divider span:last-child { 
      padding-right: 0;
    }
    .footer-text {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.4;
    }
    .footer-contact {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 9px;
    }
    .footer-contact p {
      margin: 2px 0;
    }
    
    /* PDF & PRINTING OPTIMIZATIONS */
    @media (prefers-color-scheme: light) {
      body { background: white; }
    }
    
    @page {
      size: A4;
      margin: 10mm;
    }
    
    /* MEDIA QUERIES */
    @media (min-width: 640px) {
      body { padding: 20px; }
      .invoice-container { border-radius: 24px; }
      .invoice-header { padding: 32px; }
      .header-info { grid-template-columns: 1fr 1fr 1fr; }
      .invoice-content { padding: 32px; }
      .info-grid { grid-template-columns: 1fr 1fr 1fr; }
      .items-table thead { display: table-header-group; }
      .items-table thead th { 
        padding: 12px; 
        text-align: left;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #374151;
        background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);
        border-bottom: 2px solid #10b981;
      }
      .items-table tbody tr { 
        display: table-row;
        background: none;
        border: none;
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 0;
      }
      .items-table tbody tr:hover { 
        background: linear-gradient(90deg, #f9fafb 0%, #ffffff 100%);
      }
      .items-table td { 
        padding: 14px 12px;
        border-bottom: 1px solid #f0f0f0;
        display: table-cell;
      }
      .scroll-indicator { display: none; }
      .item-name { 
        padding: 0;
        font-size: 13px;
      }
      .item-qty,
      .item-price,
      .item-total {
        font-size: 13px;
      }
      .item-total { 
        border-top: none;
        margin-top: 0;
        padding-top: 14px;
      }
      .summary-section { 
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
      }
      .footer-divider { grid-template-columns: auto auto auto; gap: 24px; }
      .footer-divider span { border-right: 1px solid #d1d5db; padding-right: 24px; }
      .footer-divider span:last-child { border-right: none; padding-right: 0; }
    }
    
    @media print { 
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body { 
        background: white !important; 
        padding: 0 !important;
        margin: 0 !important;
      }
      .invoice-container { 
        box-shadow: none !important; 
        border-radius: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .invoice-header { 
        page-break-after: avoid;
        padding: 10mm !important;
      }
      .invoice-content { 
        page-break-inside: avoid;
        padding: 10mm !important;
      }
      .items-section { 
        page-break-inside: avoid;
      }
      .items-wrapper {
        overflow-x: visible;
      }
      .items-wrapper::after { display: none !important; }
      .summary-section {
        page-break-inside: avoid;
      }
      .invoice-footer {
        page-break-before: auto;
        margin-top: 10mm;
      }
      body { 
        font-size: 9pt !important;
      }
      table { 
        border-collapse: collapse !important;
      }
      .info-grid {
        background: white !important;
        border: none !important;
      }
      .info-box{
        background: white !important;
        border: 1px solid #ccc !important;
        page-break-inside: avoid;
      }
    }
    
    /* MOBILE-SPECIFIC ADJUSTMENTS */
    @media (max-width: 500px) {
      body { padding: 8px; font-size: 14px; }
      .invoice-header { padding: 12px; }
      .invoice-content { padding: 12px; }
      .header-info { grid-template-columns: 1fr; gap: 8px; }
      .info-grid { 
        gap: 8px; 
        margin-bottom: 12px;
        grid-template-columns: 1fr 1fr;
      }
      .info-grid .info-box:nth-child(1) {
        grid-column: 1 / -1;
      }
      .info-grid .info-box:nth-child(3) {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: 2px solid #047857;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }
      .info-grid .info-box:nth-child(3) h4 {
        color: rgba(255, 255, 255, 0.8);
      }
      .info-grid .info-box:nth-child(3) strong {
        color: white;
        font-size: 18px;
      }
      .info-grid .info-box:nth-child(3) p {
        color: rgba(255, 255, 255, 0.8);
      }
      .info-box { padding: 10px; }
      .totals-box { padding: 12px; }
      .summary-section { 
        gap: 12px; 
        display: flex;
        flex-direction: column;
      }
      .payment-note {
        order: 2;
        margin-bottom: 0;
      }
      .totals-box {
        order: 1;
      }
      .footer-divider { gap: 4px; }
      .info-label { font-size: 8px; }
      .info-value { font-size: 12px; }
      .items-table { min-width: 600px; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- HEADER -->
    <div class="invoice-header">
      <div class="header-content">
        <div class="header-top">
          <div class="logo-section">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAACE4AAAhOAFmwQcnAAABpElEQVR4nO3YwUrDMBCG4ZA7iJ5EsV7Fi4gHQRBFPYiCB0Hx4tGTZ09e9OpBeAzBiyBqb56k15O0pGmTZJrZzPwwH8wBGfj2m2Q3SSccx3H+JXmelzUajRwAiKIoRZZlMZ1OR4vFYrJcLhfr9foyiiKMbMux7RskSRK0Wi0Wy+VyQ6GUyj7PY1mWlCRJNJ1OJ4vFYkWhVKrVajGbzcZCoRBIkmShkIlEIikSHo+n1mq1OBxUyhT9fp/pdBqPx+NRqVSSJEnkcrkMc9sKhUIg/X6faTabdF1HUZSEvt/PyeXyxnWBfD4fyuOYzWbmdR0gn89HvV6PXq+HLMuKxqWnpmJbFi6Xi2azycjj8RBFUb/f1wVyPp85HA7Z5/OhKAq6rj/v0Ov18jAY/VvdbleXiJZlKZZlKZZlxRRK6RP/EB0iO4RGsCOQHUIjWBAzsgNoBGoH5BSoHUAjUDsgKyBTdwBoB9AOyAoIs3cAaAfQDsgKIHsBaAfQDsgKwJIaAvwNvz+gHZAVEGbvANAOoB2QFRBm7wDQDqAdkBUAaAdkBQDaAVkBQDuAdiAL+AVm/w7RpmOC5gAAAABJRU5ErkJggg==" alt="EMPI Logo" class="logo-img">
            <div class="company-name">EMPI</div>
          </div>
          <div class="status-badge">PAID</div>
        </div>
        
        <div class="header-info">
          <div class="info-item">
            <div class="info-label">Invoice #</div>
            <div class="info-value">${invoice.invoiceNumber}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${dateStr}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Amount</div>
            <div class="info-value">${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CONTENT -->
    <div class="invoice-content">
      <!-- CUSTOMER INFO -->
      <div class="section-title">Order Details</div>
      <div class="info-grid">
        <div class="info-box">
          <h4>👤 Customer</h4>
          <strong>${invoice.customerName}</strong>
          <p>${invoice.customerEmail}</p>
          <p>${invoice.customerPhone}</p>
        </div>
        <div class="info-box">
          <h4>📦 Items</h4>
          <strong>${invoice.items.length} ${invoice.items.length === 1 ? 'Item' : 'Items'}</strong>
          <p>Status: Paid</p>
          <p>Date: ${dateStr}</p>
        </div>
        <div class="info-box">
          <h4>💰 Total</h4>
          <strong>${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</strong>
          <p>Payment Received</p>
        </div>
      </div>
      
      <!-- ITEMS -->
      <div class="items-section">
        <div class="items-header">
          <div class="section-title">Items Ordered</div>
          <div class="scroll-indicator">→ Scroll right</div>
        </div>
        <div class="items-wrapper">
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item) => `
                <tr>
                  <td><span class="item-name">${item.name}</span></td>
                  <td><span class="item-qty">${item.quantity}</span></td>
                  <td><span class="item-price">${invoice.currencySymbol}${item.price.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</span></td>
                  <td><span class="item-total">${invoice.currencySymbol}${(item.quantity * item.price).toLocaleString('en-NG', { maximumFractionDigits: 2 })}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- SUMMARY -->
      <div class="summary-section">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${invoice.currencySymbol}${invoice.subtotal.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</span>
          </div>
          ${invoice.shippingCost > 0 ? `<div class="totals-row"><span>Shipping</span><span>${invoice.currencySymbol}${invoice.shippingCost.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</span></div>` : ''}
          ${invoice.taxAmount > 0 ? `<div class="totals-row"><span>Tax</span><span>${invoice.currencySymbol}${invoice.taxAmount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</span></div>` : ''}
          <div class="totals-row total-row">
            <span>Total</span>
            <span>${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        
        <div class="payment-note">
          ✓ Your payment has been received and processed. Thank you for your purchase!
        </div>
      </div>
    </div>
    
    <!-- FOOTER -->
    <div class="invoice-footer">
      <div class="footer-divider">
        <span><strong>EMPI © 2024</strong></span>
        <span><strong>#${invoice.invoiceNumber}</strong></span>
      </div>
      <div class="footer-contact">
        <p>📧 info@empi.com</p>
        <p>📍 Lagos, Nigeria</p>
        <p style="margin-top: 6px; font-size: 9px;">Thank you for choosing EMPI!</p>
      </div>
    </div>
  </div>
</body>
  
  <script>
    function downloadPDF() {
      const filename = 'Invoice-${invoice.invoiceNumber}.html';
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], {type: 'text/html'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  </script>
</body>
</html>`;

  return html;
}
