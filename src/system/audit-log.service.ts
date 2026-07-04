import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetLogsDto } from './dto/get-logs.dto';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async getLogs(query: GetLogsDto) {
    const { page = 1, limit = 20, entityType, action, actorId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    // Format BigInt to string for JSON serialization
    const formattedLogs = logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));

    return {
      data: formattedLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async logAction(data: {
    actorId?: string;
    actorRole?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    changeSummary?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        actorRole: data.actorRole,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues ? data.oldValues : undefined,
        newValues: data.newValues ? data.newValues : undefined,
        changeSummary: data.changeSummary,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
