import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { RoomStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

const roomStatusEnum = z.enum(['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED']);

const createRoomSchema = z.object({
  number: z
    .string()
    .min(1, 'O número ou identificação do quarto é obrigatório.')
    .trim(),
  name: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  capacity: z.coerce
    .number()
    .int('A capacidade deve ser um número inteiro.')
    .min(1, 'A capacidade mínima é de 1 hóspede.')
    .default(2),
  daily_rate: z.coerce
    .number()
    .positive('O valor da diária deve ser maior que zero.'),
  status: roomStatusEnum.default('AVAILABLE'),
  description: z.string().trim().optional().nullable(),
});

const updateRoomSchema = createRoomSchema.partial();

const updateRoomStatusSchema = z.object({
  status: roomStatusEnum,
});

export class RoomController {
  /**
   * Listar todos os quartos cadastrados
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;

      const whereClause: any = {};
      if (status && typeof status === 'string' && Object.values(RoomStatus).includes(status as RoomStatus)) {
        whereClause.status = status as RoomStatus;
      }

      const rooms = await prisma.room.findMany({
        where: whereClause,
        orderBy: { number: 'asc' },
      });

      res.status(200).json({
        status: 'success',
        results: rooms.length,
        rooms,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar quarto por ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do quarto não fornecido.', 400);
      }

      const room = await prisma.room.findUnique({
        where: { id },
        include: {
          reservations: {
            take: 5,
            orderBy: { check_in: 'desc' },
          },
        },
      });

      if (!room) {
        throw new AppError('Quarto não encontrado.', 404);
      }

      res.status(200).json({
        status: 'success',
        room,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar novo quarto (Apenas ADMIN e MANAGER)
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createRoomSchema.parse(req.body);

      const existingRoom = await prisma.room.findUnique({
        where: { number: data.number },
      });

      if (existingRoom) {
        throw new AppError(`Já existe um quarto cadastrado com o número "${data.number}".`, 409);
      }

      const room = await prisma.room.create({
        data: {
          number: data.number,
          name: data.name || null,
          category: data.category || 'Standard',
          capacity: data.capacity,
          daily_rate: data.daily_rate,
          status: data.status,
          description: data.description || null,
        },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'ROOM_CREATE',
          resource: 'Room',
          details: { roomId: room.id, number: room.number },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Quarto cadastrado com sucesso.',
        room,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar dados do quarto (Apenas ADMIN e MANAGER)
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do quarto não fornecido.', 400);
      }

      const data = updateRoomSchema.parse(req.body);

      const existingRoom = await prisma.room.findUnique({
        where: { id },
      });

      if (!existingRoom) {
        throw new AppError('Quarto não encontrado.', 404);
      }

      if (data.number && data.number !== existingRoom.number) {
        const numberInUse = await prisma.room.findUnique({
          where: { number: data.number },
        });
        if (numberInUse) {
          throw new AppError(`Já existe outro quarto com o número "${data.number}".`, 409);
        }
      }

      const updatedRoom = await prisma.room.update({
        where: { id },
        data: {
          ...(data.number !== undefined && { number: data.number }),
          ...(data.name !== undefined && { name: data.name }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.capacity !== undefined && { capacity: data.capacity }),
          ...(data.daily_rate !== undefined && { daily_rate: data.daily_rate }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'ROOM_UPDATE',
          resource: 'Room',
          details: { roomId: updatedRoom.id, changes: data },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Quarto atualizado com sucesso.',
        room: updatedRoom,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar status do quarto (ADMIN, MANAGER e RECEPTION)
   */
  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do quarto não fornecido.', 400);
      }

      const { status } = updateRoomStatusSchema.parse(req.body);

      const existingRoom = await prisma.room.findUnique({
        where: { id },
      });

      if (!existingRoom) {
        throw new AppError('Quarto não encontrado.', 404);
      }

      const updatedRoom = await prisma.room.update({
        where: { id },
        data: { status },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'ROOM_STATUS_CHANGE',
          resource: 'Room',
          details: { roomId: updatedRoom.id, oldStatus: existingRoom.status, newStatus: status },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: `Status do quarto alterado para ${status}.`,
        room: updatedRoom,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar quarto (Apenas ADMIN e MANAGER)
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do quarto não fornecido.', 400);
      }

      const existingRoom = await prisma.room.findUnique({
        where: { id },
        include: {
          reservations: {
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!existingRoom) {
        throw new AppError('Quarto não encontrado.', 404);
      }

      if (existingRoom.reservations.length > 0) {
        throw new AppError('Não é possível excluir um quarto que possui histórico de reservas vinculadas.', 400);
      }

      await prisma.room.delete({
        where: { id },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'ROOM_DELETE',
          resource: 'Room',
          details: { roomId: id, number: existingRoom.number },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Quarto removido com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }
}

