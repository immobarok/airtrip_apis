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
      
      // Get conversation participants to emit directly to their sockets
      const prisma = (this.messagingService as any).prisma;
      const conv = await prisma.conversation.findUnique({ where: { id: dto.conversationId }});
      
      if (conv) {
        const p1Socket = this.userSockets.get(conv.participant1);
        const p2Socket = this.userSockets.get(conv.participant2);

        if (p1Socket) this.server.to(p1Socket).emit('newMessage', message);
        if (p2Socket) this.server.to(p2Socket).emit('newMessage', message);
      }
      
      return { status: 'success', data: message };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
  @SubscribeMessage('typing')
  async handleTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string, isTyping: boolean }) {
    const userId = client.data.userId;
    if (!userId) return;

    try {
      const prisma = (this.messagingService as any).prisma;
      const conv = await prisma.conversation.findUnique({ where: { id: data.conversationId }});
      
      if (conv) {
        const receiverId = userId === conv.participant1 ? conv.participant2 : conv.participant1;
        const receiverSocketId = this.userSockets.get(receiverId);

        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('typing', {
            conversationId: data.conversationId,
            userId,
            isTyping: data.isTyping
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error handling typing event: ${error.message}`);
    }
  }

  @SubscribeMessage('callUser')
  async handleCallUser(@ConnectedSocket() client: Socket, @MessageBody() data: { userToCall: string, signalData: any, from: string, conversationId: string }) {
    const receiverSocketId = this.userSockets.get(data.userToCall);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('incomingCall', {
        signal: data.signalData,
        from: data.from,
        conversationId: data.conversationId
      });
    }
  }

  @SubscribeMessage('answerCall')
  async handleAnswerCall(@ConnectedSocket() client: Socket, @MessageBody() data: { to: string, signal: any }) {
    const callerSocketId = this.userSockets.get(data.to);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('callAccepted', data.signal);
    }
  }

  @SubscribeMessage('iceCandidate')
  async handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { to: string, candidate: any }) {
    const receiverSocketId = this.userSockets.get(data.to);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('iceCandidate', data.candidate);
    }
  }

  @SubscribeMessage('endCall')
  async handleEndCall(@ConnectedSocket() client: Socket, @MessageBody() data: { to: string, conversationId?: string, durationSeconds?: number, isMissed?: boolean }) {
    const receiverSocketId = this.userSockets.get(data.to);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('callEnded');
    }

    // Auto-generate a chat message for the call log
    if (data.conversationId) {
      try {
        let content = '';
        if (data.isMissed) {
          content = "📞 Missed Audio Call";
        } else {
          const mins = Math.floor((data.durationSeconds || 0) / 60);
          const secs = (data.durationSeconds || 0) % 60;
          const durationStr = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
          content = `📞 Audio Call Ended (Duration: ${durationStr})`;
        }
        
        const message = await this.messagingService.sendMessage(client.data.userId, data.conversationId, content);
        
        if (receiverSocketId) this.server.to(receiverSocketId).emit('newMessage', message);
        this.server.to(client.id).emit('newMessage', message);
      } catch (e) {
        this.logger.error("Failed to save call log message: " + e.message);
      }
    }
  }
}
