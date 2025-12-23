import { Server as HTTPServer } from 'http';
import { Socket as ServerSocket, Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Connection handler
  io.on('connection', (socket: ServerSocket) => {
    console.log(`[Socket.IO] ✅ User connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join-user', (email: string) => {
      socket.join(`user:${email}`);
      console.log(`[Socket.IO] 👤 User ${email} joined room: user:${email}`);
    });

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log(`[Socket.IO] 👨‍💼 Admin joined room: admin`);
    });

    // Handle message sent
    socket.on('message-sent', (data) => {
      console.log(`[Socket.IO] 💬 Message sent:`, data);
      // Broadcast to both user and admin
      if (data.userEmail) {
        io?.to(`user:${data.userEmail}`).emit('new-message', data);
      }
      if (data.adminEmail) {
        io?.to(`user:${data.adminEmail}`).emit('new-message', data);
      }
      io?.to('admin').emit('new-message', data);
    });

    // Handle order created
    socket.on('order-created', (data) => {
      console.log(`[Socket.IO] 📦 Order created:`, data);
      // Notify admins
      io?.to('admin').emit('new-order', data);
      // Notify user
      if (data.userEmail) {
        io?.to(`user:${data.userEmail}`).emit('new-order', data);
      }
    });

    // Handle custom order created
    socket.on('custom-order-created', (data) => {
      console.log(`[Socket.IO] 🎨 Custom order created:`, data);
      io?.to('admin').emit('new-custom-order', data);
      if (data.email) {
        io?.to(`user:${data.email}`).emit('new-custom-order', data);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] ❌ User disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocket(): SocketIOServer | null {
  return io;
}

export function emitToAdmin(event: string, data: any) {
  if (io) {
    io.to('admin').emit(event, data);
  }
}

export function emitToUser(email: string, event: string, data: any) {
  if (io) {
    io.to(`user:${email}`).emit(event, data);
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
