import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';
import { Role } from '@prisma/client';

const paymentRoutes = Router();

// Todas as rotas de pagamentos exigem autenticação
paymentRoutes.use(authMiddleware);

// Registrar pagamento (ADMIN, MANAGER e RECEPTION)
paymentRoutes.post(
  '/',
  requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION),
  PaymentController.create
);

// Listar pagamentos de uma reserva (todos os autenticados)
paymentRoutes.get(
  '/reservation/:reservationId',
  PaymentController.getByReservation
);

// Cancelar / estornar pagamento (apenas ADMIN e MANAGER)
paymentRoutes.post(
  '/:id/cancel',
  requireRoles(Role.ADMIN, Role.MANAGER),
  PaymentController.cancel
);

export { paymentRoutes };
