import { IsBoolean, IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class UpdateListingStatusDto {
  @IsString()
  status: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class AdminCancelBookingDto {
  @IsString()
  reason: string;

  @IsNumber()
  @IsOptional()
  refundPercentage?: number;
}

export class UpdateSystemSettingDto {
  @IsString()
  settingValue: string;
}

export class ModerateReviewDto {
  @IsBoolean()
  isPublic: boolean;
}
