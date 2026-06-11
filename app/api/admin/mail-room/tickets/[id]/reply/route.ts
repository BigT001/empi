import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to send email via Resend (fire-and-forget)
async function sendReplyEmail(
  fromEmail: string,
  toEmail: string,
  senderName: string,
  ticketNumber: string,
  customerName: string,
  subject: string,
  content: string
) {
  try {
    // Only send if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not configured - skipping email send');
      return;
    }

    // Create branded HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; background: #fff; }
      .header { background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); color: white; padding: 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; }
      .content { padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
      .ticket-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; color: #666; }
      .ticket-number { font-weight: bold; color: #84cc16; }
      .message-body { background: #fafafa; padding: 20px; border-left: 4px solid #84cc16; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
      .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e7eb; }
      .footer p { margin: 5px 0; }
      .reply-instructions { background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 13px; color: #78350f; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📧 Empi Costumes Support</h1>
        <p>We've replied to your ticket</p>
      </div>
      
      <div class="content">
        <p>Hi ${customerName},</p>
        
        <div class="ticket-info">
          <strong>Ticket:</strong> <span class="ticket-number">${ticketNumber}</span><br>
          <strong>Subject:</strong> ${subject}<br>
          <strong>Replied by:</strong> ${senderName} (${fromEmail})
        </div>
        
        <div class="message-body">${content}</div>
        
        <div class="reply-instructions">
          <strong>💡 To reply:</strong> Simply reply to this email and your message will be added to the ticket thread automatically.
        </div>
      </div>
      
      <div class="footer">
        <p><strong>Empi Costumes</strong> - Helping you look amazing</p>
        <p>📧 ${fromEmail} | 📱 +234 808 577 9180</p>
        <p style="margin-top: 10px; font-size: 11px;">This is an automated message. Do not reply with attachments larger than 25MB.</p>
      </div>
    </div>
  </body>
</html>
    `;

    // Send via Resend (fire-and-forget)
    resend.emails
      .send({
        from: fromEmail,
        to: toEmail,
        subject: `Re: ${subject} [${ticketNumber}]`,
        html: htmlContent,
        replyTo: fromEmail,
      })
      .then((result) => {
        if (result.error) {
          console.error(`❌ Resend email failed for ${toEmail}:`, result.error);
        } else {
          console.log(`✅ Email sent to ${toEmail} (ID: ${result.data?.id})`);
        }
      })
      .catch((err) => {
        console.error(`❌ Resend email exception for ${toEmail}:`, err);
      });
  } catch (error) {
    console.error('❌ Error sending reply email:', error);
    // Don't throw - let the response complete even if email fails
  }
}

async function getAuthenticatedAdmin(req: NextRequest) {
  const sessionToken = req.cookies.get('admin_session')?.value;
  if (!sessionToken) return null;

  let admin = await Admin.findOne({ 'sessions.token': sessionToken });
  if (!admin) {
    admin = await Admin.findOne({ sessionToken }); // Legacy support
  }
  return admin;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = (await MailRoomTicket.findById(id)) as any;
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const services = await EmailService.find({ isActive: true }).lean();
    const isSuperOrAdmin = admin.role === 'super_admin' || admin.role === 'admin';

    const visibleServices = services.filter((service: any) => {
      if (isSuperOrAdmin) return true;
      if (service.allowedAdmins && service.allowedAdmins.some((adminId: any) => adminId.toString() === admin._id.toString())) {
        return true;
      }
      if (service.allowedRoles && service.allowedRoles.includes(admin.role)) {
        return true;
      }
      // Default mappings fallback
      if ((!service.allowedRoles || service.allowedRoles.length === 0) && 
          (!service.allowedAdmins || service.allowedAdmins.length === 0)) {
        if (admin.role === 'finance_admin') {
          return ['pmoney@empicostumes.com', 'rentals@empicostumes.com'].includes(service.email);
        }
        if (admin.role === 'logistics_admin') {
          return ['bookings@empicostumes.com', 'production@empicostumes.com', 'rentals@empicostumes.com'].includes(service.email);
        }
        return true;
      }
      return false;
    });

    const visibleEmails = visibleServices.map(s => s.email);
    if (!visibleEmails.includes(ticket.department.toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized: You do not have permission to reply to this ticket' }, { status: 403 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Reply content cannot be empty' }, { status: 400 });
    }

    // Create outbound message
    const replyMessage = new MailRoomMessage({
      ticketId: ticket._id,
      direction: 'outbound',
      senderEmail: ticket.department,
      senderName: admin.fullName,
      recipientEmail: ticket.customerEmail,
      content,
    });

    await replyMessage.save();

    // Update ticket metadata
    ticket.lastMessageAt = new Date();
    // Auto mark open tickets as pending once replied to
    if (ticket.status === 'open') {
      ticket.status = 'pending';
    }
    await ticket.save();

    // Send email via Resend (fire-and-forget - don't wait for it)
    sendReplyEmail(
      ticket.department,
      ticket.customerEmail,
      admin.fullName,
      ticket.ticketNumber,
      ticket.customerName,
      ticket.subject,
      content
    );

    return NextResponse.json(replyMessage, { status: 201 });
  } catch (error: any) {
    console.error('POST Ticket Reply Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
