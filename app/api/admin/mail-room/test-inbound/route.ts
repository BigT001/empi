import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
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

    // Check if authenticated as admin (allow for local dev testing)
    const sessionToken = req.cookies.get('admin_session')?.value;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && !sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionToken) {
      const admin = await Admin.findOne({ 'sessions.token': sessionToken });
      if (!admin || !admin.isActive || admin.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized - super admin only' }, { status: 403 });
      }
    }

    // Get test data from request
    const body = await req.json();
    const {
      fromEmail = 'test@example.com',
      fromName = 'Test Sender',
      toEmail = 'pmoney@empicostumes.com',
      subject = 'Test Email',
      content = 'This is a test inbound email',
    } = body;

    if (!toEmail || !fromEmail) {
      return NextResponse.json(
        { error: 'fromEmail and toEmail are required' },
        { status: 400 }
      );
    }

    // Find the email service (department)
    const emailService = await EmailService.findOne({
      email: toEmail.toLowerCase(),
      isActive: true,
    });

    if (!emailService) {
      return NextResponse.json(
        { error: `Email service not found for ${toEmail}` },
        { status: 404 }
      );
    }

    // Check if this is a reply to an existing ticket
    let ticket = await MailRoomTicket.findOne({
      customerEmail: fromEmail.toLowerCase(),
      department: toEmail.toLowerCase(),
      status: { $in: ['open', 'pending'] },
    }).sort({ lastMessageAt: -1 });

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
        tags: ['inbound', 'test'],
        lastMessageAt: new Date(),
      });
      await ticket.save();
    } else {
      // Update existing ticket
      ticket.lastMessageAt = new Date();
      await ticket.save();
    }

    // Create inbound message
    const message = new MailRoomMessage({
      ticketId: ticket._id,
      direction: 'inbound',
      senderEmail: fromEmail.toLowerCase(),
      senderName: fromName,
      recipientEmail: toEmail.toLowerCase(),
      content,
    });
    await message.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Test inbound email created successfully',
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        messageId: message._id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('❌ Test inbound email error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Check if authenticated as admin (allow for local dev testing)
    const sessionToken = req.cookies.get('admin_session')?.value;
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && !sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionToken) {
      const admin = await Admin.findOne({ 'sessions.token': sessionToken });
      if (!admin || !admin.isActive || admin.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized - super admin only' }, { status: 403 });
      }
    }

    // Get all active email services
    const emailServices = await EmailService.find({ isActive: true }).select('email name').lean();

    // Get recent inbound messages
    const recentMessages = await MailRoomMessage.find({ direction: 'inbound' })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('ticketId', 'ticketNumber department')
      .lean();

    return NextResponse.json({
      status: 'Test inbound email endpoint',
      activeEmailServices: emailServices,
      recentInboundMessages: recentMessages.map((msg: any) => ({
        id: msg._id,
        ticketNumber: msg.ticketId?.ticketNumber,
        from: msg.senderEmail,
        to: msg.recipientEmail,
        subject: msg.content?.substring(0, 50),
        createdAt: msg.createdAt,
      })),
      instructions: {
        post: 'POST /api/admin/mail-room/test-inbound with { fromEmail, fromName, toEmail, subject, content }',
        example: {
          fromEmail: 'customer@example.com',
          fromName: 'John Doe',
          toEmail: 'pmoney@empicostumes.com',
          subject: 'Test Subject',
          content: 'Test email content',
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
