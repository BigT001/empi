import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import { Resend } from 'resend';

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

    // Instantiate Resend client inside function (avoid build-time initialization)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create branded HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #202124;
        line-height: 1.5;
        margin: 0;
        padding: 20px;
      }
      .message-body {
        white-space: pre-wrap;
        word-wrap: break-word;
        font-size: 14px;
        color: #202124;
      }
      .signature {
        margin-top: 24px;
        color: #5f6368;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div class="message-body">${content}</div>
    <div class="signature">
      --<br>
      Empi Costumes
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
