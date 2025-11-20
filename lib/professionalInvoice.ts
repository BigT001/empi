// Professional Invoice HTML Template
import { StoredInvoice } from "./invoiceStorage";

export function generateProfessionalInvoiceHTML(invoice: StoredInvoice): string {
  const invoiceDate = new Date(invoice.invoiceDate);
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  // Prepare WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `Hello! 🎉\n\nHere's your invoice for your recent purchase at EMPI.\n\n` +
    `Invoice #: ${invoice.invoiceNumber}\n` +
    `Order #: ${invoice.orderNumber}\n` +
    `Amount: ${invoice.currencySymbol || "₦"}${invoice.totalAmount.toFixed(2)}\n\n` +
    `Thank you for shopping with us! 👔✨`
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a202c;
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      padding: 20px;
    }
    
    .invoice-container {
      max-width: 920px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.14);
      border-radius: 16px;
      overflow: hidden;
    }
    
    /* Premium Dark Header */
    .invoice-header {
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      color: white;
      padding: 60px 50px;
      position: relative;
      overflow: hidden;
    }
    
    .invoice-header::before {
      content: '';
      position: absolute;
      top: -40%;
      right: -40%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(132, 204, 22, 0.08) 0%, transparent 70%);
      border-radius: 50%;
    }
    
    .header-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      position: relative;
      z-index: 1;
    }
    
    .company-branding {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .company-logo-box {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .company-logo {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 28px;
      color: white;
      box-shadow: 0 8px 16px rgba(132, 204, 22, 0.3);
      flex-shrink: 0;
    }
    
    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 4px;
    }
    
    .company-name-box h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }
    
    .company-tagline {
      font-size: 14px;
      opacity: 0.7;
      margin-bottom: 25px;
    }
    
    .company-details {
      font-size: 13px;
      opacity: 0.75;
      line-height: 2;
    }
    
    .company-details p {
      margin-bottom: 3px;
    }
    
    .invoice-meta {
      text-align: right;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    
    .invoice-meta-item {
      margin-bottom: 20px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 15px;
    }
    
    .meta-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.6;
      letter-spacing: 1px;
      min-width: 100px;
      text-align: right;
    }
    
    .meta-value {
      font-size: 15px;
      font-weight: 600;
      background: rgba(132, 204, 22, 0.15);
      padding: 6px 14px;
      border-radius: 6px;
      border-left: 3px solid #84cc16;
    }
    
    .status-badge {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      margin-top: 10px;
    }
    
    /* Main Content */
    .invoice-content {
      padding: 40px;
    }
    
    /* Bill To Section */
    .bill-to-section {
      margin-bottom: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .bill-to-section h3 {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4a5568;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    
    .bill-to-section p {
      font-size: 14px;
      line-height: 1.8;
      color: #2d3748;
      margin-bottom: 4px;
    }
    
    .bill-to-section strong {
      display: block;
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 8px;
    }
    
    .bill-info-group {
      margin-bottom: 20px;
    }
    
    .bill-info-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #718096;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    /* Items Table */
    .items-section {
      margin-bottom: 40px;
    }
    
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .items-table thead {
      background: #f7fafc;
      border-top: 2px solid #84cc16;
      border-bottom: 2px solid #84cc16;
    }
    
    .items-table th {
      padding: 16px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: #2d3748;
      letter-spacing: 0.5px;
    }
    
    .items-table th:nth-child(2),
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) {
      text-align: right;
    }
    
    .items-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
      transition: background 0.2s;
    }
    
    .items-table tbody tr:last-child {
      border-bottom: none;
    }
    
    .items-table tbody tr:hover {
      background: #f7fafc;
    }
    
    .items-table td {
      padding: 16px 12px;
      font-size: 14px;
      color: #2d3748;
    }
    
    .items-table td:nth-child(2),
    .items-table td:nth-child(3),
    .items-table td:nth-child(4) {
      text-align: right;
    }
    
    .item-name {
      font-weight: 600;
      color: #1a202c;
    }
    
    /* Summary Section */
    .summary-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-bottom: 40px;
    }
    
    .summary-left {
      display: flex;
      align-items: flex-end;
    }
    
    .payment-status {
      display: inline-block;
      background: #c6f6d5;
      color: #22543d;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      border-left: 4px solid #38a169;
    }
    
    .summary-right {
      display: flex;
      justify-content: flex-end;
    }
    
    .totals-box {
      background: #f7fafc;
      border-left: 4px solid #84cc16;
      padding: 20px 30px;
      border-radius: 6px;
      min-width: 300px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .totals-row.subtotal-row,
    .totals-row.shipping-row,
    .totals-row.tax-row {
      color: #718096;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    
    .totals-row.total-row {
      font-size: 18px;
      font-weight: 700;
      color: #84cc16;
      border-top: 2px solid #84cc16;
      padding-top: 12px;
      margin-top: 12px;
    }
    
    .totals-row strong {
      font-weight: 600;
      color: #2d3748;
    }
    
    /* Notes Section */
    .notes-section {
      background: #fffff0;
      border-left: 4px solid #f6ad55;
      padding: 20px;
      border-radius: 6px;
      margin-bottom: 40px;
    }
    
    .notes-section h4 {
      font-size: 14px;
      font-weight: 600;
      color: #744210;
      margin-bottom: 8px;
    }
    
    .notes-section p {
      font-size: 13px;
      color: #92400e;
      line-height: 1.8;
      margin-bottom: 6px;
    }
    
    /* Action Buttons Section */
    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 30px;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 24px;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      color: white;
      flex: 1;
      min-width: 160px;
    }
    
    .btn-print {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .btn-print:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
    
    .btn-download {
      background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }
    
    .btn-download:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(168, 85, 247, 0.4);
    }
    
    .btn-whatsapp {
      background: linear-gradient(135deg, #25d366 0%, #20ba58 100%);
      box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
    }
    
    .btn-whatsapp:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4);
    }
    
    /* Footer */
    .invoice-footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 30px 50px;
      font-size: 12px;
      color: #718096;
      text-align: center;
      line-height: 1.8;
    }
    
    .footer-divider {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    
    .footer-divider span {
      border-right: 1px solid #cbd5e0;
      padding-right: 20px;
    }
    
    .footer-divider span:last-child {
      border-right: none;
      padding-right: 0;
    }
    
    .footer-text {
      color: #a0aec0;
      font-size: 11px;
    }
    
    /* Print Styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .action-buttons {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Premium Header -->
    <div class="invoice-header">
      <div class="header-content">
        <div class="company-branding">
          <div class="company-logo-box">
            <svg width="50" height="50" viewBox="0 0 50 50" style="width: 50px; height: 50px;">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#84cc16;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#65a30d;stop-opacity:1" />
                </linearGradient>
              </defs>
              <rect width="50" height="50" rx="8" fill="url(#logoGradient)"/>
              <text x="25" y="35" font-size="28" font-weight="900" fill="white" text-anchor="middle" font-family="Arial, sans-serif">E</text>
            </svg>
            <div class="company-name-box">
              <h1>EMPI COSTUMES</h1>
            </div>
          </div>
          <p class="company-tagline">Premium Costume Rental & Sales</p>
          <div class="company-details">
            <p>📍 22 Ejire Street, Lagos State</p>
            <p>📧 info@empi.com</p>
            <p>📱 +234 (0) 123-456-7890</p>
          </div>
        </div>
        
        <div class="invoice-meta">
          <div class="invoice-meta-item">
            <span class="meta-label">Invoice</span>
            <span class="meta-value">${invoice.invoiceNumber}</span>
          </div>
          <div class="invoice-meta-item">
            <span class="meta-label">Order</span>
            <span class="meta-value">${invoice.orderNumber}</span>
          </div>
          <div class="invoice-meta-item">
            <span class="meta-label">Date</span>
            <span class="meta-value">${invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="invoice-meta-item">
            <span class="meta-label">Due</span>
            <span class="meta-value">${dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
          <div class="status-badge">✓ PAYMENT COMPLETED</div>
        </div>
      </div>
    </div>
    
    <!-- Content -->
    <div class="invoice-content">
      <!-- Bill To Section -->
      <div class="bill-to-section">
        <div class="bill-section">
          <div class="section-header">Bill To</div>
          <div class="customer-name">${invoice.customerName}</div>
          <div class="customer-details">
            <p>${invoice.customerAddress}</p>
            <p>${invoice.customerCity}, ${invoice.customerState} ${invoice.customerPostalCode}</p>
            <p class="detail-label">Email</p>
            <p>${invoice.customerEmail}</p>
            <p class="detail-label">Phone</p>
            <p>${invoice.customerPhone}</p>
          </div>
        </div>
        
        <div class="bill-section">
          <div class="section-header">Shipping Details</div>
          <div class="customer-details">
            <p class="detail-label">Shipping Method</p>
            <p><strong>${invoice.shippingMethod}</strong></p>
            <p class="detail-label">Expected Delivery</p>
            <p>3-5 Business Days</p>
            <p class="detail-label">Payment Method</p>
            <p style="text-transform: capitalize;"><strong>${invoice.paymentMethod}</strong></p>
          </div>
        </div>
      </div>
      
      <!-- Items Table -->
      <div class="items-section">
        <table class="items-table">
          <thead>
            <tr>
              <th>Product Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>
                  <span class="item-name">${item.name}</span>
                  ${item.mode ? `<div style="font-size: 12px; color: #718096; margin-top: 4px;">${item.mode === 'buy' ? '🛍️ Sale' : '🎭 Rental'}</div>` : ''}
                </td>
                <td>${item.quantity}</td>
                <td>${invoice.currencySymbol}${item.price.toFixed(2)}</td>
                <td><strong>${invoice.currencySymbol}${(item.price * item.quantity).toFixed(2)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Summary Section -->
      <div class="summary-section">
        <div class="payment-status-box">
          <div class="payment-status">
            ✓ Payment Completed Successfully
          </div>
        </div>
        
        <div class="totals-box">
          <div class="totals-content">
            <div class="totals-row subtotal-row">
              <span>Subtotal</span>
              <strong>${invoice.currencySymbol}${invoice.subtotal.toFixed(2)}</strong>
            </div>
            <div class="totals-row shipping-row">
              <span>Shipping</span>
              <strong>${invoice.currencySymbol}${invoice.shippingCost.toFixed(2)}</strong>
            </div>
            <div class="totals-row tax-row">
              <span>Tax (7.5%)</span>
              <strong>${invoice.currencySymbol}${invoice.taxAmount.toFixed(2)}</strong>
            </div>
            <div class="totals-row total-row">
              <span>Total Amount</span>
              <strong>${invoice.currencySymbol}${invoice.totalAmount.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Notes -->
      <div class="notes-section">
        <h4>📋 What Happens Next?</h4>
        <p>✓ A confirmation email has been sent to <strong>${invoice.customerEmail}</strong></p>
        <p>✓ Your order will be prepared within 24-48 hours</p>
        <p>✓ You will receive a tracking number via email once shipped</p>
        <p>✓ Keep this invoice for your records and warranty information</p>
      </div>
      
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button class="btn btn-print" onclick="window.print()">🖨️ Print Invoice</button>
        <button class="btn btn-download" onclick="downloadInvoice()">⬇️ Download Invoice</button>
        <a href="https://wa.me/?text=${whatsappMessage}" class="btn btn-whatsapp" target="_blank">💬 Share via WhatsApp</a>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="invoice-footer">
      <div class="footer-divider">
        <span>EMPI © 2024</span>
        <span>Invoice #${invoice.invoiceNumber}</span>
        <span>Order #${invoice.orderNumber}</span>
      </div>
      <div class="footer-text">
        Thank you for your purchase! For inquiries, contact info@empi.com or +234 (0) 123-456-7890
      </div>
    </div>
  </div>
  
  <script>
    function downloadInvoice() {
      const filename = 'Invoice-${invoice.invoiceNumber}.html';
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], {type: 'text/html'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
  </script>
</body>
</html>
  `;
}
