import { Resend } from "resend";
import connectDB from "@/lib/mongodb";
import MailRoomMessage from "@/lib/models/MailRoomMessage";
import MailRoomTicket from "@/lib/models/MailRoomTicket";

// Initialize Resend - moved inside functions to avoid build-time execution
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY not configured");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailWithTrackingOptions extends EmailOptions {
  ticketId?: string;
  threadId?: string;
  fromName?: string;
}

/**
 * Send an email using Resend and optionally track it in the Mail Room
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) {
      console.log("⚠️ Email service not configured (missing RESEND_API_KEY)");
      console.log(`ℹ️ Would send email to: ${options.to}`);
      return false;
    }

    const from = process.env.RESEND_FROM || "noreply@empicostumes.com";

    const result = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || from,
    });

    if (result.error) {
      console.error(`❌ Failed to send email to ${options.to}:`, result.error);
      return false;
    }

    console.log(`✅ Email sent successfully to ${options.to} (ID: ${result.data?.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return false;
  }
}

/**
 * Send an email and track it in the Mail Room database
 * This creates an outbound message record for conversation tracking
 */
export async function sendEmailWithTracking(
  options: SendEmailWithTrackingOptions
): Promise<{ success: boolean; messageId?: string }> {
  try {
    await connectDB();

    const resend = getResend();
    if (!resend) {
      console.log("⚠️ Email service not configured (missing RESEND_API_KEY)");
      return { success: false };
    }

    const from = process.env.RESEND_FROM || "noreply@empicostumes.com";
    const fromName = options.fromName || "EMPI Costumes";

    // 1. Send the email via Resend
    const result = await resend.emails.send({
      from: `${fromName} <${from}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      replyTo: options.replyTo || from,
    });

    if (result.error) {
      console.error(`❌ Failed to send email to ${options.to}:`, result.error);
      return { success: false };
    }

    console.log(`✅ Email sent to ${options.to} (Resend ID: ${result.data?.id})`);

    // 2. Track it in the Mail Room if ticket is specified
    if (options.ticketId) {
      try {
        const message = new MailRoomMessage({
          ticketId: options.ticketId,
          direction: 'outbound',
          senderEmail: from,
          senderName: fromName,
          recipientEmail: options.to.toLowerCase(),
          content: options.html,
          htmlContent: options.html,
          externalMessageId: result.data?.id,
          resendEmailId: result.data?.id,
          threadId: options.threadId,
          status: 'SENT',
        });
        await message.save();
        console.log(`✅ Outbound message tracked in Mail Room (ID: ${message._id})`);
        return { success: true, messageId: message._id.toString() };
      } catch (dbError) {
        console.warn('⚠️ Failed to track message in Mail Room:', dbError);
        // Still return success since the email was sent
        return { success: true, messageId: undefined };
      }
    }

    return { success: true };
  } catch (error) {
    console.error(`❌ Failed in sendEmailWithTracking:`, error);
    return { success: false };
  }
}

/**
 * Send order declined notification to customer
 */
export async function sendOrderDeclinedEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string,
  reason?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background: #f3f4f6; padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: #1f2937; margin: 0;">Order Update - EMPI Costumes</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <p style="color: #374151;">Hi <strong>${customerName}</strong>,</p>
        
        <p style="color: #374151;">We regret to inform you that your custom costume order <strong>${orderNumber}</strong> has been declined.</p>
        
        ${reason
          ? `<p style="background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; color: #991b1b; margin: 20px 0; border-radius: 4px;"><strong>Reason:</strong> ${reason}</p>`
          : ""
        }
        
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
          <p style="color: #166534; margin: 0;"><strong>What's Next?</strong></p>
          <p style="color: #166534; margin: 5px 0;">You can contact us to discuss alternative options or submit a new custom order request.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>EMPI Costumes</strong><br>
            Email: ${process.env.STORE_EMAIL || "empicostumes@gmail.com"}<br>
            Phone: ${process.env.STORE_PHONE || "+234 808 577 9180"}
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated message. Please do not reply to this email. Contact us directly if you have questions.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order Declined - ${orderNumber} | EMPI Costumes`,
    html,
  });
}

/**
 * Send order deleted notification to customer
 */
export async function sendOrderDeletedEmail(
  customerEmail: string,
  customerName: string,
  orderNumber: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Order Deleted - EMPI Costumes</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
        <p style="color: #374151;">Hi <strong>${customerName}</strong>,</p>
        
        <p style="color: #374151;">Your custom costume order <strong>${orderNumber}</strong> has been deleted from our system.</p>
        
        <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400e; margin: 0;"><strong>Note:</strong> This order has been permanently removed and cannot be recovered.</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
          <p style="color: #166534; margin: 0;"><strong>Want to Try Again?</strong></p>
          <p style="color: #166534; margin: 5px 0;">You can submit a new custom costume order request anytime.</p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>EMPI Costumes</strong><br>
            Email: ${process.env.STORE_EMAIL || "empicostumes@gmail.com"}<br>
            Phone: ${process.env.STORE_PHONE || "+234 808 577 9180"}
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated message. Please do not reply to this email. Contact us directly if you have questions.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Order Deleted - ${orderNumber} | EMPI Costumes`,
    html,
  });
}

/**
 * Send invoice to customer and admin
 */
export async function sendInvoiceEmail(
  customerEmail: string,
  customerName: string,
  invoiceNumber: string,
  invoiceHtml: string,
  orderNumber?: string
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const subject = `Your Invoice ${invoiceNumber} | EMPI Costumes`;

  // Send to customer
  const customerSent = await sendEmail({
    to: customerEmail,
    subject,
    html: invoiceHtml,
  });

  // Send to admin
  const adminEmail = process.env.STORE_EMAIL || "empicostumes@gmail.com";
  const adminSent = await sendEmail({
    to: adminEmail,
    subject: `[Admin] ${subject}`,
    html: `<div style="font-family: sans-serif; padding: 15px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px; font-size: 13px; color: #374151;">
      Sent to customer: <strong>${customerName} (${customerEmail})</strong>
    </div>${invoiceHtml}`,
  });

  console.log(`📧 Invoice email results - Customer: ${customerSent ? '✅' : '❌'}, Admin: ${adminSent ? '✅' : '❌'}`);

  return { customerSent, adminSent };
}

