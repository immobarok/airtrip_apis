import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  participantId: string;

  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}
