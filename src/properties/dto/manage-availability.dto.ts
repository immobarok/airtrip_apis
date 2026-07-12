import { IsArray, IsDateString, IsNotEmpty } from 'class-validator';

export class ManageAvailabilityDto {
  @IsArray()
  @IsNotEmpty()
  @IsDateString({}, { each: true })
  dates: string[];
}
