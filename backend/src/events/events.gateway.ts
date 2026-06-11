import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(client: Socket, projectId: string) {
    client.join(`project_${projectId}`);
    this.logger.log(`Client ${client.id} joined project_${projectId}`);
    return { event: 'joinedProject', data: projectId };
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(client: Socket, projectId: string) {
    client.leave(`project_${projectId}`);
    return { event: 'leftProject', data: projectId };
  }

  // Helper method to emit events to a project room
  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project_${projectId}`).emit(event, data);
  }
}
