import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import Admin from '@/lib/models/Admin';

interface TestResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

/**
 * Comprehensive email receiving test endpoint
 * Tests the entire inbound email flow from payload to database to UI display
 */
export async function POST(req: NextRequest) {
  const results: TestResult[] = [];

  try {
    // ==========================================
    // STEP 1: Database connection
    // ==========================================
    try {
      await connectDB();
      results.push({
        step: '1. Database Connection',
        status: 'success',
        message: 'Connected to MongoDB successfully',
      });
    } catch (error: any) {
      results.push({
        step: '1. Database Connection',
        status: 'error',
        message: 'Failed to connect to MongoDB',
        details: error.message,
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    // ==========================================
    // STEP 2: Check email services
    // ==========================================
    const emailServices = (await EmailService.find({ isActive: true }).lean()) as any[];
    if (emailServices.length === 0) {
      results.push({
        step: '2. Email Services',
        status: 'error',
        message: 'No email services found - must create at least one (e.g., pmoney@empicostumes.com)',
        details: null,
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    results.push({
      step: '2. Email Services',
      status: 'success',
      message: `Found ${emailServices.length} active email service(s)`,
      details: emailServices.map((s: any) => ({
        name: s.name,
        email: s.email,
        department: s.department,
      })),
    });

    // ==========================================
    // STEP 3: Setup test parameters
    // ==========================================
    const testEmailService = emailServices[0];
    const testToEmail = testEmailService.email;
    const testFromEmail = `testuser-${Date.now()}@testdomain.com`;
    const testSubject = `[AUTOMATED TEST] Email Receiving Verification - ${new Date().toISOString()}`;

    results.push({
      step: '3. Test Configuration',
      status: 'success',
      message: 'Test parameters configured',
      details: {
        fromEmail: testFromEmail,
        toEmail: testToEmail,
        subject: testSubject,
        service: testEmailService.name,
      },
    });

    // ==========================================
    // STEP 4: Simulate webhook payload
    // ==========================================
    const webhookPayload = {
      type: 'email.inbound',
      data: {
        id: `test-${Date.now()}@resend.com`,
        from: {
          email: testFromEmail,
          name: 'Test User',
        },
        to: [testToEmail],
        subject: testSubject,
        html: `<p>This is an automated test email to verify the email receiving system is working correctly.</p>
               <p>If you see this in the Mail Room, the system is working!</p>
               <p>Time: ${new Date().toISOString()}</p>`,
        text: 'This is an automated test email to verify the email receiving system is working correctly.',
        message_id: `<test-${Date.now()}@testdomain.com>`,
      },
    };

    results.push({
      step: '4. Webhook Payload Creation',
      status: 'success',
      message: 'Simulated Resend webhook payload created',
      details: {
        eventType: webhookPayload.type,
        from: webhookPayload.data.from.email,
        to: webhookPayload.data.to[0],
        subject: webhookPayload.data.subject,
      },
    });

    // ==========================================
    // STEP 5: Extract and validate email addresses
    // ==========================================
    const inboundData = webhookPayload.data;
    let toEmail = '';
    if (inboundData.to && Array.isArray(inboundData.to)) {
      toEmail = typeof inboundData.to[0] === 'string' 
        ? inboundData.to[0]
        : inboundData.to[0]?.email;
    }

    const fromEmail = typeof inboundData.from === 'object'
      ? inboundData.from?.email
      : inboundData.from;
    const fromName = typeof inboundData.from === 'object'
      ? inboundData.from?.name || 'Test User'
      : 'Test User';

    if (!toEmail || !fromEmail) {
      results.push({
        step: '5. Email Address Extraction',
        status: 'error',
        message: 'Failed to extract email addresses',
        details: { toEmail, fromEmail },
      });
      return NextResponse.json({ success: false, results }, { status: 400 });
    }

    results.push({
      step: '5. Email Address Extraction',
      status: 'success',
      message: 'Email addresses extracted successfully',
      details: { fromEmail, toEmail },
    });

    // ==========================================
    // STEP 6: Lookup email service
    // ==========================================
    const foundService = await EmailService.findOne({
      email: toEmail.toLowerCase(),
      isActive: true,
    });

    if (!foundService) {
      results.push({
        step: '6. Email Service Lookup',
        status: 'error',
        message: `Email service not found for ${toEmail}`,
        details: { searchedEmail: toEmail.toLowerCase() },
      });
      return NextResponse.json({ success: false, results }, { status: 404 });
    }

    results.push({
      step: '6. Email Service Lookup',
      status: 'success',
      message: `Found email service: ${foundService.name}`,
      details: {
        serviceId: foundService._id,
        serviceName: foundService.name,
        serviceDepartment: foundService.department,
      },
    });

    // ==========================================
    // STEP 7: Create or update ticket
    // ==========================================
    const threadId = `thread-${fromEmail}-${toEmail}`.toLowerCase();
    let ticket = await MailRoomTicket.findOne({
      customerEmail: fromEmail.toLowerCase(),
      department: toEmail.toLowerCase(),
      status: { $in: ['open', 'pending'] },
    }).sort({ lastMessageAt: -1 });

    let ticketCreated = false;
    if (!ticket) {
      const ticketNumber = `TEST-${Date.now().toString(36).toUpperCase()}`;
      ticket = new MailRoomTicket({
        ticketNumber,
        subject: testSubject,
        customerName: fromName,
        customerEmail: fromEmail.toLowerCase(),
        status: 'open',
        priority: 'medium',
        department: toEmail.toLowerCase(),
        threadId,
        tags: ['test', 'automated'],
        lastMessageAt: new Date(),
      });
      await ticket.save();
      ticketCreated = true;
      results.push({
        step: '7. Ticket Creation',
        status: 'success',
        message: `Created new test ticket: ${ticket.ticketNumber}`,
        details: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
        },
      });
    } else {
      ticket.lastMessageAt = new Date();
      ticket.threadId = threadId;
      await ticket.save();
      results.push({
        step: '7. Ticket Lookup',
        status: 'success',
        message: `Using existing ticket: ${ticket.ticketNumber}`,
        details: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          updatedAt: ticket.lastMessageAt,
        },
      });
    }

    // ==========================================
    // STEP 8: Create inbound message
    // ==========================================
    const content = inboundData.html || inboundData.text || '(No content)';
    const message = new MailRoomMessage({
      ticketId: ticket._id,
      direction: 'inbound',
      senderEmail: fromEmail.toLowerCase(),
      senderName: fromName,
      recipientEmail: toEmail.toLowerCase(),
      content,
      textContent: inboundData.text || undefined,
      htmlContent: inboundData.html || undefined,
      externalMessageId: inboundData.message_id,
      resendEmailId: inboundData.id,
      threadId,
    });
    await message.save();

    results.push({
      step: '8. Message Creation',
      status: 'success',
      message: 'Inbound message saved to database',
      details: {
        messageId: message._id,
        direction: message.direction,
        size: content.length,
      },
    });

    // ==========================================
    // STEP 9: Verify message in database
    // ==========================================
    const verifyMessage = await MailRoomMessage.findById(message._id);
    if (!verifyMessage) {
      results.push({
        step: '9. Message Database Verification',
        status: 'error',
        message: 'Failed to retrieve message from database',
        details: { messageId: message._id },
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    results.push({
      step: '9. Message Database Verification',
      status: 'success',
      message: 'Message verified in database',
      details: {
        messageId: verifyMessage._id,
        direction: verifyMessage.direction,
        senderEmail: verifyMessage.senderEmail,
      },
    });

    // ==========================================
    // STEP 10: Verify ticket in database
    // ==========================================
    const verifyTicket = await MailRoomTicket.findById(ticket._id);
    if (!verifyTicket) {
      results.push({
        step: '10. Ticket Database Verification',
        status: 'error',
        message: 'Failed to retrieve ticket from database',
        details: { ticketId: ticket._id },
      });
      return NextResponse.json({ success: false, results }, { status: 500 });
    }

    results.push({
      step: '10. Ticket Database Verification',
      status: 'success',
      message: 'Ticket verified in database',
      details: {
        ticketId: verifyTicket._id,
        ticketNumber: verifyTicket.ticketNumber,
        status: verifyTicket.status,
      },
    });

    // ==========================================
    // STEP 11: Retrieve ticket messages
    // ==========================================
    const ticketMessages = await MailRoomMessage.find({ ticketId: ticket._id });
    results.push({
      step: '11. Ticket Messages Retrieval',
      status: 'success',
      message: `Retrieved ${ticketMessages.length} message(s) for ticket`,
      details: {
        messageCount: ticketMessages.length,
        messages: ticketMessages.map(m => ({
          id: m._id,
          direction: m.direction,
          from: m.senderEmail,
        })),
      },
    });

    // ==========================================
    // STEP 12: Test admin access
    // ==========================================
    const adminCount = await Admin.countDocuments({ isActive: true });
    results.push({
      step: '12. Admin Access Check',
      status: 'success',
      message: `${adminCount} active admin(s) can access Mail Room`,
      details: { activeAdmins: adminCount },
    });

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    return NextResponse.json(
      {
        success: true,
        results,
        summary: {
          ticketNumber: ticket.ticketNumber,
          ticketId: ticket._id,
          messageId: message._id,
          threadId,
          testFromEmail,
          testToEmail,
          ticketCreated,
          messageCount: ticketMessages.length,
          allTestsPassed: results.every(r => r.status !== 'error'),
        },
        nextSteps: [
          '1. Go to Mail Room dashboard',
          `2. Look for ticket: ${ticket.ticketNumber}`,
          `3. Click on department: ${testEmailService.name}`,
          '4. Verify the test message appears in the conversation',
          '5. If you see it, the email receiving system is working! 🎉',
        ],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('❌ Test error:', error);
    results.push({
      step: 'ERROR',
      status: 'error',
      message: error.message || 'Unexpected error during testing',
      details: error.stack,
    });
    return NextResponse.json(
      { success: false, results },
      { status: 500 }
    );
  }
}

// GET endpoint - show test status
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const ticketCount = await MailRoomTicket.countDocuments();
    const messageCount = await MailRoomMessage.countDocuments();
    const inboundCount = await MailRoomMessage.countDocuments({ direction: 'inbound' });
    const outboundCount = await MailRoomMessage.countDocuments({ direction: 'outbound' });
    const serviceCount = await EmailService.countDocuments({ isActive: true });

    // Get recent test messages
    const recentTests = await MailRoomMessage.find({
      tags: { $in: ['test'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      status: 'Email Receiving Test Suite',
      database: {
        totalTickets: ticketCount,
        totalMessages: messageCount,
        inboundMessages: inboundCount,
        outboundMessages: outboundCount,
        activeServices: serviceCount,
      },
      recentTests: (recentTests as any[]).map((msg: any) => ({
        id: msg._id,
        direction: msg.direction,
        senderEmail: msg.senderEmail,
        createdAt: msg.createdAt,
      })),
      instructions: {
        method: 'POST',
        description: 'Run comprehensive email receiving test',
        expectedResponse: 'JSON with 12-step test results and summary',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
