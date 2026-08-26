import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { ReservationStatus, RoomStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

const reservationStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED']);

const createReservationSchema = z.object({
  guest_id: z.string().optional().nullable(),
  guest_name: z.string().trim().optional().nullable(),
  guest_document: z.string().trim().optional().nullable(),
  guest_phone: z.string().trim().optional().nullable(),
  guest_email: z
    .string()
    .trim()
    .email('Formato de e-mail inválido.')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  room_id: z.string().min(1, 'Selecione a acomodação/quarto desejado.'),
  check_in: z.coerce.date(),
  check_out: z.coerce.date(),
  number_of_guests: z.coerce.number().int().min(1).default(1),
  total_price: z.coerce.number().positive('O valor total da reserva deve ser maior que zero.'),
  status: reservationStatusEnum.default('CONFIRMED'),
  notes: z.string().trim().optional().nullable(),
});

export class ReservationController {
  /**
   * Listar todas as reservas (com filtros por status ou quarto)
   */
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, room_id } = req.query;

      const whereClause: any = {};
      if (status && typeof status === 'string' && Object.values(ReservationStatus).includes(status as ReservationStatus)) {
        whereClause.status = status as ReservationStatus;
      }
      if (room_id && typeof room_id === 'string') {
        whereClause.room_id = room_id;
      }

      const reservations = await prisma.reservation.findMany({
        where: whereClause,
        orderBy: { check_in: 'desc' },
        include: {
          room: true,
          guest: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      res.status(200).json({
        status: 'success',
        results: reservations.length,
        reservations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar reserva por ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID da reserva não fornecido.', 400);
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: {
          room: true,
          guest: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      res.status(200).json({
        status: 'success',
        reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Criar Reserva com REGRA DE NEGÓCIO ANTI-OVERBOOKING
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createReservationSchema.parse(req.body);

      const checkInDate = new Date(data.check_in);
      const checkOutDate = new Date(data.check_out);

      if (checkOutDate <= checkInDate) {
        throw new AppError('A data de check-out deve ser posterior à data de check-in.', 400);
      }

      // 1. Verifica se o quarto existe
      const room = await prisma.room.findUnique({
        where: { id: data.room_id },
      });

      if (!room) {
        throw new AppError('Quarto não encontrado.', 404);
      }

      // 2. REGRA DE NEGÓCIO CRÍTICA: Bloqueio de Overbooking
      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          room_id: data.room_id,
          status: { not: ReservationStatus.CANCELLED },
          AND: [
            { check_in: { lt: checkOutDate } },
            { check_out: { gt: checkInDate } },
          ],
        },
        include: { room: true, guest: true },
      });

      if (conflictingReservation) {
        const confIn = new Date(conflictingReservation.check_in).toLocaleDateString('pt-BR');
        const confOut = new Date(conflictingReservation.check_out).toLocaleDateString('pt-BR');
        throw new AppError(
          `Overbooking bloqueado: O quarto "${room.number}" já possui uma reserva ativa de ${confIn} a ${confOut} (Hóspede: ${conflictingReservation.guest.name}).`,
          400
        );
      }

      // 3. Obtenção do Hóspede (ID direto ou criação/busca via documento)
      let guestId = data.guest_id;

      if (!guestId) {
        if (!data.guest_name) {
          throw new AppError('Informe o hóspede da reserva ou preencha o nome para cadastro.', 400);
        }

        if (data.guest_document) {
          const existingGuest = await prisma.guest.findUnique({
            where: { document: data.guest_document },
          });

          if (existingGuest) {
            guestId = existingGuest.id;
          } else {
            const newGuest = await prisma.guest.create({
              data: {
                name: data.guest_name,
                document: data.guest_document,
                phone: data.guest_phone || null,
                email: data.guest_email || null,
              },
            });
            guestId = newGuest.id;
          }
        } else {
          // Documento temporário/placeholder baseado em timestamp se não fornecido
          const tempDoc = `TEMP-${Date.now()}`;
          const newGuest = await prisma.guest.create({
            data: {
              name: data.guest_name,
              document: tempDoc,
              phone: data.guest_phone || null,
              email: data.guest_email || null,
            },
          });
          guestId = newGuest.id;
        }
      } else {
        const existingGuest = await prisma.guest.findUnique({
          where: { id: guestId },
        });
        if (!existingGuest) {
          throw new AppError('Hóspede selecionado não encontrado.', 404);
        }
      }

      // 4. Criação da Reserva vinculada a guest_id e room_id
      const reservation = await prisma.reservation.create({
        data: {
          check_in: checkInDate,
          check_out: checkOutDate,
          number_of_guests: data.number_of_guests,
          total_price: data.total_price,
          status: data.status || ReservationStatus.CONFIRMED,
          notes: data.notes || null,
          guest_id: guestId,
          room_id: data.room_id,
          user_id: req.user?.id || null,
        },
        include: {
          room: true,
          guest: true,
        },
      });

      // Registro de Auditoria
      await prisma.auditLog.create({
        data: {
          action: 'RESERVATION_CREATE',
          resource: 'Reservation',
          details: {
            reservationId: reservation.id,
            roomNumber: room.number,
            guestName: reservation.guest.name,
            checkIn: reservation.check_in,
            checkOut: reservation.check_out,
          },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Reserva criada com sucesso.',
        reservation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realizar Check-in (Muda Reserva para CHECKED_IN e Quarto para OCCUPIED via Transação)
   */
  public static async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID da reserva não fornecido.', 400);
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { room: true, guest: true },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new AppError('Não é possível realizar check-in de uma reserva cancelada.', 400);
      }

      if (reservation.status === ReservationStatus.CHECKED_OUT) {
        throw new AppError('Esta reserva já foi finalizada (Check-out concluído).', 400);
      }

      if (reservation.status === ReservationStatus.CHECKED_IN) {
        throw new AppError('O check-in desta reserva já foi realizado anteriormente.', 400);
      }

      // Transação Atômica do Prisma
      const result = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.CHECKED_IN },
          include: { room: true, guest: true },
        });

        const updatedRoom = await tx.room.update({
          where: { id: reservation.room_id },
          data: { status: RoomStatus.OCCUPIED },
        });

        await tx.auditLog.create({
          data: {
            action: 'RESERVATION_CHECK_IN',
            resource: 'Reservation',
            details: {
              reservationId: id,
              roomId: reservation.room_id,
              roomNumber: reservation.room.number,
              guestName: reservation.guest.name,
            },
            ip_address: req.ip || null,
            user_agent: req.headers['user-agent'] || null,
            user_id: req.user?.id || null,
          },
        });

        return { updatedReservation, updatedRoom };
      });

      res.status(200).json({
        status: 'success',
        message: `Check-in realizado com sucesso para o Quarto ${reservation.room.number}!`,
        reservation: result.updatedReservation,
        room: result.updatedRoom,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realizar Check-out (Muda Reserva para CHECKED_OUT e Quarto para CLEANING via Transação)
   */
  public static async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID da reserva não fornecido.', 400);
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { room: true, guest: true },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      if (reservation.status !== ReservationStatus.CHECKED_IN) {
        throw new AppError('O check-out só pode ser realizado em reservas com status "CHECKED_IN".', 400);
      }

      // Transação Atômica do Prisma
      const result = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.CHECKED_OUT },
          include: { room: true, guest: true },
        });

        const updatedRoom = await tx.room.update({
          where: { id: reservation.room_id },
          data: { status: RoomStatus.CLEANING },
        });

        await tx.auditLog.create({
          data: {
            action: 'RESERVATION_CHECK_OUT',
            resource: 'Reservation',
            details: {
              reservationId: id,
              roomId: reservation.room_id,
              roomNumber: reservation.room.number,
              guestName: reservation.guest.name,
            },
            ip_address: req.ip || null,
            user_agent: req.headers['user-agent'] || null,
            user_id: req.user?.id || null,
          },
        });

        return { updatedReservation, updatedRoom };
      });

      res.status(200).json({
        status: 'success',
        message: `Check-out concluído. O Quarto ${reservation.room.number} foi liberado e encaminhado para Limpeza.`,
        reservation: result.updatedReservation,
        room: result.updatedRoom,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar Reserva
   */
  public static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID da reserva não fornecido.', 400);
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { room: true, guest: true },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      if (reservation.status === ReservationStatus.CANCELLED) {
        throw new AppError('Esta reserva já está cancelada.', 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedReservation = await tx.reservation.update({
          where: { id },
          data: { status: ReservationStatus.CANCELLED },
          include: { room: true, guest: true },
        });

        // Se o quarto estava marcado como OCCUPIED pela reserva cancelada, libera
        if (reservation.room.status === RoomStatus.OCCUPIED && reservation.status === ReservationStatus.CHECKED_IN) {
          await tx.room.update({
            where: { id: reservation.room_id },
            data: { status: RoomStatus.AVAILABLE },
          });
        }

        await tx.auditLog.create({
          data: {
            action: 'RESERVATION_CANCEL',
            resource: 'Reservation',
            details: { reservationId: id, guestName: reservation.guest.name },
            ip_address: req.ip || null,
            user_agent: req.headers['user-agent'] || null,
            user_id: req.user?.id || null,
          },
        });

        return updatedReservation;
      });

      res.status(200).json({
        status: 'success',
        message: 'Reserva cancelada com sucesso.',
        reservation: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletar Reserva (Apenas ADMIN e MANAGER)
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      if (!id) {
        throw new AppError('ID da reserva não fornecido.', 400);
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { guest: true },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      await prisma.reservation.delete({
        where: { id },
      });

      await prisma.auditLog.create({
        data: {
          action: 'RESERVATION_DELETE',
          resource: 'Reservation',
          details: { reservationId: id, guestName: reservation.guest.name },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Reserva excluída com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }
}
