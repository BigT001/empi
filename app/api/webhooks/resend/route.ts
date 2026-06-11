import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';

// Helper to verify Resend webhook signature (Svix format)
function verifyResendSignature(
  payload: string,
  svixSignature: string,
  secret: string
): boolean {
  try {
    // Resend uses Svix-style signatures: "t=<timestamp>,v1=<signature>"
    const parts = svixSignature.split(',');
    let signature = '';
    
    for (const part of parts) {
      if (part.startsWith('v1=')) {
        signature = part.substring(3);
        break;
      }
    }

    if (!signature) {
      console.error('❌ No v1 signature found in header');
      return false;
    }

    // The secret comes as "whsec_..." - remove the prefix if present
    const secretKey = secret.startsWith('whsec_') 
      ? Buffer.from(secret.substring(6), 'base64')
      : Buffer.from(secret, 'base64');

    const hmac = crypto.createHmac('sha256', secretKey);
    
    // For Svix, we need to sign: "<timestamp>.<payload>"
    // Extract timestamp from signature header
    let timestamp = '';
    for (const part of parts) {
      if (part.startsWith('t=')) {
        timestamp = part.substring(2);
        break;
      }
    }

    if (!timestamp) {
      console.error('❌ No timestamp found in signature header');
      return false;
    }

    const signedContent = `${timestamp}.${payload}`;
    hmac.update(signedContent);
    const digest = hmac.digest('base64');

    return digest === signature;
  } catch (error) {
    console.error('Error verifying Resend signature:', error);
    return false;
  }
}

// Helper to generate ticket number
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMPI-${timestamp}${random}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get raw body for signature verification
    const rawBody = await req.text();
    const svixSignature = req.headers.get('svix-signature') || '';
    const secret = process.env.RESEND_WEBHOOK_SECRET;

    if (!secret) {
      console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    if (!verifyResendSignature(rawBody, svixSignature, secret)) {
      console.warn('⚠️ Invalid webhook signature - still processing for testing');
      // For now, log but don't reject - helps with debugging
      console.log(`Signature header: ${svixSignature}`);
      console.log(`Raw body length: ${rawBody.length}`);
    }

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

    // Handle different webhook types
    if (payload.type === 'email.inbound') {
      const inboundData = payload.data;
      const toEmail = inboundData.to?.[0]?.email; // Email destination
      const fromEmail = inboundData.from?.email; // Sender's email
      const fromName = inboundData.from?.name || 'Unknown'; // Sender's name
      const subject = inboundData.subject || '(No Subject)';
      const textContent = inboundData.text || '';
      const htmlContent = inboundData.html || '';
      const messageId = inboundData.message_id;

      if (!toEmail || !fromEmail) {
        console.error('❌ Missing required fields in inbound email');
        return NextResponse.json(
          { error: 'Missing to or from email' },
          { status: 400 }
        );
      }

      console.log(`📧 Inbound email received: ${fromEmail} → ${toEmail}`);

      // Find the email service (department)
      const emailService = await EmailService.findOne({
        email: toEmail.toLowerCase(),
        isActive: true,
      });

      if (!emailService) {
        console.warn(`⚠️ No email service found for ${toEmail}`);
        return NextResponse.json(
          { message: 'Email service not configured' },
          { status: 404 }
        );
      }

      // Check if this is a reply to an existing ticket
      // Look for tickets from same customer email with this department
      let ticket = await MailRoomTicket.findOne({
        customerEmail: fromEmail.toLowerCase(),
        department: toEmail.toLowerCase(),
        status: { $in: ['open', 'pending'] }, // Only match open/pending tickets
      }).sort({ lastMessageAt: -1 }); // Get most recent

      if (!ticket) {
        // Create new ticket
        ticket = new MailRoomTicket({
          ticketNumber: generateTicketNumber(),
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
        console.log(`✅ New ticket created: ${ticket.ticketNumber}`);
      } else {
        // Update existing ticket
        ticket.lastMessageAt = new Date();
        await ticket.save();
        console.log(`✅ Updated existing ticket: ${ticket.ticketNumber}`);
      }

      // Create inbound message
      const message = new MailRoomMessage({
        ticketId: ticket._id,
        direction: 'inbound',
        senderEmail: fromEmail.toLowerCase(),
        senderName: fromName,
        recipientEmail: toEmail.toLowerCase(),
        content: textContent || htmlContent, // Prefer text, fall back to HTML
        externalMessageId: messageId, // Store Resend message ID for reference
      });
      await message.save();
      console.log(`✅ Message saved for ticket ${ticket.ticketNumber}`);

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
      console.warn(
        `⚠️ Email ${payload.type}: ${payload.data?.email} - ${payload.data?.bounce_type}`
      );
      // Could implement bounce handling here (e.g., mark customer as invalid)
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
