import { IsNotEmpty, IsUUID, IsDateString, IsInt, Min, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  @IsNotEmpty()
  listingId: string;

  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  numberOfGuests: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  guestNames?: string[];

  @IsString()
  @IsOptional()
  specialRequests?: string;
}
