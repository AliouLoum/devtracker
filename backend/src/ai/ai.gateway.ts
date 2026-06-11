import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { AiService } from './ai.service';
import { aiConfig } from './ai.config';

@WebSocketGateway({
  namespace: 'ai',
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AiGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query?.token as string | undefined);
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        token,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );
      client.data.userId = payload.sub;
      this.logger.log(`AI Gateway: Client connected: ${client.id} user=${payload.sub}`);
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`AI Gateway: Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('breakdown')
  async handleBreakdown(client: Socket, data: { text: string }) {
    const userId = client.data.userId as string;
    if (!userId) return;

    this.logger.log(`AI Gateway [breakdown] requested by user=${userId}`);
    const systemPrompt = `Tu es un assistant de gestion de projet expert. 
Quand l'utilisateur décrit une tâche, tu la décomposes en sous-tâches 
concrètes et actionnables. Réponds UNIQUEMENT en JSON valide avec ce format :
{ "tasks": [{ "title": "", "notes": "", "estimatedHours": 0, "priority": "high|medium|low", "suggestedDaysFromNow": 0 }] }`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: data.text },
    ];

    try {
      const fullText = await this.aiService.generateCompletionStream(
        aiConfig.defaultModel,
        messages,
        0.5,
        (token) => {
          client.emit('breakdown-token', { token });
        },
      );
      client.emit('breakdown-done', { fullText });
    } catch (error: any) {
      client.emit('breakdown-error', { error: error.message });
    }
  }

  @SubscribeMessage('chat')
  async handleChat(client: Socket, data: { message: string; history?: any[] }) {
    const userId = client.data.userId as string;
    if (!userId) return;

    this.logger.log(`AI Gateway [chat] requested by user=${userId}`);
    const systemContext = await this.aiService.buildSystemContext(userId);

    const messages = [
      { role: 'system', content: systemContext },
      ...(data.history || []).map((msg) => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.content,
      })),
      { role: 'user', content: data.message },
    ];

    try {
      const fullText = await this.aiService.generateCompletionStream(
        aiConfig.defaultModel,
        messages,
        0.7,
        (token) => {
          client.emit('chat-token', { token });
        },
      );
      client.emit('chat-done', { fullText });
    } catch (error: any) {
      client.emit('chat-error', { error: error.message });
    }
  }
}
