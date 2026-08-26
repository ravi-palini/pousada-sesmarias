import { Router } from 'express';
import { GuestController } from '../controllers/GuestController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRoles } from '../middlewares/roleMiddleware';
import { Role } from '@prisma/client';

const guestRoutes = Router();

// Todas as rotas de hóspedes exigem autenticação ativa
guestRoutes.use(authMiddleware);

// Leitura (Todos os perfis autenticados)
guestRoutes.get('/', GuestController.getAll);
guestRoutes.get('/:id', GuestController.getById);

// Criação e Atualização de Hóspedes (ADMIN, MANAGER e RECEPTION)
guestRoutes.post('/', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), GuestController.create);
guestRoutes.put('/:id', requireRoles(Role.ADMIN, Role.MANAGER, Role.RECEPTION), GuestController.update);

// Exclusão de Hóspedes (Apenas ADMIN e MANAGER)
guestRoutes.delete('/:id', requireRoles(Role.ADMIN, Role.MANAGER), GuestController.delete);

export { guestRoutes };

