import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erro operacional controlado da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Erro de validação do Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    res.status(400).json({
      status: 'error',
      message: 'Falha na validação dos dados de entrada.',
      errors: formattedErrors,
    });
    return;
  }

  // Erros de JWT
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      status: 'error',
      message: 'Sessão expirada. Por favor, faça login novamente.',
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      status: 'error',
      message: 'Token de autenticação inválido.',
    });
    return;
  }

  // Log do erro no servidor para monitoramento
  console.error('💥 Erro não tratado:', err);

  // Erro genérico de servidor 500 (sem vazar stack trace)
  res.status(500).json({
    status: 'error',
    message:
      env.NODE_ENV === 'production'
        ? 'Ocorreu um erro interno no servidor.'
        : err.message || 'Ocorreu um erro interno no servidor.',
  });
};

