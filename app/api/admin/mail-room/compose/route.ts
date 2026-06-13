import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';
import { Resend } from 'resend';

// Helper to authenticate admin
async function getAuthenticatedAdmin(req: NextRequest) {
  const sessionToken = req.cookies.get('admin_session')?.value;
  if (!sessionToken) return null;

  let admin = await Admin.findOne({ 'sessions.token': sessionToken });
  if (!admin) {
    admin = await Admin.findOne({ sessionToken }); // Legacy support
  }
  return admin;
}

// Generate ticket number
function generateTicketNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'EMPI-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { recipientEmail, recipientName, subject, content, department } = await req.json();

    if (!recipientEmail || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate department exists and admin can use it
    const service: any = await EmailService.findOne({ email: department }).lean();
    if (!service) {
      return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
    }

    // Check permissions
    const isSuperOrAdmin = admin.role === 'super_admin' || admin.role === 'admin';
    const canUseService = isSuperOrAdmin || 
      (service.allowedAdmins && service.allowedAdmins.some((id: any) => id.toString() === admin._id.toString())) ||
      (service.allowedRoles && service.allowedRoles.includes(admin.role));

    if (!canUseService) {
      return NextResponse.json({ error: 'You do not have permission to use this department' }, { status: 403 });
    }

    // Check if ticket already exists for this customer + department
    let ticket = await MailRoomTicket.findOne({
      customerEmail: recipientEmail.toLowerCase(),
      department: department.toLowerCase(),
    });

    // Create new ticket if doesn't exist
    if (!ticket) {
      const ticketNumber = generateTicketNumber();
      ticket = await MailRoomTicket.create({
        ticketNumber,
        subject,
        customerName: recipientName || 'Customer',
        customerEmail: recipientEmail.toLowerCase(),
        status: 'open',
        priority: 'medium',
        department: department.toLowerCase(),
        assignedTo: null,
        tags: [],
        lastMessageAt: new Date(),
      });
    } else {
      // Update lastMessageAt for existing ticket
      ticket.lastMessageAt = new Date();
      await ticket.save();
    }

    // Create outbound message
    const message = await MailRoomMessage.create({
      ticketId: ticket._id,
      direction: 'outbound',
      senderEmail: service.email,
      senderName: service.name,
      recipientEmail: recipientEmail.toLowerCase(),
      recipientName: recipientName || 'Customer',
      content: content,
      createdAt: new Date(),
    });

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
      await resend.emails.send({
        from: service.email,
        to: recipientEmail,
        subject: subject,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #202124; line-height: 1.5;">
            <div style="white-space: pre-wrap;">${content}</div>
            <div style="margin-top: 24px; color: #5f6368; font-size: 13px;">
              --<br>
              Empi Costumes
            </div>
          </div>
        `,
      });
    } catch (emailError: any) {
      console.error('Failed to send email via Resend:', emailError);
      // Don't fail the request - email sending is best-effort
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      ticket: ticket._id,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error: any) {
    console.error('Compose Email Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
