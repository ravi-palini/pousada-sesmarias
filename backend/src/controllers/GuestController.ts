import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';

const createGuestSchema = z.object({
  name: z
    .string()
    .min(1, 'O nome completo do hóspede é obrigatório.')
    .trim(),
  document: z
    .string()
    .min(3, 'O documento de identificação (CPF, RG ou Passaporte) é obrigatório.')
    .trim(),
  phone: z.string().trim().optional().nullable(),
  email: z
    .string()
    .trim()
    .email('Formato de e-mail inválido.')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  notes: z.string().trim().optional().nullable(),
});

const updateGuestSchema = createGuestSchema.partial();

export class GuestController {
  /**
   * Listar hóspedes (com suporte a busca textual por nome ou documento)
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search } = req.query;

      const whereClause: any = {};
      if (search && typeof search === 'string' && search.trim() !== '') {
        const query = search.trim();
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { document: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ];
      }

      const guests = await prisma.guest.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { reservations: true } },
        },
      });

      res.status(200).json({
        status: 'success',
        results: guests.length,
        guests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar hóspede por ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do hóspede não fornecido.', 400);
      }

      const guest = await prisma.guest.findUnique({
        where: { id },
        include: {
          reservations: {
            orderBy: { check_in: 'desc' },
            include: { room: true },
          },
        },
      });

      if (!guest) {
        throw new AppError('Hóspede não encontrado.', 404);
      }

      res.status(200).json({
        status: 'success',
        guest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cadastrar novo hóspede
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createGuestSchema.parse(req.body);

      const existingGuest = await prisma.guest.findUnique({
        where: { document: data.document },
      });

      if (existingGuest) {
        throw new AppError(`Já existe um hóspede cadastrado com o documento "${data.document}".`, 409);
      }

      const guest = await prisma.guest.create({
        data: {
          name: data.name,
          document: data.document,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
        },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'GUEST_CREATE',
          resource: 'Guest',
          details: { guestId: guest.id, name: guest.name },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Hóspede cadastrado com sucesso.',
        guest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualizar dados do hóspede
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do hóspede não fornecido.', 400);
      }

      const data = updateGuestSchema.parse(req.body);

      const existingGuest = await prisma.guest.findUnique({
        where: { id },
      });

      if (!existingGuest) {
        throw new AppError('Hóspede não encontrado.', 404);
      }

      if (data.document && data.document !== existingGuest.document) {
        const documentInUse = await prisma.guest.findUnique({
          where: { document: data.document },
        });
        if (documentInUse) {
          throw new AppError(`Já existe outro hóspede cadastrado com o documento "${data.document}".`, 409);
        }
      }

      const updatedGuest = await prisma.guest.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.document !== undefined && { document: data.document }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'GUEST_UPDATE',
          resource: 'Guest',
          details: { guestId: updatedGuest.id, changes: data },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Cadastro de hóspede atualizado com sucesso.',
        guest: updatedGuest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar hóspede (Apenas ADMIN e MANAGER)
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID do hóspede não fornecido.', 400);
      }

      const existingGuest = await prisma.guest.findUnique({
        where: { id },
        include: {
          reservations: {
            select: { id: true },
            take: 1,
          },
        },
      });

      if (!existingGuest) {
        throw new AppError('Hóspede não encontrado.', 404);
      }

      if (existingGuest.reservations.length > 0) {
        throw new AppError('Não é possível excluir um hóspede com reservas vinculadas no histórico.', 400);
      }

      await prisma.guest.delete({
        where: { id },
      });

      // Registro de auditoria
      await prisma.auditLog.create({
        data: {
          action: 'GUEST_DELETE',
          resource: 'Guest',
          details: { guestId: id, name: existingGuest.name, document: existingGuest.document },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Hóspede removido com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }
}

