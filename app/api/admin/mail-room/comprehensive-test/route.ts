import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import Admin from '@/lib/models/Admin';

interface DiagnosticResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export async function POST(req: NextRequest) {
  const results: DiagnosticResult[] = [];

  try {
    // Step 1: Database connection
    try {
      await connectDB();
      results.push({
        step: 'Database Connection',
        status: 'success',
        message: 'Connected to MongoDB',
      });
    } catch (error: any) {
      results.push({
        step: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to MongoDB',
        details: error.message,
      });
      return NextResponse.json({ results, success: false }, { status: 500 });
    }

    // Step 2: Check email services
    const emailServices = (await EmailService.find({ isActive: true }).lean()) as any;
    if (emailServices.length === 0) {
      results.push({
        step: 'Email Services',
        status: 'error',
        message: 'No email services found in database',
      });
      return NextResponse.json({ results, success: false }, { status: 500 });
    }
    results.push({
      step: 'Email Services',
      status: 'success',
      message: `Found ${emailServices.length} active email services`,
      details: emailServices.map((s: any) => ({
        name: s.name,
        email: s.email,
        isActive: s.isActive,
      })),
    });

    // Step 3: Get test email to use
    const testEmailService = emailServices[0] as any;
    const testToEmail = testEmailService.email;
    const testFromEmail = 'testuser-' + Date.now() + '@gmail.com';

    results.push({
      step: 'Test Configuration',
      status: 'success',
      message: `Testing inbound email flow`,
      details: {
        testFromEmail,
        testToEmail,
        testService: testEmailService.name,
      },
    });

    // Step 4: Create test webhook payload
    const webhookPayload = {
      type: 'email.inbound',
      data: {
        from: {
          name: 'Test User',
          email: testFromEmail,
        },
        to: [testToEmail], // Array of strings format
        subject: `[TEST] Comprehensive Email Receiving Test - ${new Date().toISOString()}`,
        text: 'This is a comprehensive test of the email receiving system.',
        html: '<p>This is a comprehensive test of the email receiving system.</p>',
        message_id: `<test-${Date.now()}@testdomain.com>`,
      },
    };

    results.push({
      step: 'Webhook Payload',
      status: 'success',
      message: 'Created test webhook payload',
      details: {
        from: webhookPayload.data.from,
        to: webhookPayload.data.to,
        subject: webhookPayload.data.subject,
      },
    });

    // Step 5: Process webhook payload (inline)
    const inboundData = webhookPayload.data;

    // Extract to email
    let toEmail = '';
    if (inboundData.to && Array.isArray(inboundData.to)) {
      if (typeof inboundData.to[0] === 'string') {
        toEmail = inboundData.to[0];
      } else if (inboundData.to[0]?.email) {
        toEmail = inboundData.to[0].email;
      }
    }

    const fromEmail = typeof inboundData.from === 'object'
      ? inboundData.from?.email
      : inboundData.from;
    const fromName = typeof inboundData.from === 'object'
      ? inboundData.from?.name || 'Unknown'
      : inboundData.from || 'Unknown';

    if (!toEmail || !fromEmail) {
      results.push({
        step: 'Email Extraction',
        status: 'error',
        message: 'Failed to extract email addresses',
        details: { toEmail, fromEmail },
      });
      return NextResponse.json({ results, success: false }, { status: 400 });
    }

    results.push({
      step: 'Email Extraction',
      status: 'success',
      message: 'Extracted email addresses from payload',
      details: { fromEmail, toEmail },
    });

    // Step 6: Find email service in database
    const emailService = await EmailService.findOne({
      email: toEmail.toLowerCase(),
      isActive: true,
    });

    if (!emailService) {
      results.push({
        step: 'Email Service Lookup',
        status: 'error',
        message: `No email service found for ${toEmail}`,
        details: {
          searchedEmail: toEmail.toLowerCase(),
          availableServices: emailServices.map((s: any) => s.email),
        },
      });
      return NextResponse.json({ results, success: false }, { status: 404 });
    }

    results.push({
      step: 'Email Service Lookup',
      status: 'success',
      message: `Found email service: ${emailService.name}`,
      details: {
        serviceId: emailService._id,
        serviceName: emailService.name,
        serviceEmail: emailService.email,
      },
    });

    // Step 7: Check or create ticket
    let ticket = await MailRoomTicket.findOne({
      customerEmail: fromEmail.toLowerCase(),
      department: toEmail.toLowerCase(),
      status: { $in: ['open', 'pending'] },
    }).sort({ lastMessageAt: -1 });

    if (!ticket) {
      const ticketNumber = `EMPI-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      ticket = new MailRoomTicket({
        ticketNumber,
        subject: inboundData.subject || '(No Subject)',
        customerName: fromName,
        customerEmail: fromEmail.toLowerCase(),
        status: 'open',
        priority: 'medium',
        department: toEmail.toLowerCase(),
        tags: ['inbound', 'resend', 'test'],
        lastMessageAt: new Date(),
      });
      await ticket.save();

      results.push({
        step: 'Ticket Creation',
        status: 'success',
        message: 'Created new ticket',
        details: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
          department: ticket.department,
          customerEmail: ticket.customerEmail,
        },
      });
    } else {
      ticket.lastMessageAt = new Date();
      await ticket.save();

      results.push({
        step: 'Ticket Lookup',
        status: 'success',
        message: 'Found existing ticket',
        details: {
          ticketId: ticket._id,
          ticketNumber: ticket.ticketNumber,
        },
      });
    }

    // Step 8: Create inbound message
    const message = new MailRoomMessage({
      ticketId: ticket._id,
      direction: 'inbound',
      senderEmail: fromEmail.toLowerCase(),
      senderName: fromName,
      recipientEmail: toEmail.toLowerCase(),
      content: inboundData.text || inboundData.html,
      externalMessageId: inboundData.message_id,
    });
    await message.save();

    results.push({
      step: 'Message Creation',
      status: 'success',
      message: 'Created inbound message',
      details: {
        messageId: message._id,
        direction: message.direction,
        senderEmail: message.senderEmail,
        recipientEmail: message.recipientEmail,
      },
    });

    // Step 9: Verify message exists in database
    const verifyMessage = await MailRoomMessage.findById(message._id);
    if (!verifyMessage) {
      results.push({
        step: 'Message Verification',
        status: 'error',
        message: 'Message was not saved to database',
      });
      return NextResponse.json({ results, success: false }, { status: 500 });
    }

    results.push({
      step: 'Message Verification',
      status: 'success',
      message: 'Verified message exists in database',
      details: {
        messageId: verifyMessage._id,
        createdAt: verifyMessage.createdAt,
      },
    });

    // Step 10: Check ticket is retrievable
    const verifyTicket = (await MailRoomTicket.findById(ticket._id).lean()) as any;
    if (!verifyTicket) {
      results.push({
        step: 'Ticket Verification',
        status: 'error',
        message: 'Ticket was not saved to database',
      });
      return NextResponse.json({ results, success: false }, { status: 500 });
    }

    results.push({
      step: 'Ticket Verification',
      status: 'success',
      message: 'Verified ticket exists in database',
      details: {
        ticketId: verifyTicket._id,
        ticketNumber: verifyTicket.ticketNumber,
      },
    });

    // Step 11: Verify messages are retrievable for ticket
    const ticketMessages = (await MailRoomMessage.find({
      ticketId: ticket._id,
    }).lean()) as any;

    results.push({
      step: 'Ticket Messages Retrieval',
      status: 'success',
      message: `Retrieved ${ticketMessages.length} messages for ticket`,
      details: {
        messageIds: ticketMessages.map((m: any) => m._id),
      },
    });

    // Step 12: Check if admin can see the ticket
    const adminSessionToken = req.cookies.get('admin_session')?.value;
    if (adminSessionToken) {
      const admin = await Admin.findOne({
        'sessions.token': adminSessionToken,
      });

      if (admin) {
        const isSuperOrAdmin =
          admin.role === 'super_admin' || admin.role === 'admin';

        results.push({
          step: 'Admin Permission Check',
          status: 'success',
          message: `Admin ${admin.email} has access (role: ${admin.role})`,
          details: {
            adminRole: admin.role,
            hasFullAccess: isSuperOrAdmin,
          },
        });
      }
    }

    results.push({
      step: 'COMPREHENSIVE TEST COMPLETE',
      status: 'success',
      message: 'All steps completed successfully. Email receiving system is working.',
      details: {
        testTicketNumber: ticket.ticketNumber,
        testMessageId: message._id,
        totalResults: results.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        results,
        summary: {
          ticketCreated: ticket.ticketNumber,
          messageCreated: message._id,
          testEmailFrom: testFromEmail,
          testEmailTo: testToEmail,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    results.push({
      step: 'ERROR',
      status: 'error',
      message: error.message || 'Unknown error occurred',
      details: {
        stack: error.stack,
        name: error.name,
      },
    });

    return NextResponse.json(
      {
        success: false,
        results,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get database stats
    const ticketsCount = await MailRoomTicket.countDocuments();
    const messagesCount = await MailRoomMessage.countDocuments();
    const inboundCount = await MailRoomMessage.countDocuments({
      direction: 'inbound',
    });
    const emailServicesCount = await EmailService.countDocuments({
      isActive: true,
    });

    // Get recent inbound messages
    const recentInbound = (await MailRoomMessage.find({
      direction: 'inbound',
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('ticketId', 'ticketNumber')
      .lean()) as any;

    return NextResponse.json({
      database: {
        ticketsCount,
        messagesCount,
        inboundCount,
        emailServicesCount,
      },
      recentInbound: recentInbound.map((msg: any) => ({
        messageId: msg._id,
        ticketNumber: msg.ticketId?.ticketNumber,
        from: msg.senderEmail,
        to: msg.recipientEmail,
        createdAt: msg.createdAt,
      })),
      nextSteps: [
        '1. Run POST request to this endpoint to perform comprehensive test',
        '2. Check the results for any errors',
        '3. Login to Mail Room and verify the test ticket appears',
        '4. If test passes but real emails fail, check Resend webhook configuration',
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
