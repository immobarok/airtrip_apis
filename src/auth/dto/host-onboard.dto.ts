import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  IsStrongPassword,
} from 'class-validator';

export class HostOnboardDto {
  // --- Personal Info ---
  @IsEmail()
  @IsOptional() // Might be optional if logged in
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsString()
  @IsOptional()
  password?: string;

  // --- Property Data ---
  @IsString()
  @IsNotEmpty()
  propertyType: string;

  @IsString()
  @IsNotEmpty()
  roomType: string;

  // --- Location Data ---
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @IsString()
  @IsOptional()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  stateProvince?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

  // --- Rooms & Guests ---
  @IsNumber()
  @Min(1)
  maxGuests: number;

  @IsNumber()
  @Min(0)
  bedrooms: number;

  @IsNumber()
  @Min(1)
  beds: number;

  @IsNumber()
  @Min(0)
  bathrooms: number;

  @IsArray()
  @IsString({ each: true })
  amenities: string[];

  @IsArray()
  @IsString({ each: true })
  photos: string[];

  // --- Property Details ---
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  houseRules?: string;

  // --- Pricing & Booking ---
  @IsNumber()
  @Min(0)
  basePricePerNight: number;

  @IsNumber()
  @Min(0)
  cleaningFee: number;

  @IsNumber()
  @Min(0)
  serviceFeePercent: number;

  @IsNumber()
  @Min(1)
  minNights: number;

  @IsNumber()
  @Min(1)
  maxNights: number;

  @IsString()
  @IsOptional()
  checkInTime?: string;

  @IsString()
  @IsOptional()
  checkOutTime?: string;

  @IsBoolean()
  @IsOptional()
  instantBook?: boolean;
}
