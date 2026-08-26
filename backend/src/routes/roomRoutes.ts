import { Router } from 'express';
import { RoomController } from '../controllers/RoomController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const roomRoutes = Router();

// Todas as rotas de quartos exigem autenticação ativa
roomRoutes.use(authMiddleware);

// Leitura (Todos os usuários autenticados)
roomRoutes.get('/', RoomController.getAll);
roomRoutes.get('/:id', RoomController.getById);

// Atualização de Status (ADMIN, MANAGER e RECEPTION)
roomRoutes.patch('/:id/status', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), RoomController.updateStatus);

// Criação, Edição Completa e Remoção de Quartos (ADMIN e MANAGER)
roomRoutes.post('/', requireRoles(Role.ADMIN, Role.MANAGER), RoomController.create);
roomRoutes.put('/:id', requireRoles(Role.ADMIN, Role.MANAGER), RoomController.update);
roomRoutes.delete('/:id', requireRoles(Role.ADMIN, Role.MANAGER), RoomController.delete);

export { roomRoutes };

