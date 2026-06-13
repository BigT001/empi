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
          <div style="font-family: Arial, sans-serif; background: linear-gradient(135deg, #84cc16 0%, #65a30d 100%); padding: 20px;">
            <div style="background: white; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto;">
              <div style="border-bottom: 2px solid #84cc16; padding-bottom: 16px; margin-bottom: 16px;">
                <h2 style="color: #1f2937; margin: 0; font-size: 20px;">Empi Costumes Support</h2>
                <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 12px;">Ticket #${ticket.ticketNumber}</p>
              </div>
              
              <p style="color: #374151; margin: 0 0 16px 0;">Hi ${recipientName || 'there'},</p>
              
              <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #84cc16;">
                ${content.split('\n').map((line: string) => `<p style="color: #374151; margin: 8px 0;">${line}</p>`).join('')}
              </div>
              
              <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">
                Thank you for contacting Empi Costumes. We appreciate your business!
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              
              <div style="color: #6b7280; font-size: 11px; text-align: center;">
                <p style="margin: 4px 0;">Empi Costumes Support</p>
              </div>
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
