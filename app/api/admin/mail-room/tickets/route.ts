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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const priority = searchParams.get('priority') || '';

    // Step 1: Find all services this admin can view
    const services = await EmailService.find({ isActive: true }).lean();
    const isSuperOrAdmin = admin.role === 'super_admin' || admin.role === 'admin';
    
    const visibleServices = services.filter((service: any) => {
      if (isSuperOrAdmin) return true;
      if (service.allowedAdmins && service.allowedAdmins.some((id: any) => id.toString() === admin._id.toString())) {
        return true;
      }
      if (service.allowedRoles && service.allowedRoles.includes(admin.role)) {
        return true;
      }
      // Default mappings fallback (when no custom restrictions are set in DB)
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

    // Step 2: Build the search filter
    const filter: any = {
      department: { $in: visibleEmails },
    };

    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    if (department) {
      // If user clicks a specific department folder, check that they can access it
      if (visibleEmails.includes(department.toLowerCase())) {
        filter.department = department.toLowerCase();
      } else {
        // Restricted or invalid department folder click
        return NextResponse.json({ tickets: [], departmentCounts: {} });
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { customerName: searchRegex },
        { customerEmail: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Step 3: Fetch tickets
    const tickets = await MailRoomTicket.find(filter)
      .populate('assignedTo', 'fullName email role')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Step 4: Aggregate ticket counts per department (only for the ones they are authorized to view)
    const counts: Record<string, { total: number, open: number, pending: number }> = {};
    
    // Seed counts object with the visible emails to ensure they show up in UI sidebar
    visibleEmails.forEach(email => {
      counts[email] = { total: 0, open: 0, pending: 0 };
    });

    // Run an aggregation to count tickets in status categories per visible department
    const agg = await MailRoomTicket.aggregate([
      { $match: { department: { $in: visibleEmails } } },
      {
        $group: {
          _id: { department: '$department', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    agg.forEach((item: any) => {
      const dept = item._id.department;
      const stat = item._id.status;
      const count = item.count;
      
      if (!counts[dept]) {
        counts[dept] = { total: 0, open: 0, pending: 0 };
      }
      counts[dept].total += count;
      if (stat === 'open') {
        counts[dept].open += count;
      } else if (stat === 'pending') {
        counts[dept].pending += count;
      }
    });

    return NextResponse.json({
      tickets,
      departmentCounts: counts,
    });
  } catch (error: any) {
    console.error('GET Tickets Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE all tickets (clear demo data)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super_admin and admin can delete all data
    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Delete all tickets and messages
    const MailRoomMessage = require('@/lib/models/MailRoomMessage').default;
    
    await MailRoomTicket.deleteMany({});
    await MailRoomMessage.deleteMany({});

    return NextResponse.json({
      message: 'All tickets and messages deleted successfully',
      deletedTickets: true,
    });
  } catch (error: any) {
    console.error('DELETE Tickets Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
