import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/lib/models/Admin';
import EmailService from '@/lib/models/EmailService';
import MailRoomTicket from '@/lib/models/MailRoomTicket';

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

export async function PUT(
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
      return NextResponse.json({ error: 'Unauthorized: You do not have permission to manage this ticket' }, { status: 403 });
    }

    const body = await req.json();
    const { status, priority, assignedTo, tags } = body;

    // Update values if provided
    if (status !== undefined) {
      if (!['open', 'pending', 'resolved', 'closed'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
      }
      ticket.status = status;
    }

    if (priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
      ticket.priority = priority;
    }

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === '') {
        ticket.assignedTo = null;
      } else {
        ticket.assignedTo = assignedTo;
      }
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        ticket.tags = tags;
      } else {
        return NextResponse.json({ error: 'Tags must be an array of strings' }, { status: 400 });
      }
    }

    await ticket.save();
    
    // Fetch populated ticket
    const updatedTicket = await MailRoomTicket.findById(ticket._id)
      .populate('assignedTo', 'fullName email role')
      .lean();

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('PUT Ticket Status Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
