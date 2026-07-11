// Mobile-Optimized Professional Invoice HTML Template
import { StoredInvoice } from "./invoiceStorage";

/**
 * Determines if a payment was made online (e.g. Flutterwave or Paystack)
 * or if it has already been verified and paid.
 */
function isOnlineOrPaid(invoice: StoredInvoice): boolean {
  // If payment is already verified or status is paid, we don't need to ask for manual bank transfer payment
  if (invoice.paymentVerified === true || invoice.status === 'paid') {
    return true;
  }
  
  // Check the payment method
  if (invoice.paymentMethod) {
    const method = invoice.paymentMethod.toLowerCase();
    if (method === 'flutterwave' || method === 'paystack') {
      return true;
    }
    if (method === 'manual') {
      return false;
    }
  }

  // If type is automatic, it means it's an online system-generated invoice, which usually goes through the online gateway.
  // Unless payment method is explicitly manual, we treat automatic invoices as online/system-handled.
  if (invoice.type === 'automatic' && invoice.paymentMethod !== 'manual') {
    return true;
  }

  return false;
}

export function generateProfessionalInvoiceHTML(
  invoice: StoredInvoice,
  activeBank?: { bankName: string; accountName: string; accountNumber: string }
): string {
  const invoiceDate = new Date(invoice.invoiceDate);
  const dateStr = invoiceDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    @media only screen and (max-width: 600px) {
      .responsive-table {
        width: 100% !important;
      }
      .col-stack {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
      }
      .col-space {
        height: 16px !important;
        width: 100% !important;
      }
      .padding-mobile {
        padding: 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #1f2937;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="max-width: 750px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-collapse: collapse;">
    <!-- Top Accent Bar -->
    <tr>
      <td height="6" style="background-color: #84cc16; font-size: 1px; line-height: 6px;">&nbsp;</td>
    </tr>

    <!-- HEADER / BRANDING -->
    <tr>
      <td class="padding-mobile" style="padding: 32px; border-bottom: 1px solid #f1f5f9;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="middle">
              <span style="font-size: 24px; font-weight: 900; color: #111827; letter-spacing: 0.5px; text-transform: uppercase;">
                EMPI <span style="color: #84cc16; font-style: italic;">COSTUMES</span>
              </span>
            </td>
            <td align="right" valign="middle">
              ${(invoice.type === 'automatic' || invoice.status === 'paid' || invoice.paymentVerified === true)
                ? `<span style="background-color: #dcfce7; color: #15803d; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bbf7d0; display: inline-block;">PAID</span>`
                : `<span style="background-color: #fef3c7; color: #d97706; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #fde68a; display: inline-block;">UNPAID</span>`
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- METADATA BOX -->
    <tr>
      <td class="padding-mobile" style="padding: 24px 32px; background-color: #fafafa; border-bottom: 1px solid #f1f5f9;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="33%" valign="top" class="col-stack">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.8px; margin-bottom: 4px;">Invoice Number</div>
              <div style="font-size: 13px; font-weight: 800; color: #1f2937; word-break: break-all;">${invoice.invoiceNumber}</div>
            </td>
            <td width="33%" valign="top" class="col-stack padding-mobile" style="padding-left: 16px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.8px; margin-bottom: 4px;">Date Issued</div>
              <div style="font-size: 13px; font-weight: 800; color: #1f2937;">${dateStr}</div>
            </td>
            <td width="33%" valign="top" class="col-stack padding-mobile" style="padding-left: 16px;">
              <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.8px; margin-bottom: 4px;">Grand Total</div>
              <div style="font-size: 15px; font-weight: 900; color: #84cc16;">${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BILLING / CLIENT / ORDER HIGHLIGHTS -->
    <tr>
      <td class="padding-mobile" style="padding: 32px 32px 16px 32px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <!-- Customer Card -->
            <td width="48%" valign="top" class="col-stack" style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <div style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">👤 Customer Details</div>
              <strong style="font-size: 15px; color: #111827; display: block; margin-bottom: 6px;">${invoice.customerName}</strong>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 3px; word-break: break-all;">${invoice.customerEmail}</div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 3px;">${invoice.customerPhone}</div>
              ${invoice.customerAddress ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; line-height: 1.4;">
                  ${invoice.customerAddress}${invoice.customerCity ? ', ' + invoice.customerCity : ''}${invoice.customerState ? ', ' + invoice.customerState : ''}${invoice.customerPostalCode ? ' ' + invoice.customerPostalCode : ''}
                </div>
              ` : ''}
            </td>

            <!-- Spacer -->
            <td width="4%" class="col-space" style="font-size: 1px; line-height: 1px;">&nbsp;</td>

            <!-- Order Card -->
            <td width="48%" valign="top" class="col-stack" style="background-color: #fafafa; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px;">
              <div style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 12px;">📦 Order Information</div>
              <strong style="font-size: 15px; color: #111827; display: block; margin-bottom: 6px;">Order #${invoice.orderNumber}</strong>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 3px;">${invoice.items.length} ${invoice.items.length === 1 ? 'Item' : 'Items'}</div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 3px;">
                Payment: 
                ${(invoice.type === 'automatic' || invoice.status === 'paid' || invoice.paymentVerified === true)
                  ? `<span style="color: #16a34a; font-weight: 700;">Paid ✓</span>`
                  : `<span style="color: #d97706; font-weight: 700;">Pending Verification</span>`
                }
              </div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                Transaction Date: ${dateStr}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ITEMS ORDERED -->
    <tr>
      <td class="padding-mobile" style="padding: 16px 32px 24px 32px;">
        <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #1f2937; letter-spacing: 0.5px; margin-bottom: 12px;">Items Ordered</div>
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; border-collapse: collapse; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th align="left" style="padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; border-right: 1px solid #e2e8f0;">Item</th>
              <th align="center" style="padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; border-right: 1px solid #e2e8f0; width: 80px;">Type</th>
              <th align="center" style="padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; border-right: 1px solid #e2e8f0; width: 60px;">Qty</th>
              <th align="right" style="padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; border-right: 1px solid #e2e8f0; width: 100px;">Price</th>
              <th align="right" style="padding: 12px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                <td style="padding: 14px 16px; font-size: 13px; color: #1e293b; border-right: 1px solid #e2e8f0; vertical-align: top;">
                  <strong style="color: #0f172a;">${item.name}</strong>
                  ${item.selectedColor || item.selectedSize || (item.mode === 'rent' && item.rentalDays) ? `
                    <div style="font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.4;">
                      ${item.selectedColor ? `Color: <strong>${item.selectedColor}</strong>` : ''}
                      ${item.selectedSize ? `${item.selectedColor ? ' &bull; ' : ''}Size: <strong>${item.selectedSize}</strong>` : ''}
                      ${(item.mode === 'rent' && item.rentalDays) ? `${(item.selectedColor || item.selectedSize) ? ' &bull; ' : ''}Duration: <strong>${item.rentalDays} days</strong>` : ''}
                    </div>
                  ` : ''}
                </td>
                <td align="center" style="padding: 14px 16px; border-right: 1px solid #e2e8f0; vertical-align: top; white-space: nowrap;">
                  <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; padding: 3px 8px; border-radius: 4px; ${(item.mode || 'buy') === 'rent' ? 'background-color: #faf5ff; color: #6b21a8; border: 1px solid #f3e8ff;' : 'background-color: #f0fdf4; color: #166534; border: 1px solid #dcfce7;' }">
                    ${(item.mode || 'buy') === 'rent' ? 'Rental' : 'Buy'}
                  </span>
                </td>
                <td align="center" style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: #0f172a; border-right: 1px solid #e2e8f0; vertical-align: top;">
                  ${item.quantity}
                </td>
                <td align="right" style="padding: 14px 16px; font-size: 13px; color: #475569; border-right: 1px solid #e2e8f0; vertical-align: top; white-space: nowrap;">
                  ${invoice.currencySymbol}${((item.price || 0)).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </td>
                <td align="right" style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: #0f172a; vertical-align: top; white-space: nowrap;">
                  ${invoice.currencySymbol}${((item.quantity || 1) * (item.price || 0)).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </td>
    </tr>

    <!-- SUMMARY SECTION (Left Bank Info, Right Totals Box) -->
    <tr>
      <td class="padding-mobile" style="padding: 8px 32px 32px 32px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <!-- Left Info Area -->
            <td width="54%" valign="top" class="col-stack">
              ${(activeBank && !isOnlineOrPaid(invoice)) ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1.5px dashed #84cc16; border-radius: 12px; padding: 18px;">
                  <tr>
                    <td>
                      <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">🏛️ Bank Transfer Details</div>
                      <div style="font-size: 13px; color: #166534; margin-bottom: 6px;"><strong>Bank Name:</strong> ${activeBank.bankName}</div>
                      <div style="font-size: 13px; color: #166534; margin-bottom: 6px;"><strong>Account Name:</strong> ${activeBank.accountName}</div>
                      <div style="font-size: 13px; color: #166534; margin-bottom: 10px;">
                        <strong>Account Number:</strong> 
                        <span style="font-family: monospace; font-size: 14px; font-weight: 800; background-color: #d1fae5; padding: 3px 8px; border-radius: 4px; border: 1px solid #a7f3d0; letter-spacing: 0.5px; display: inline-block;">${activeBank.accountNumber}</span>
                      </div>
                      <div style="font-size: 11px; color: #166534; font-style: italic; line-height: 1.4;">
                        Kindly make your bank transfer payment to this account and upload proof of payment inside your order profile.
                      </div>
                    </td>
                  </tr>
                </table>
              ` : `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px;">
                  <tr>
                    <td>
                      <div style="font-size: 13px; color: #166534; font-weight: 700; margin-bottom: 4px;">✓ Verified Paid Transaction</div>
                      <div style="font-size: 12px; color: #166534; line-height: 1.5; opacity: 0.95;">
                        Your payment has been successfully completed and confirmed. We are preparing your order details now. Thank you for choosing EMPI!
                      </div>
                    </td>
                  </tr>
                </table>
              `}
              ${invoice.cautionFee && invoice.cautionFee > 0 ? `
                <div style="margin-top: 16px; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; font-size: 11.5px; color: #92400e; line-height: 1.5;">
                  📌 <strong>Refundable Caution Fee Applied:</strong> The caution fee of ${invoice.currencySymbol}${invoice.cautionFee.toLocaleString('en-NG', { maximumFractionDigits: 0 })} is a deposit for rental products, which will be refunded back to you once items are returned in good condition.
                </div>
              ` : ''}
            </td>

            <!-- Divider Spacer -->
            <td width="6%" class="col-space" style="font-size: 1px; line-height: 1px;">&nbsp;</td>

            <!-- Right Totals Area -->
            <td width="40%" valign="top" class="col-stack">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px;">
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #64748b;">Subtotal</td>
                  <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #1e293b;">
                    ${invoice.currencySymbol}${invoice.subtotal.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </td>
                </tr>

                ${invoice.bulkDiscountPercentage && invoice.bulkDiscountPercentage > 0 ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #16a34a;">Discount (${invoice.bulkDiscountPercentage}%)</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #16a34a;">
                      -${invoice.currencySymbol}${(invoice.bulkDiscountAmount || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ` : ''}

                ${invoice.cautionFee && invoice.cautionFee > 0 ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #d97706;">Caution Fee</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #d97706;">
                      ${invoice.currencySymbol}${invoice.cautionFee.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ` : ''}

                ${invoice.taxAmount > 0 ? `
                  <tr>
                    <td style="padding: 5px 0; font-size: 13px; color: #64748b;">VAT (${invoice.taxRate || 7.5}%)</td>
                    <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: 700; color: #1e293b;">
                      ${invoice.currencySymbol}${invoice.taxAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ` : ''}

                <tr>
                  <td colspan="2" style="padding: 10px 0 0 0; border-top: 1px solid #e2e8f0; margin-top: 10px;"></td>
                </tr>

                <tr>
                  <td style="padding: 6px 0 0 0; font-size: 13px; font-weight: 800; color: #0f172a;">Total Amount</td>
                  <td align="right" style="padding: 6px 0 0 0; font-size: 18px; font-weight: 900; color: #84cc16;">
                    ${invoice.currencySymbol}${invoice.totalAmount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER / CONTACT INFO -->
    <tr>
      <td style="background-color: #fafafa; border-top: 1px solid #f1f5f9; padding: 28px 32px; border-radius: 0 0 16px 16px; text-align: center;">
        <div style="font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 1px; text-transform: uppercase;">
          EMPI COSTUMES
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
          📧 info@empicostumes.com &nbsp;&bull;&nbsp; 📍 Lagos, Nigeria
        </div>
        <div style="font-size: 10px; color: #cbd5e1; margin-top: 16px; padding-top: 12px; border-top: 1px solid #f1f5f9;">
          This is an automated notification. Thank you for your business.
        </div>
      </td>
    </tr>
  </table>
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
</html>`;

  return html;
}
