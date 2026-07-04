import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) {}

  async createWishlist(userId: string, dto: CreateWishlistDto) {
    return this.prisma.wishlist.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        isPrivate: dto.isPrivate ?? false,
      }
    });
  }

  async getUserWishlists(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getWishlistById(id: string, userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            listing: true
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    if (!wishlist) throw new NotFoundException('Wishlist not found');
    
    // Check ownership or if public
    if (wishlist.userId !== userId && wishlist.isPrivate) {
      throw new ForbiddenException('You do not have access to this wishlist');
    }

    return wishlist;
  }

  async updateWishlist(id: string, userId: string, dto: UpdateWishlistDto) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    return this.prisma.wishlist.update({
      where: { id },
      data: dto
    });
  }

  async deleteWishlist(id: string, userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    await this.prisma.wishlist.delete({ where: { id } });
    return { message: 'Wishlist deleted successfully' };
  }

  async addListingToWishlist(wishlistId: string, listingId: string, userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const existingItem = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_listingId: { wishlistId, listingId } }
    });

    if (existingItem) throw new BadRequestException('Listing already in wishlist');

    return this.prisma.wishlistItem.create({
      data: { wishlistId, listingId }
    });
  }

  async removeListingFromWishlist(wishlistId: string, listingId: string, userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { id: wishlistId } });
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    if (wishlist.userId !== userId) throw new ForbiddenException('Not your wishlist');

    const item = await this.prisma.wishlistItem.findUnique({
      where: { wishlistId_listingId: { wishlistId, listingId } }
    });

    if (!item) throw new NotFoundException('Listing is not in this wishlist');

    await this.prisma.wishlistItem.delete({
      where: { wishlistId_listingId: { wishlistId, listingId } }
    });

    return { message: 'Listing removed from wishlist' };
  }
}
