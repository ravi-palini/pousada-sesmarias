import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/errors';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

export class UserService {
  /**
   * Cria um novo usuário no sistema com hash de senha seguro via Argon2id.
   */
  public static async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new AppError('Um usuário com este e-mail já existe no sistema.', 409);
    }

    const password_hash = await hashPassword(data.password);

    return prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password_hash,
        role: data.role || Role.RECEPTION,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
      },
    });
  }

  /**
   * Busca um usuário pelo ID sanitizado.
   */
  public static async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return user;
  }
}

