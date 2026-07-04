import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}
