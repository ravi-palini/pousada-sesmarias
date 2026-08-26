import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { env } from '../config/env';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório.')
    .email('Formato de e-mail inválido.')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'A senha é obrigatória.'),
});

export class AuthController {
  /**
   * Realiza login do usuário com validação estrita, comparação segura de hash Argon2
   * e emissão de cookie HTTPOnly seguro.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Mensagem genérica para mitigar enumeração de contas
      const invalidCredentialsMessage = 'Credenciais inválidas ou conta inativa.';

      if (!user || !user.active) {
        res.status(401).json({
          status: 'error',
          message: invalidCredentialsMessage,
        });
        return;
      }

      const isPasswordValid = await verifyPassword(user.password_hash, password);
      if (!isPasswordValid) {
        res.status(401).json({
          status: 'error',
          message: invalidCredentialsMessage,
        });
        return;
      }

      const tokenPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      const token = signToken(tokenPayload);

      // Configuração de cookie com máxima segurança contra XSS e CSRF
      res.cookie('token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 dia em milissegundos
        path: '/',
      });

      // Registro de auditoria do login
      await prisma.auditLog.create({
        data: {
          action: 'AUTH_LOGIN',
          resource: 'User',
          details: { email: user.email, role: user.role },
          ip_address: req.ip || req.socket.remoteAddress || null,
          user_agent: req.headers['user-agent'] || null,
          user_id: user.id,
        },
      });

      res.status(200).json({
        status: 'success',
        message: 'Login realizado com sucesso.',
        user: tokenPayload,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realiza logout do usuário limpando o cookie HTTPOnly.
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      // Se havia usuário autenticado, registrar no audit log
      if (req.user?.id) {
        await prisma.auditLog.create({
          data: {
            action: 'AUTH_LOGOUT',
            resource: 'User',
            details: { userId: req.user.id },
            ip_address: req.ip || req.socket.remoteAddress || null,
            user_agent: req.headers['user-agent'] || null,
            user_id: req.user.id,
          },
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Logout realizado com sucesso.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna os dados do usuário atualmente autenticado na sessão.
   */
  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 'error',
          message: 'Usuário não autenticado.',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        user: req.user,
      });
    } catch (error) {
      next(error);
    }
  }
}
