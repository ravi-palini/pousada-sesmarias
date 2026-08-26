import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { routes } from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// 1. Cabeçalhos de Segurança HTTP (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Configuração de CORS restritivo com suporte a cookies/credenciais
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting Global (Proteção contra DoS e abusos de requisições)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo de 100 requisições por janela por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições originadas deste IP. Por favor, tente novamente mais tarde.',
  },
});
app.use(globalLimiter);

// 4. Parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 5. Rotas da Aplicação
app.use('/api', routes);

// 6. Tratamento de Rotas Inexistentes (404)
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Recurso não encontrado.',
  });
});

// 7. Middleware Centralizado de Tratamento de Erros
app.use(errorHandler);

export { app };

