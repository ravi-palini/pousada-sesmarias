import { Router } from 'express';
import { ReservationController } from '../controllers/ReservationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const reservationRoutes = Router();

// Todas as rotas de reservas exigem usuário autenticado
reservationRoutes.use(authMiddleware);

// Leitura (Todos os usuários autenticados)
reservationRoutes.get('/', ReservationController.getAll);
reservationRoutes.get('/:id', ReservationController.getById);

// Criação e Operações de Check-in, Check-out e Cancelamento (ADMIN, MANAGER e RECEPTION)
reservationRoutes.post('/', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), ReservationController.create);
reservationRoutes.post('/:id/check-in', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), ReservationController.checkIn);
reservationRoutes.post('/:id/check-out', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), ReservationController.checkOut);
reservationRoutes.post('/:id/cancel', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), ReservationController.cancel);

// Exclusão definitiva de registro de reserva (Apenas ADMIN e MANAGER)
reservationRoutes.delete('/:id', requireRoles(Role.ADMIN, Role.MANAGER), ReservationController.delete);

export { reservationRoutes };

