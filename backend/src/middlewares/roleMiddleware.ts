import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

/**
 * Middleware RBAC para restringir acesso a rotas baseado nas Roles do usuário autenticado.
 */
export function requireRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado: usuário não autenticado.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        status: 'error',
        message: 'Acesso proibido: privilégios insuficientes para este recurso.',
      });
      return;
    }

    next();
  };
}

