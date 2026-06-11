import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';

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

export async function GET(
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

    const ticket = (await MailRoomTicket.findById(id).populate('assignedTo', 'fullName email role').lean()) as any;
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
      return NextResponse.json({ error: 'Unauthorized: You do not have permission to view this department' }, { status: 403 });
    }

    // Fetch messages for this ticket
    const messages = await MailRoomMessage.find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      ticket,
      messages,
    });
  } catch (error: any) {
    console.error('GET Ticket Detail Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
