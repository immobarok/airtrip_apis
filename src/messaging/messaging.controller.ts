import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@Controller('messaging')
@UseGuards(JwtAuthGuard)
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('conversations')
  createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.messagingService.createConversation(req.user.id, dto);
  }

  @Get('conversations')
  getUserConversations(@Req() req: any) {
    return this.messagingService.getUserConversations(req.user.id);
  }

  @Get('conversations/:id/messages')
  getConversationMessages(@Req() req: any, @Param('id') conversationId: string) {
    return this.messagingService.getConversationMessages(req.user.id, conversationId);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Req() req: any,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.messagingService.sendMessage(req.user.id, conversationId, content);
  }
}
