import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuditLogsService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(page = 1, limit = 20, action?: string, entityType?: string) {
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where: whereClause }),
    ]);

    // Convert BigInt id to string for JSON serialization
    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(),
    }));

    return {
      data: serializedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
