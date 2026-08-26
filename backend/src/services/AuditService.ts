import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuditService {
  static async logAction(userId: string, action: string, details?: string, ip?: string) {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: userId,
          action,
          details,
          ip,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }
}