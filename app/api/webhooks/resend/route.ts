import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';

// Helper to generate ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMPI-${timestamp}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get raw body
    const rawBody = await req.text();
    console.log(`[WEBHOOK] Received webhook payload: ${rawBody.length} bytes`);

    // Parse payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('❌ Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log(`[WEBHOOK] Event type: ${payload.type}`);

    // Handle different webhook types
    if (payload.type === 'email.inbound') {
      const inboundData = payload.data;
      
      // Handle both formats: string array OR array of objects with email property
      let toEmail = '';
      if (inboundData.to) {
        if (Array.isArray(inboundData.to)) {
          // Check if it's an array of strings or array of objects
          if (typeof inboundData.to[0] === 'string') {
            toEmail = inboundData.to[0];
          } else if (inboundData.to[0]?.email) {
            toEmail = inboundData.to[0].email;
          }
        }
      }
      
      const fromEmail = typeof inboundData.from === 'object' 
        ? inboundData.from?.email 
        : inboundData.from;
      const fromName = typeof inboundData.from === 'object'
        ? inboundData.from?.name || 'Unknown'
        : inboundData.from || 'Unknown';
      const subject = inboundData.subject || '(No Subject)';
      const textContent = inboundData.text || '';
      const htmlContent = inboundData.html || '';
      const messageId = inboundData.message_id;

      console.log(`[WEBHOOK] Inbound email: FROM=${fromEmail} TO=${toEmail} SUBJECT=${subject}`);

      if (!toEmail || !fromEmail) {
        console.error('❌ Missing required fields in inbound email');
        console.error(`Details: to="${toEmail}", from="${fromEmail}"`);
        return NextResponse.json(
          { error: 'Missing to or from email' },
          { status: 400 }
        );
      }

      console.log(`📧 Processing inbound: ${fromEmail} → ${toEmail}`);

      // Find the email service (department)
      const emailService = await EmailService.findOne({
        email: toEmail.toLowerCase(),
        isActive: true,
      });

      if (!emailService) {
        console.warn(`⚠️ No email service found for ${toEmail}`);
        return NextResponse.json(
          { 
            error: 'Email service not configured',
            details: `No email service found for ${toEmail}`
          },
          { status: 404 }
        );
      }

      console.log(`✅ Found email service: ${emailService.name}`);

      // Check if this is a reply to an existing ticket
      let ticket = await MailRoomTicket.findOne({
        customerEmail: fromEmail.toLowerCase(),
        department: toEmail.toLowerCase(),
        status: { $in: ['open', 'pending'] },
      }).sort({ lastMessageAt: -1 });

      if (!ticket) {
        // Create new ticket
        const ticketNumber = generateTicketNumber();
        ticket = new MailRoomTicket({
          ticketNumber,
          subject,
          customerName: fromName,
          customerEmail: fromEmail.toLowerCase(),
          status: 'open',
          priority: 'medium',
          department: toEmail.toLowerCase(),
          tags: ['inbound', 'resend'],
          lastMessageAt: new Date(),
        });
        await ticket.save();
        console.log(`✅ Created new ticket: ${ticket.ticketNumber}`);
      } else {
        // Update existing ticket
        ticket.lastMessageAt = new Date();
        await ticket.save();
        console.log(`✅ Updated existing ticket: ${ticket.ticketNumber}`);
      }

      // Create inbound message
      const content = textContent || htmlContent;
      console.log(`[WEBHOOK] Creating message with content length: ${content.length}`);

      const message = new MailRoomMessage({
        ticketId: ticket._id,
        direction: 'inbound',
        senderEmail: fromEmail.toLowerCase(),
        senderName: fromName,
        recipientEmail: toEmail.toLowerCase(),
        content: content,
        externalMessageId: messageId,
      });
      await message.save();
      console.log(`✅ Message saved: ${message._id}`);

      // Return success
      return NextResponse.json(
        {
          success: true,
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          messageId: message._id,
        },
        { status: 200 }
      );
    }

    // Handle bounce/delivery events
    if (payload.type === 'email.bounced' || payload.type === 'email.complained') {
      console.warn(`⚠️ Email ${payload.type}: ${payload.data?.email}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Log unhandled event types
    console.log(`ℹ️ Unhandled webhook event type: ${payload.type}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint to verify webhook is working
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Check if RESEND_WEBHOOK_SECRET is configured
    const secretConfigured = !!process.env.RESEND_WEBHOOK_SECRET;
    
    // Get recent inbound messages
    const recentMessages = await MailRoomMessage.find({
      direction: 'inbound',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get all email services
    const emailServices = await EmailService.find({ isActive: true }).lean();

    return NextResponse.json({
      status: 'Resend webhook is active',
      secretConfigured,
      recentInboundMessages: recentMessages.length,
      activeEmailServices: emailServices.length,
      lastMessages: recentMessages.map((msg: any) => ({
        id: msg._id,
        senderEmail: msg.senderEmail,
        recipientEmail: msg.recipientEmail,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error in GET /api/webhooks/resend:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
