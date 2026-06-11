import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MailRoomTicket from '@/lib/models/MailRoomTicket';
import MailRoomMessage from '@/lib/models/MailRoomMessage';

// Debug endpoint to check webhook & email receiving status
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const ticketsCount = await MailRoomTicket.countDocuments();
    const messagesCount = await MailRoomMessage.countDocuments();
    const recentTickets = await MailRoomTicket.find()
      .sort({ lastMessageAt: -1 })
      .limit(5)
      .lean();
    
    const recentMessages = await MailRoomMessage.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      ticketsCount,
      messagesCount,
      recentTickets: recentTickets.map(t => ({
        ticketNumber: t.ticketNumber,
        customerEmail: t.customerEmail,
        department: t.department,
        status: t.status,
        lastMessageAt: t.lastMessageAt,
      })),
      recentMessages: recentMessages.map(m => ({
        direction: m.direction,
        from: m.senderEmail,
        to: m.recipientEmail,
        createdAt: m.createdAt,
      })),
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET ? '✅ Configured' : '❌ Missing',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    }, { status: 500 });
  }
}
