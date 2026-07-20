import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    if (!token) {
      client.emit('error', 'Authentication required');
      client.disconnect();
      return;
    }
    try {
      const payload: any = jwt.verify(token as string, process.env.JWT_SECRET || '');
      (client.data as any).userId = payload.sub;
      client.on('join', (room: string) => {
        if (room && room === payload.sub) client.join(room);
      });
    } catch {
      client.emit('error', 'Invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client.data as any)?.userId;
    if (userId) client.leave(userId);
  }

  emitAnomalieCreee(anomalie: any) {
    this.server.emit('anomalie:creee', anomalie);
  }

  emitDemandeCreee(demande: any) {
    this.server.emit('demande:creee', demande);
  }

  emitDemandeTraitee(demande: any, userId: string) {
    this.server.to(userId).emit('demande:traitee', demande);
  }

  emitNotification(notification: { type: string; message: string; count?: number }, userId?: string) {
    if (userId) {
      this.server.to(userId).emit('notification', notification);
    } else {
      this.server.emit('notification', notification);
    }
  }
}
