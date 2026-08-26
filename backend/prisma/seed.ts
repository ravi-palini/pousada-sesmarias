import { PrismaClient, Role, RoomStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const adminEmail = 'admin@pousadasesmarias.com.br';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await argon2.hash('Admin@Sesmarias2026!', {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const admin = await prisma.user.create({
      data: {
        name: 'Administrador Pousada',
        email: adminEmail,
        password_hash: passwordHash,
        role: Role.ADMIN,
        active: true,
      },
    });

    console.log(`✅ Usuário administrador criado: ${admin.email} (Senha: Admin@Sesmarias2026!)`);
  } else {
    console.log('ℹ️  Usuário administrador já existe.');
  }

  // Quarto inicial para testes
  const existingRoom = await prisma.room.findUnique({
    where: { number: '101' },
  });

  if (!existingRoom) {
    await prisma.room.create({
      data: {
        number: '101',
        name: 'Chalé Ouro Preto',
        category: 'Chalé Master',
        capacity: 2,
        daily_rate: 450.0,
        status: RoomStatus.AVAILABLE,
        description: 'Chalé com vista para a serra, banheira de hidromassagem e lareira.',
      },
    });
    console.log('✅ Quarto de teste 101 criado.');
  }

  console.log('✨ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

