import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateListingStatusDto } from '../dto/admin.dto';

@Injectable()
export class AdminListingsService {
  constructor(private prisma: PrismaService) {}

  async getListings(page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          host: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.listing.count({ where: whereClause }),
    ]);

    return {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getListingById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        photos: true,
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async updateListingStatus(id: string, updateDto: UpdateListingStatusDto) {
    const listing = await this.prisma.listing.update({
      where: { id },
      data: {
        status: updateDto.status,
      },
    });

    if (updateDto.rejectionReason) {
      // Logic to send notification or save reason
    }

    return listing;
  }

  async deleteListingPhoto(listingId: string, photoId: string) {
    const photo = await this.prisma.listingPhoto.findFirst({
      where: { id: photoId, listingId },
    });

    if (!photo) {
      throw new NotFoundException(`Photo not found for listing ${listingId}`);
    }

    await this.prisma.listingPhoto.delete({
      where: { id: photoId },
    });

    return { message: 'Photo deleted successfully' };
  }
}
