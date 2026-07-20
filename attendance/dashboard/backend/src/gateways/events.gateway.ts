import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection {
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
      jwt.verify(token as string, process.env.JWT_SECRET || '');
    } catch {
      client.emit('error', 'Invalid token');
      client.disconnect();
    }
  }

  emitAnomalieCreee(anomalie: any) {
    this.server.emit('anomalie:creee', anomalie);
  }

  emitDemandeCreee(demande: any) {
    this.server.emit('demande:creee', demande);
  }

  emitNotification(notification: { type: string; message: string; count?: number }) {
    this.server.emit('notification', notification);
  }
}
