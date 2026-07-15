import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserStatusDto } from '../dto/admin.dto';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(page = 1, limit = 10, role?: string, isActive?: boolean) {
    const skip = (page - 1) * limit;
    
    let whereClause: any = {};
    if (role === 'host') whereClause.isHost = true;
    if (role === 'customer') whereClause.isCustomer = true;
    if (isActive !== undefined) whereClause.isActive = isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isCustomer: true,
          isHost: true,
          isAdmin: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              listings: true,
              bookingsAsGuest: true,
              bookingsAsHost: true,
            }
          }
        },
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        hostProfile: true,
        customerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUserStatus(id: string, updateDto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: updateDto.isActive,
      },
    });

    // Optionally: Log the reason to AuditLogs if you have it implemented
    if (updateDto.reason) {
      // this.prisma.auditLog.create(...)
    }

    return user;
  }

  async verifyHost(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { hostProfile: true },
    });

    if (!user || !user.hostProfile) {
      throw new NotFoundException(`Host profile for user ${id} not found`);
    }

    return this.prisma.hostProfile.update({
      where: { userId: id },
      data: {
        isIdentityVerified: true,
        idVerifiedAt: new Date(),
      },
    });
  }
}
