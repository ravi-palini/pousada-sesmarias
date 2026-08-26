import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { AppError } from '../utils/errors.js';

const createPaymentSchema = z.object({
  reservation_id: z.string().uuid('ID da reserva inválido.'),
  amount: z.coerce.number().positive('O valor do pagamento deve ser maior que zero.'),
  payment_method: z.enum(['CASH', 'CARD', 'PIX', 'OTHER'] as const, {
    error: 'Método de pagamento inválido. Use: CASH, CARD, PIX ou OTHER.',
  }),
  reference: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export class PaymentController {
  /**
   * Registrar um novo pagamento para uma reserva
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createPaymentSchema.parse(req.body);
      const registeredBy = req.user?.id;

      if (!registeredBy) {
        throw new AppError('Usuário não autenticado.', 401);
      }

      // Verificar se a reserva existe e está em um estado que aceita pagamentos
      const reservation = await prisma.reservation.findUnique({
        where: { id: data.reservation_id },
        include: {
          guest: true,
          room: true,
          payments: { where: { status: PaymentStatus.VALID } },
        },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      if (reservation.status === 'CANCELLED') {
        throw new AppError('Não é possível registrar pagamento para uma reserva cancelada.', 400);
      }

      // Calcular saldo restante
      const totalPaid = reservation.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const balance = Number(reservation.total_price) - totalPaid;

      if (data.amount > balance + 0.01) {
        throw new AppError(
          `Valor do pagamento (R$ ${data.amount.toFixed(2)}) excede o saldo restante (R$ ${balance.toFixed(2)}).`,
          400
        );
      }

      // Registrar pagamento
      const payment = await prisma.payment.create({
        data: {
          reservation_id: data.reservation_id,
          amount: data.amount,
          payment_method: data.payment_method as PaymentMethod,
          reference: data.reference || null,
          notes: data.notes || null,
          registered_by: registeredBy,
          status: PaymentStatus.VALID,
        },
        include: {
          user: { select: { id: true, name: true } },
          reservation: { select: { id: true, total_price: true } },
        },
      });

      // Auditoria
      await prisma.auditLog.create({
        data: {
          action: 'PAYMENT_CREATE',
          resource: 'Payment',
          details: {
            paymentId: payment.id,
            reservationId: data.reservation_id,
            amount: data.amount,
            method: data.payment_method,
            guestName: reservation.guest.name,
            roomNumber: reservation.room.number,
          },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: registeredBy,
        },
      });

      res.status(201).json({
        status: 'success',
        message: 'Pagamento registrado com sucesso.',
        payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar pagamentos de uma reserva com saldo calculado
   */
  public static async getByReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const reservationId = String(req.params.reservationId);

      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: {
          guest: true,
          room: true,
          payments: {
            include: {
              user: { select: { id: true, name: true } },
            },
            orderBy: { created_at: 'desc' },
          },
        },
      });

      if (!reservation) {
        throw new AppError('Reserva não encontrada.', 404);
      }

      // Calcular totais financeiros
      const validPayments = reservation.payments.filter(
        (p) => p.status === PaymentStatus.VALID
      );
      const totalPaid = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalPrice = Number(reservation.total_price);
      const balance = totalPrice - totalPaid;

      res.status(200).json({
        status: 'success',
        reservation: {
          id: reservation.id,
          total_price: totalPrice,
          status: reservation.status,
          guest: reservation.guest,
          room: reservation.room,
          check_in: reservation.check_in,
          check_out: reservation.check_out,
        },
        financial_summary: {
          total_price: totalPrice,
          total_paid: totalPaid,
          balance: balance,
          is_paid_in_full: balance <= 0,
        },
        payments: reservation.payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar / Estornar um pagamento (ADMIN e MANAGER apenas)
   */
  public static async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const { reason, refund } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          reservation: { include: { guest: true, room: true } },
        },
      });

      if (!payment) {
        throw new AppError('Pagamento não encontrado.', 404);
      }

      if (payment.status !== PaymentStatus.VALID) {
        throw new AppError('Este pagamento já foi cancelado ou estornado anteriormente.', 400);
      }

      const newStatus = refund === true ? PaymentStatus.REFUNDED : PaymentStatus.CANCELED;

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: { status: newStatus },
        include: { user: { select: { id: true, name: true } } },
      });

      // Auditoria obrigatória para cancelamentos financeiros
      await prisma.auditLog.create({
        data: {
          action: newStatus === PaymentStatus.REFUNDED ? 'PAYMENT_REFUND' : 'PAYMENT_CANCEL',
          resource: 'Payment',
          details: {
            paymentId: id,
            reservationId: payment.reservation_id,
            amount: Number(payment.amount),
            method: payment.payment_method,
            reason: reason || null,
            guestName: payment.reservation.guest.name,
            roomNumber: payment.reservation.room.number,
          },
          ip_address: req.ip || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: req.user?.id || null,
        },
      });

      res.status(200).json({
        status: 'success',
        message: newStatus === PaymentStatus.REFUNDED
          ? 'Pagamento estornado com sucesso.'
          : 'Pagamento cancelado com sucesso.',
        payment: updatedPayment,
      });
    } catch (error) {
      next(error);
    }
  }
}
