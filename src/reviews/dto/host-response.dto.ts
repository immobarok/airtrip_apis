import { IsString, IsNotEmpty } from 'class-validator';

export class HostResponseDto {
  @IsString()
  @IsNotEmpty()
  response: string;
}
