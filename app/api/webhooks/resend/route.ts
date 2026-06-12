import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { Resend } from 'resend';
import connectDB from '@/lib/mongodb';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';

// Initialize Resend for fetching full email content
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

// =====================================
// HELPER FUNCTIONS
// =====================================

function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EMPI-${timestamp}${random}`;
}

function generateThreadId(from: string, to: string): string {
  return `thread-${from}-${to}`.toLowerCase();
}

/**
 * Verify webhook signature using Svix
 * This ensures the webhook is actually from Resend
 */
function verifyWebhookSignature(
  payload: string,
  headers: Headers
): any | null {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured - signature verification disabled');
    // In development without secret, allow bypass header for testing
    if (process.env.NODE_ENV !== 'production') {
      return JSON.parse(payload);
    }
    return null;
  }

  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  // Development bypass for testing
  if (process.env.NODE_ENV !== 'production' && svixSignature === 'bypass-dev') {
    console.log('[WEBHOOK] ℹ️ Using development bypass for signature verification');
    return JSON.parse(payload);
  }

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('❌ Missing Svix headers for signature verification');
    return null;
  }

  try {
    const wh = new Webhook(webhookSecret);
    const verifiedPayload = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    console.log('✅ Webhook signature verified successfully');
    return verifiedPayload;
  } catch (error: any) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return null;
  }
}

/**
 * Handle inbound email webhook events
 */
async function handleInboundEmail(payload: any): Promise<NextResponse> {
  const inboundData = payload.data;
  
  console.log('[WEBHOOK] Processing inbound email event');
  
  // Extract to email (handle both string array and object array formats)
  let toEmail = '';
  if (inboundData.to && Array.isArray(inboundData.to)) {
    if (typeof inboundData.to[0] === 'string') {
      toEmail = inboundData.to[0];
    } else if (inboundData.to[0]?.email) {
      toEmail = inboundData.to[0].email;
    }
  }
  
  // Extract from email
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
  const emailId = inboundData.id; // Resend email ID

  console.log(`📧 FROM: ${fromEmail}`);
  console.log(`📧 TO: ${toEmail}`);
  console.log(`📧 SUBJECT: ${subject}`);

  if (!toEmail || !fromEmail) {
    console.error('❌ Missing required email fields');
    return NextResponse.json(
      { error: 'Missing to or from email', success: false },
      { status: 400 }
    );
  }

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
        success: false,
        details: `No email service found for ${toEmail}`
      },
      { status: 404 }
    );
  }

  console.log(`✅ Found email service: ${emailService.name}`);

  // Generate thread ID for grouping conversations
  const threadId = generateThreadId(fromEmail, toEmail);

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
      threadId, // Link to conversation thread
      tags: ['inbound', 'resend', 'auto-created'],
      lastMessageAt: new Date(),
    });
    await ticket.save();
    console.log(`✅ Created new ticket: ${ticket.ticketNumber}`);
  } else {
    // Update existing ticket with latest message timestamp
    ticket.lastMessageAt = new Date();
    ticket.threadId = threadId; // Ensure threadId is set
    await ticket.save();
    console.log(`✅ Updated existing ticket: ${ticket.ticketNumber}`);
  }

  // Create inbound message with both text and HTML
  const content = htmlContent || textContent || '(No content)';
  
  console.log(`📝 Creating inbound message (${content.length} bytes)`);

  const message = new MailRoomMessage({
    ticketId: ticket._id,
    direction: 'inbound',
    senderEmail: fromEmail.toLowerCase(),
    senderName: fromName,
    recipientEmail: toEmail.toLowerCase(),
    content,
    textContent: textContent || undefined,
    htmlContent: htmlContent || undefined,
    externalMessageId: messageId,
    resendEmailId: emailId, // Store Resend email ID for reference
    threadId, // Link to thread
  });
  await message.save();
  console.log(`✅ Message saved: ${message._id}`);

  return NextResponse.json(
    {
      success: true,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      messageId: message._id,
      threadId,
    },
    { status: 200 }
  );
}

/**
 * Handle outbound email event tracking
 */
async function handleOutboundEvent(eventType: string, payload: any): Promise<NextResponse> {
  const { email, message_id, id } = payload.data;

  console.log(`📤 Processing outbound event: ${eventType} for ${email}`);

  // Find the message in database by external message ID
  const message = await MailRoomMessage.findOne({
    externalMessageId: message_id,
  });

  if (!message) {
    console.warn(`⚠️ Could not find message for outbound event: ${message_id}`);
    return NextResponse.json(
      { success: true, warning: 'Message not found' },
      { status: 200 }
    );
  }

  // Update message status based on event type
  const statusMap: { [key: string]: string } = {
    'email.sent': 'SENT',
    'email.delivered': 'DELIVERED',
    'email.bounced': 'BOUNCED',
    'email.complained': 'COMPLAINED',
    'email.opened': 'OPENED',
    'email.clicked': 'CLICKED',
  };

  const status = statusMap[eventType] || 'PROCESSED';
  (message as any).status = status;
  (message as any).resendEmailId = id;
  await message.save();

  console.log(`✅ Updated message ${message._id} status to ${status}`);

  return NextResponse.json(
    {
      success: true,
      eventType,
      messageId: message._id,
      status,
    },
    { status: 200 }
  );
}

// =====================
// MAIN WEBHOOK HANDLER
// =====================

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get raw body for signature verification
    const rawBody = await req.text();
    console.log(`[WEBHOOK] Received payload: ${rawBody.length} bytes`);

    // Verify Svix signature
    const payload = verifyWebhookSignature(rawBody, req.headers);
    if (!payload) {
      console.error('❌ Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid webhook signature', success: false },
        { status: 401 }
      );
    }

    console.log(`[WEBHOOK] Event type: ${payload.type}`);

    // Route to appropriate handler
    if (payload.type === 'email.inbound') {
      return await handleInboundEmail(payload);
    }

    if (['email.sent', 'email.delivered', 'email.bounced', 'email.complained', 'email.opened', 'email.clicked'].includes(payload.type)) {
      return await handleOutboundEvent(payload.type, payload);
    }

    // Log unhandled event types
    console.log(`ℹ️ Unhandled webhook event type: ${payload.type}`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
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
      activeEmailServices: (emailServices as any).length,
      lastMessages: (recentMessages as any[]).map((msg: any) => ({
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
