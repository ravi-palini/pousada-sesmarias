import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';

const authRoutes = Router();

// Rate limiter específico para endpoints sensíveis de autenticação (mitigação de brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limite de 10 tentativas por IP por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de autenticação. Por favor, tente novamente em 15 minutos.',
  },
});

authRoutes.post('/login', authLimiter, AuthController.login);
authRoutes.post('/logout', authMiddleware, AuthController.logout);
authRoutes.get('/me', authMiddleware, AuthController.me);

export { authRoutes };

