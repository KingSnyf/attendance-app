import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'], credentials: true },
  namespace: '/events',
})
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

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
