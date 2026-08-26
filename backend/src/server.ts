import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🏨 POUSADA SESMARIAS - SISTEMA DE GESTÃO`);
  console.log(`🚀 Servidor backend operacional`);
  console.log(`📡 Porta: ${env.PORT}`);
  console.log(`🛡️  Ambiente: ${env.NODE_ENV}`);
  console.log(`🔒 AppSec: Helmet, CORS, Cookie HTTPOnly & Rate Limiter Ativos`);
  console.log(`====================================================`);
});

// Encerramento gracioso (Graceful Shutdown)
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor com segurança...`);
  server.close(async () => {
    console.log('🚪 Conexões HTTP encerradas.');
    try {
      await prisma.$disconnect();
      console.log('📦 Conexão com banco de dados PostgreSQL encerrada.');
    } catch (err) {
      console.error('Erro ao desconectar do banco de dados:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  console.error('💥 Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

