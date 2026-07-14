import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPropertiesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // ─── Property Type ───────────────────────────────────────────────────────────
  /** Comma-separated list of property types, e.g. "apartment,house" */
  @IsOptional()
  @IsString()
  propertyType?: string;

  /** Comma-separated list of room types, e.g. "entire_place,private_room" */
  @IsOptional()
  @IsString()
  roomType?: string;

  // ─── Price ───────────────────────────────────────────────────────────────────
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  // ─── Rooms & Beds ─────────────────────────────────────────────────────────────
  /** Minimum number of bedrooms */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBedrooms?: number;

  /** Minimum number of beds */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBeds?: number;

  /** Minimum number of bathrooms */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minBathrooms?: number;

  /** Minimum number of guests the property can accommodate */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  minGuests?: number;

  // ─── Amenities ───────────────────────────────────────────────────────────────
  /** Comma-separated list of required amenities, e.g. "WiFi,Pool,Kitchen" */
  @IsOptional()
  @IsString()
  amenities?: string;

  // ─── Sort ────────────────────────────────────────────────────────────────────
  @IsOptional()
  @IsString()
  sortBy?: string;
}
