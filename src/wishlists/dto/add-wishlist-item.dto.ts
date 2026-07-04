import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddWishlistItemDto {
  @IsUUID()
  @IsNotEmpty()
  listingId: string;
}
