import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { SendMessageDto } from './dto/send-message.dto';
import * as jwt from 'jsonwebtoken';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('MessagingGateway');
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(private readonly messagingService: MessagingService) {}

  async handleConnection(client: Socket) {
    try {
      let token = client.handshake.auth.token;
      if (!token && client.handshake.headers['authorization']) {
        token = client.handshake.headers['authorization'].split(' ')[1];
      }
      
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { sub: string };
      const userId = decoded.sub;

      client.data.userId = userId;
      this.userSockets.set(userId, client.id);
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(data.conversationId);
    this.logger.log(`Client ${client.id} joined conversation ${data.conversationId}`);
    return { event: 'joined', data: data.conversationId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() dto: SendMessageDto) {
    const userId = client.data.userId;
    if (!userId) {
      return { status: 'error', message: 'Unauthorized' };
    }

    try {
      const message = await this.messagingService.sendMessage(userId, dto.conversationId, dto.content);
      
      // Broadcast to all users in the conversation room
      this.server.to(dto.conversationId).emit('newMessage', message);
      
      return { status: 'success', data: message };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
