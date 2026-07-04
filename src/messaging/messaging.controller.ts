import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { CreateConversationDto } from './dto/create-conversation.dto';


@Controller('messaging')
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
}
