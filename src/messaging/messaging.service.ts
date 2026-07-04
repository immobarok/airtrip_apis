import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) { }

  async createConversation(userId: string, dto: CreateConversationDto) {
    if (userId === dto.participantId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1: userId, participant2: dto.participantId },
          { participant1: dto.participantId, participant2: userId },
        ],
        ...(dto.bookingId ? { bookingId: dto.bookingId } : {})
      }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        participant1: userId,
        participant2: dto.participantId,
        bookingId: dto.bookingId,
        subject: dto.subject,
        isBookingRelated: !!dto.bookingId,
      }
    });
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { participant1: userId },
          { participant2: userId }
        ],
        isActive: true
      },
      include: {
        user1: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        user2: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        booking: { select: { id: true, listing: { select: { id: true, title: true } } } }
      },
      orderBy: { lastMessageAt: 'desc' }
    });
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });
  }

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } }
      }
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 50)
      }
    });

    return message;
  }
}
