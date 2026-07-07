import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, Min, IsBoolean } from 'class-validator';

export class CreatePropertyDto {
  // Basic Info
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Location
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postal: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  // Property Details
  @IsString()
  @IsNotEmpty()
  propertyType: string;

  @IsString()
  @IsNotEmpty()
  roomType: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  guests?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  beds?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  // Pricing
  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cleaningFee?: number;

  // Photos
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  // Status
  @IsString()
  @IsOptional()
  status?: string;

  // Extra fields that were in the original DTO (optional)
  @IsBoolean()
  @IsOptional()
  instantBook?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}
