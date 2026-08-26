import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserPayload } from '../types/auth';
import { prisma } from '../config/prisma';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Leitura estrita e exclusiva de cookies HTTPOnly
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado: autenticação obrigatória.',
      });
      return;
    }

    // Validação do JWT
    const decoded = verifyToken<UserPayload>(token);

    if (!decoded || !decoded.id) {
      res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado: token inválido.',
      });
      return;
    }

    // Verificação de integridade no banco de dados (garante que usuário ativo ainda existe)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    if (!user || !user.active) {
      res.status(401).json({
        status: 'error',
        message: 'Acesso não autorizado: usuário inexistente ou inativo.',
      });
      return;
    }

    // Injeta dados sanitizados do usuário autenticado no request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Acesso não autorizado: sessão inválida ou expirada.',
    });
  }
}

