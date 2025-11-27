// Modern Professional Invoice HTML Template - Matches Dashboard Design
import { StoredInvoice } from "./invoiceStorage";

export function generateProfessionalInvoiceHTML(invoice: StoredInvoice): string {
  const invoiceDate = new Date(invoice.invoiceDate);
  const dateStr = invoiceDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f3f4f6; padding: 20px; }
    .invoice-container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.1); }
    .invoice-header { background: white; color: #111827; padding: 40px 40px 32px 40px; position: relative; overflow: hidden; border-bottom: 3px solid #10b981; box-shadow: none; border-radius: 0; }
    .invoice-header::before { display: none; }
    .invoice-header::after { display: none; }
    .header-content { display: grid; grid-template-columns: auto 1fr auto; gap: 40px; position: relative; z-index: 1; align-items: flex-start; }
    .header-left { display: flex; flex-direction: column; justify-content: flex-start; }
    .logo-section { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .logo-img { width: 50px; height: 50px; object-fit: contain; background: transparent; padding: 0; border-radius: 0; backdrop-filter: none; }
    .company-name { font-size: 24px; font-weight: 900; letter-spacing: 0; color: #111827; }
    .company-tagline { font-size: 12px; opacity: 0.6; margin-top: 6px; margin-bottom: 12px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .company-info { font-size: 12px; opacity: 0.7; line-height: 1.6; color: #6b7280; }
    .company-info p { margin: 2px 0; }
    .header-right { text-align: right; display: flex; flex-direction: column; justify-content: flex-start; gap: 8px; }
    .order-meta { margin-bottom: 0; background: transparent; padding: 0; border-radius: 0; backdrop-filter: none; border: none; }
    .meta-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; opacity: 0.6; margin-bottom: 2px; color: #6b7280; }
    .meta-value { font-size: 14px; font-weight: 700; margin-top: 0; background: none; -webkit-background-clip: unset; -webkit-text-fill-color: unset; background-clip: unset; color: #111827; }
    .status-badge { display: inline-block; background: #10b981; color: white; padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-top: 4px; border: none; box-shadow: none; text-transform: uppercase; letter-spacing: 0.5px; align-self: flex-end; }
    .invoice-content { padding: 48px; }
    .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #374151; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; }
    .section-title::before { content: ''; width: 4px; height: 18px; background: linear-gradient(to bottom, #10b981, #16a34a); border-radius: 2px; margin-right: 12px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 40px; padding: 28px; background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .info-box h4 { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px; }
    .info-box p { font-size: 13px; color: #6b7280; margin-bottom: 6px; font-weight: 400; }
    .info-box strong { display: block; color: #111827; font-weight: 700; margin-top: 8px; font-size: 16px; }
    .items-section { margin-bottom: 40px; }
    .items-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .items-table thead { background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%); border-top: 2px solid #10b981; border-bottom: 2px solid #10b981; }
    .items-table th { padding: 16px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #374151; letter-spacing: 0.5px; background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%); }
    .items-table td { padding: 18px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151; font-weight: 500; }
    .items-table tbody tr { transition: all 0.2s; }
    .items-table tbody tr:hover { background: linear-gradient(90deg, #f9fafb 0%, #ffffff 100%); }
    .item-name { font-weight: 700; color: #111827; display: block; margin-bottom: 2px; }
    .summary-section { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-bottom: 40px; }
    .summary-left { display: flex; align-items: flex-end; }
    .payment-note { background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.03)); border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; font-size: 14px; color: #047857; font-weight: 500; border: 1px solid rgba(16, 185, 129, 0.2); }
    .summary-right { display: flex; justify-content: flex-end; }
    .totals-box { background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%); border: 2px solid #fcd34d; border-radius: 16px; padding: 28px; min-width: 280px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.15); }
    .totals-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 14px; padding: 0 0 10px 0; border-bottom: 1px solid rgba(255,255,255,0.5); }
    .totals-row.total-row { font-size: 20px; font-weight: 800; color: #10b981; border-top: 2px solid #fcd34d; border-bottom: none; padding-top: 14px; margin-top: 8px; padding-bottom: 0; }
    .totals-row span:first-child { color: #78350f; font-weight: 600; }
    .totals-row span:last-child { font-weight: 700; color: #78350f; }
    .action-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
    .btn { padding: 12px 16px; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s; text-align: center; color: white; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; }
    .btn-whatsapp { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 12px rgba(16,185,129,0.25); }
    .btn-whatsapp:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16,185,129,0.35); }
    .btn-download { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 4px 12px rgba(59,130,246,0.25); }
    .btn-download:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(59,130,246,0.35); }
    .btn-print { background: linear-gradient(135deg, #a855f7, #9333ea); box-shadow: 0 4px 12px rgba(168,85,247,0.25); }
    .btn-print:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(168,85,247,0.35); }
    .btn-close { background: linear-gradient(135deg, #9ca3af, #6b7280); box-shadow: 0 4px 12px rgba(107,114,128,0.25); }
    .btn-close:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(107,114,128,0.35); }
    .invoice-footer { background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-top: 2px solid #e5e7eb; padding: 32px 40px; font-size: 12px; color: #6b7280; text-align: center; }
    .footer-divider { display: flex; gap: 24px; justify-content: center; margin-bottom: 12px; flex-wrap: wrap; }
    .footer-divider span { border-right: 1px solid #d1d5db; padding-right: 24px; font-weight: 500; color: #374151; }
    .footer-divider span:last-child { border-right: none; padding-right: 0; }
    @media print { 
      body { background: white; padding: 0; } 
      .invoice-container { box-shadow: none; border-radius: 0; }
      .action-buttons { display: none !important; }
      .invoice-header::before { display: none; }
      .invoice-header { page-break-after: avoid; }
      .invoice-content { page-break-inside: avoid; }
      .items-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAACE4AAAhOAFmwQcnAAABpElEQVR4nO3YwUrDMBCG4ZA7iJ5EsV7Fi4gHQRBFPYiCB0Hx4tGTZ09e9OpBeAzBiyBqb56k15O0pGmTZJrZzPwwH8wBGfj2m2Q3SSccx3H+JXmelzUajRwAiKIoRZZlMZ1OR4vFYrJcLhfr9foyiiKMbMux7RskSRK0Wi0Wy+VyQ6GUyj7PY1mWlCRJNJ1OJ4vFYkWhVKrVajGbzcZCoRBIkmShkIlEIikSHo+n1mq1OBxUyhT9fp/pdBqPx+NRqVSSJEnkcrkMc9sKhUIg/X6faTabdF1HUZSEvt/PyeXyxnWBfD4fyuOYzWbmdR0gn89HvV6PXq+HLMuKxqWnpmJbFi6Xi2azycjj8RBFUb/f1wVyPp85HA7Z5/OhKAq6rj/v0Ov18jAY/VvdbleXiJZlKZZlKZZlxRRK6RP/EB0iO4RGsCOQHUIjWBAzsgNoBGoH5BSoHUAjUDsgKyBTdwBoB9AOyAoIs3cAaAfQDsgKIHsBaAfQDsgKwJIaAvwNvz+gHZAVEGbvANAOoB2QFRBm7wDQDqAdkBUAaAdkBQDaAVkBQDuAdiAL+AVm/w7RpmOC5gAAAABJRU5ErkJggg==" alt="EMPI Logo" class="logo-img">
            <div class="company-name">EMPI</div>
          </div>
          <p class="company-tagline">Professional Invoice</p>
          <div class="company-info">
            <p>info@empi.com</p>
            <p>Lagos, Nigeria</p>
          </div>
        </div>
        
        <div style="flex: 1;"></div>
        
        <div class="header-right">
          <div class="order-meta">
            <div class="meta-label">Invoice #</div>
            <div class="meta-value">${invoice.invoiceNumber}</div>
          </div>
          <div class="order-meta">
            <div class="meta-label">Order #</div>
            <div class="meta-value">${invoice.orderNumber}</div>
          </div>
          <div class="order-meta">
            <div class="meta-label">Date</div>
            <div class="meta-value">${dateStr}</div>
          </div>
          <div class="status-badge">PAID</div>
        </div>
      </div>
    </div>
    
    <div class="invoice-content">
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
          <p>Order Date: ${dateStr}</p>
        </div>
        <div class="info-box">
          <h4>💰 Amount</h4>
          <strong>${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</strong>
          <p>Payment Completed</p>
        </div>
      </div>
      
      <div class="items-section">
        <div class="section-title">Order Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item) => `
              <tr>
                <td><span class="item-name">${item.name}</span></td>
                <td>${item.quantity}</td>
                <td>${invoice.currencySymbol}${item.price.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</td>
                <td><strong>${invoice.currencySymbol}${(item.quantity * item.price).toLocaleString('en-NG', { maximumFractionDigits: 2 })}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="summary-section">
        <div class="summary-left">
          <div class="payment-note">
            ✓ Your payment has been received and processed. Thank you for your purchase!
          </div>
        </div>
        
        <div class="summary-right">
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
        </div>
      </div>
    </div>
    
    <div class="invoice-footer">
      <div class="footer-divider">
        <span>EMPI © 2024</span>
        <span>Order #${invoice.orderNumber}</span>
        <span>Invoice #${invoice.invoiceNumber}</span>
      </div>
      <p>Thank you for shopping with EMPI!</p>
    </div>
  </div>
  
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
