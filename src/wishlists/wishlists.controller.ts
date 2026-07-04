import { Controller, Post, Body, Get, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  create(@Body() dto: CreateWishlistDto, @CurrentUser('id') userId: string) {
    return this.wishlistsService.createWishlist(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.wishlistsService.getUserWishlists(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.wishlistsService.getWishlistById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWishlistDto,
    @CurrentUser('id') userId: string
  ) {
    return this.wishlistsService.updateWishlist(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.wishlistsService.deleteWishlist(id, userId);
  }

  @Post(':id/items')
  addItem(
    @Param('id') wishlistId: string,
    @Body() dto: AddWishlistItemDto,
    @CurrentUser('id') userId: string
  ) {
    return this.wishlistsService.addListingToWishlist(wishlistId, dto.listingId, userId);
  }

  @Delete(':id/items/:listingId')
  removeItem(
    @Param('id') wishlistId: string,
    @Param('listingId') listingId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.wishlistsService.removeListingFromWishlist(wishlistId, listingId, userId);
  }
}
