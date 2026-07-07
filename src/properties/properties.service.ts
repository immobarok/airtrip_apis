import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { GetPropertiesDto } from './dto/get-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService
  ) { }

  async create(createPropertyDto: CreatePropertyDto, hostId: string) {
    try {
      const status = createPropertyDto.status?.toLowerCase() === 'published' ? 'published' : 'draft';

      const listing = await this.prisma.listing.create({
        data: {
          hostId,
          title: createPropertyDto.title,
          description: createPropertyDto.description,
          propertyType: createPropertyDto.propertyType,
          roomType: createPropertyDto.roomType,
          
          addressLine1: createPropertyDto.address,
          city: createPropertyDto.city,
          stateProvince: createPropertyDto.state,
          postalCode: createPropertyDto.postal,
          country: createPropertyDto.country,
          
          maxGuests: createPropertyDto.guests ?? 1,
          bedrooms: createPropertyDto.bedrooms ?? 0,
          beds: createPropertyDto.beds ?? 1,
          bathrooms: createPropertyDto.bathrooms ?? 1,
          
          basePricePerNight: createPropertyDto.price,
          cleaningFee: createPropertyDto.cleaningFee ?? 0,
          
          amenities: createPropertyDto.amenities ?? [],
          instantBook: createPropertyDto.instantBook ?? false,
          latitude: createPropertyDto.latitude,
          longitude: createPropertyDto.longitude,
          
          status,
          publishedAt: status === 'published' ? new Date() : null,

          ...(createPropertyDto.photos && createPropertyDto.photos.length > 0 && {
            photos: {
              create: createPropertyDto.photos.map((url, index) => ({
                photoUrl: url,
                isPrimary: index === 0,
                displayOrder: index,
              })),
            },
          }),
        },
      });

      return {
        message: 'Property created successfully.',
        propertyId: listing.id,
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create property. Please verify your data.');
    }
  }

  // TODO: Add other methods like findAll, findOne, update, remove

  async getAllProperties(query: GetPropertiesDto) {
    const {
      page = 1, limit = 10, city, country,
      propertyType, roomType, minPrice, maxPrice
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country;
    if (propertyType) where.propertyType = propertyType;
    if (roomType) where.roomType = roomType;

    if (minPrice || maxPrice) {
      where.basePricePerNight = {};
      if (minPrice) where.basePricePerNight.gte = minPrice;
      if (maxPrice) where.basePricePerNight.lte = maxPrice;
    }

    // Usually we only show active/published properties to public
    where.status = 'published';

    const [total, properties] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          host: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true }
          },
          photos: {
            take: 1,
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      data: properties,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async publishProperty(listingId: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You can only publish your own properties');
    }

    // Validation: Check if property has required fields for publishing
    const errors: string[] = [];

    if (!listing.title || listing.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!listing.propertyType || listing.propertyType.trim().length === 0) {
      errors.push('Property type is required');
    }

    if (!listing.roomType || listing.roomType.trim().length === 0) {
      errors.push('Room type is required');
    }

    if (!listing.city || listing.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!listing.country || listing.country.trim().length === 0) {
      errors.push('Country is required');
    }

    if (Number(listing.basePricePerNight) <= 0) {
      errors.push('Base price must be greater than 0');
    }

    if (!listing.description || listing.description.trim().length === 0) {
      errors.push('Description is required');
    }

    if (!listing.addressLine1 || listing.addressLine1.trim().length === 0) {
      errors.push('Address line 1 is required');
    }

    if (!listing.latitude || !listing.longitude) {
      errors.push('Location (latitude/longitude) is required');
    }

    if (!listing.instantBook) {
      errors.push('Instant book setting is required');
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Cannot publish property - missing required information',
        errors,
      });
    }

    return await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  async unpublishProperty(listingId: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You can only unpublish your own properties');
    }

    if (listing.status !== 'published') {
      throw new BadRequestException('Property is already unpublished');
    }

    return await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: 'draft',
        publishedAt: null,
      },
    });
  }

  async getMyProperties(hostId: string, status?: string) {
    const where: any = { hostId };

    if (status) {
      // Validate status
      const validStatuses = ['draft', 'published', 'under_review', 'rejected', 'archived'];
      if (!validStatuses.includes(status)) {
        throw new BadRequestException('Invalid status');
      }
      where.status = status;
    }

    return await this.prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          orderBy: { displayOrder: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });
  }

  async getProperty(listingId: string, userId?: string) {
    return await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        photos: {
          orderBy: { displayOrder: 'asc' },
        },
        reviews: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateProperty(listingId: string, hostId: string, updatePropertyDto: UpdatePropertyDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You can only update your own properties');
    }

    const data: any = {};
    if (updatePropertyDto.title !== undefined) data.title = updatePropertyDto.title;
    if (updatePropertyDto.description !== undefined) data.description = updatePropertyDto.description;
    if (updatePropertyDto.propertyType !== undefined) data.propertyType = updatePropertyDto.propertyType;
    if (updatePropertyDto.roomType !== undefined) data.roomType = updatePropertyDto.roomType;
    
    if (updatePropertyDto.address !== undefined) data.addressLine1 = updatePropertyDto.address;
    if (updatePropertyDto.city !== undefined) data.city = updatePropertyDto.city;
    if (updatePropertyDto.state !== undefined) data.stateProvince = updatePropertyDto.state;
    if (updatePropertyDto.postal !== undefined) data.postalCode = updatePropertyDto.postal;
    if (updatePropertyDto.country !== undefined) data.country = updatePropertyDto.country;
    
    if (updatePropertyDto.guests !== undefined) data.maxGuests = updatePropertyDto.guests;
    if (updatePropertyDto.bedrooms !== undefined) data.bedrooms = updatePropertyDto.bedrooms;
    if (updatePropertyDto.beds !== undefined) data.beds = updatePropertyDto.beds;
    if (updatePropertyDto.bathrooms !== undefined) data.bathrooms = updatePropertyDto.bathrooms;
    
    if (updatePropertyDto.price !== undefined) data.basePricePerNight = updatePropertyDto.price;
    if (updatePropertyDto.cleaningFee !== undefined) data.cleaningFee = updatePropertyDto.cleaningFee;
    
    if (updatePropertyDto.amenities !== undefined) data.amenities = updatePropertyDto.amenities;
    if (updatePropertyDto.instantBook !== undefined) data.instantBook = updatePropertyDto.instantBook;
    if (updatePropertyDto.latitude !== undefined) data.latitude = updatePropertyDto.latitude;
    if (updatePropertyDto.longitude !== undefined) data.longitude = updatePropertyDto.longitude;

    if (updatePropertyDto.status !== undefined) {
      const status = updatePropertyDto.status.toLowerCase() === 'published' ? 'published' : 'draft';
      data.status = status;
      if (status === 'published') {
         data.publishedAt = new Date();
      } else {
         data.publishedAt = null;
      }
    }

    if (updatePropertyDto.photos !== undefined) {
      if (updatePropertyDto.photos.length > 0) {
        data.photos = {
          deleteMany: {},
          create: updatePropertyDto.photos.map((url, index) => ({
            photoUrl: url,
            isPrimary: index === 0,
            displayOrder: index,
          })),
        };
      } else {
        data.photos = { deleteMany: {} };
      }
    }

    return await this.prisma.listing.update({
      where: { id: listingId },
      data,
    });
  }

  async deleteProperty(listingId: string, hostId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You can only delete your own properties');
    }

    // This performs a hard delete. In a real app, you might want to implement soft deletes
    await this.prisma.listing.delete({
      where: { id: listingId },
    });

    return { message: 'Property deleted successfully' };
  }

  async uploadPhotos(listingId: string, hostId: string, files: Express.Multer.File[]) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.hostId !== hostId) {
      throw new ForbiddenException('You can only upload photos to your own properties');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    // Upload all files to Cloudinary in parallel
    const uploadPromises = files.map(file => this.cloudinary.uploadFile(file, 'airtrip_properties'));
    const uploadResults = await Promise.all(uploadPromises);

    // Determine the next display order
    const lastPhoto = await this.prisma.listingPhoto.findFirst({
      where: { listingId },
      orderBy: { displayOrder: 'desc' },
    });

    let currentDisplayOrder = (lastPhoto && lastPhoto.displayOrder !== null) ? lastPhoto.displayOrder + 1 : 0;
    const photosToCreate = uploadResults.map(result => {
      const order = currentDisplayOrder;
      currentDisplayOrder++;
      const thumbnailUrl = result.secure_url.replace(
        '/upload/',
        '/upload/w_600,h_400,c_fill,q_auto,f_auto/'
      );

      return {
        listingId,
        photoUrl: result.secure_url,
        thumbnailUrl: thumbnailUrl,
        isPrimary: order === 0,
        displayOrder: order,
      };
    });
    await this.prisma.listingPhoto.createMany({
      data: photosToCreate,
    });

    return {
      message: `${files.length} photos uploaded successfully`,
    };
  }

}
