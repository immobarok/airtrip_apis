import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  overallRating: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  cleanliness?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  accuracy?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  checkIn?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  communication?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  locationRating?: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
