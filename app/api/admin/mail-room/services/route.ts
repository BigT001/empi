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

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const services = await EmailService.find({}).sort({ name: 1 }).lean();

    // Permissions check
    const isSuperOrAdmin = admin.role === 'super_admin' || admin.role === 'admin';
    let visibleServices = services;

    if (!isSuperOrAdmin) {
      visibleServices = services.filter((service: any) => {
        // Explicit admin ID assignment
        if (service.allowedAdmins && service.allowedAdmins.some((id: any) => id.toString() === admin._id.toString())) {
          return true;
        }
        // Explicit role assignment
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
    }

    // Include all admins list for configuring permissions (only for super_admin / admin)
    let adminsList: any[] = [];
    if (isSuperOrAdmin) {
      adminsList = await Admin.find({ isActive: true }, '_id email fullName role').lean();
    }

    return NextResponse.json({
      services: visibleServices,
      admins: adminsList,
    });
  } catch (error: any) {
    console.error('GET Services Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super_admin or admin can create new services
    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, provider, settings, allowedRoles, allowedAdmins } = body;

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and Name are required' }, { status: 400 });
    }

    // Check if service already exists
    const existing = await EmailService.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'An email service with this address already exists' }, { status: 400 });
    }

    const newService = new EmailService({
      email: email.toLowerCase(),
      name,
      provider: provider || 'simulated',
      settings: settings || null,
      allowedRoles: allowedRoles || [],
      allowedAdmins: allowedAdmins || [],
      isActive: true,
    });

    await newService.save();

    // Auto-generate some simulated tickets for this new service
    if (newService.provider === 'simulated') {
      const demoSubjects = [
        `Welcome to the new ${name} Mailbox!`,
        `Question about the ${name} service availability`,
        `Urgent request regarding recent details`,
      ];
      
      const demoCustomers = [
        { name: 'Sarah Connor', email: 'sarah.c@gmail.com' },
        { name: 'John Doe', email: 'johndoe@yahoo.com' },
        { name: 'Bruce Wayne', email: 'bruce@waynecorp.com' },
      ];

      for (let i = 0; i < 3; i++) {
        const ticketNum = `EMPI-NEW-${Math.floor(1000 + Math.random() * 9000)}`;
        const ticket = new MailRoomTicket({
          ticketNumber: ticketNum,
          subject: demoSubjects[i],
          customerName: demoCustomers[i].name,
          customerEmail: demoCustomers[i].email,
          status: 'open',
          priority: i === 2 ? 'high' : 'medium',
          department: newService.email,
          assignedTo: null,
          lastMessageAt: new Date(Date.now() - i * 60 * 60 * 1000),
          tags: [name.toLowerCase(), 'new-inbox'],
        });
        await ticket.save();

        const message = new MailRoomMessage({
          ticketId: ticket._id,
          direction: 'inbound',
          senderEmail: demoCustomers[i].email,
          senderName: demoCustomers[i].name,
          recipientEmail: newService.email,
          content: `Hi ${name} Team,\n\nThis is a simulated support query sent to your newly configured email service (${newService.email}). Let's verify that the inbox receives messages correctly and can respond.\n\nThanks,\n${demoCustomers[i].name}`,
        });
        await message.save();
      }
    }

    return NextResponse.json(newService, { status: 201 });
  } catch (error: any) {
    console.error('POST Services Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super_admin or admin can modify service permissions/settings
    if (admin.role !== 'super_admin' && admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, provider, settings, allowedRoles, allowedAdmins, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await EmailService.findById(id);
    if (!service) {
      return NextResponse.json({ error: 'Email service not found' }, { status: 404 });
    }

    if (name !== undefined) service.name = name;
    if (provider !== undefined) service.provider = provider;
    if (settings !== undefined) service.settings = settings;
    if (allowedRoles !== undefined) service.allowedRoles = allowedRoles;
    if (allowedAdmins !== undefined) service.allowedAdmins = allowedAdmins;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();
    return NextResponse.json(service);
  } catch (error: any) {
    console.error('PUT Services Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const admin = await getAuthenticatedAdmin(req);

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Only super_admin can delete email services
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only super admins can delete services' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    const service = await EmailService.findById(id);
    if (!service) {
      return NextResponse.json({ error: 'Email service not found' }, { status: 404 });
    }

    // Delete service
    await EmailService.findByIdAndDelete(id);

    // Clean up tickets and messages associated with it
    const tickets = await MailRoomTicket.find({ department: service.email });
    const ticketIds = tickets.map(t => t._id);
    
    await MailRoomMessage.deleteMany({ ticketId: { $in: ticketIds } });
    await MailRoomTicket.deleteMany({ department: service.email });

    return NextResponse.json({ message: 'Email service and all related tickets deleted successfully' });
  } catch (error: any) {
    console.error('DELETE Services Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
