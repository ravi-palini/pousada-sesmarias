import { Router, Request, Response } from 'express';
import { authRoutes } from './authRoutes.js';
import { roomRoutes } from './roomRoutes.js';
import { guestRoutes } from './guestRoutes.js';
import { reservationRoutes } from './reservationRoutes.js';
import { paymentRoutes } from './paymentRoutes.js';

const routes = Router();

// Endpoint de verificação de saúde da API
routes.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    service: 'Pousada Sesmarias Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
routes.use('/auth', authRoutes);
routes.use('/rooms', roomRoutes);
routes.use('/guests', guestRoutes);
routes.use('/reservations', reservationRoutes);
routes.use('/payments', paymentRoutes);

export { routes };
