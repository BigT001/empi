import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import { Resend } from 'resend';

interface PreviousMessage {
  direction: 'inbound' | 'outbound';
  senderEmail: string;
  senderName: string;
  content: string;
  createdAt: Date | string;
}

// Helper to format a date like Gmail: "Sat, Jun 13, 2026 at 11:02 AM"
function formatGmailDate(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Helper to send email via Resend with Gmail-style thread quoting (fire-and-forget)
async function sendReplyEmail(
  fromEmail: string,
  toEmail: string,
  senderName: string,
  ticketNumber: string,
  customerName: string,
  subject: string,
  content: string,
  previousMessages: PreviousMessage[] = []
) {
  try {
    // Only send if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY not configured - skipping email send');
      return;
    }

    // Instantiate Resend client inside function (avoid build-time initialization)
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build Gmail-style quoted thread history (most recent first → oldest last)
    let threadQuoteHtml = '';
    if (previousMessages.length > 0) {
      const quoteBlocks = previousMessages
        .slice() // clone array to avoid mutation
        .reverse() // oldest first for the quoted section
        .map((msg) => {
          const sentLabel = `On ${formatGmailDate(msg.createdAt)}, ${msg.senderName} &lt;${msg.senderEmail}&gt; wrote:`;
          const escapedContent = msg.content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          return `
          <div style="margin-top: 16px; border-left: 3px solid #d1d5db; padding-left: 12px; color: #6b7280;">
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 6px;">${sentLabel}</div>
            <div style="font-size: 13px; white-space: pre-wrap; word-wrap: break-word; color: #6b7280;">${escapedContent}</div>
          </div>`;
        })
        .join('\n');

      threadQuoteHtml = `
      <div style="margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        ${quoteBlocks}
      </div>`;
    }

    // Escape the current reply content
    const escapedContent = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Create clean Gmail-like HTML template
    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #202124; line-height: 1.6; margin: 0; padding: 20px; font-size: 14px;">
    
    <div style="white-space: pre-wrap; word-wrap: break-word; color: #202124;">${escapedContent}</div>
    
    <div style="margin-top: 24px; color: #5f6368; font-size: 13px;">
      --<br>
      Empi Costumes
    </div>

    ${threadQuoteHtml}
  </body>
</html>`;

    // Send via Resend (fire-and-forget)
    resend.emails
      .send({
        from: fromEmail,
        to: toEmail,
        subject: `Re: ${subject}`,
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

    // Fetch previous messages BEFORE saving the new reply (for thread quoting)
    const previousMessages = await MailRoomMessage.find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .lean();

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

    // Send email via Resend with Gmail-style thread quoting (fire-and-forget)
    sendReplyEmail(
      ticket.department,
      ticket.customerEmail,
      admin.fullName,
      ticket.ticketNumber,
      ticket.customerName,
      ticket.subject,
      content,
      previousMessages as any[]
    );

    return NextResponse.json(replyMessage, { status: 201 });
  } catch (error: any) {
    console.error('POST Ticket Reply Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
