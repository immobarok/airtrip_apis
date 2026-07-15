import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminVerificationsService {
  constructor(private prisma: PrismaService) {}

  async getVerifications(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.verificationDocument.findMany({
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.verificationDocument.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyDocument(id: string, isApproved: boolean) {
    return this.prisma.verificationDocument.update({
      where: { id },
      data: { status: isApproved ? 'APPROVED' : 'REJECTED' },
    });
  }
}
