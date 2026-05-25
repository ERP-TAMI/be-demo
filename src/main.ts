import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const prefix = configService.get<string>('API_PREFIX', 'api/v1');

  app.setGlobalPrefix(prefix, { exclude: ['health'] }); // health nằm ngoài prefix

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Graceful shutdown — Docker stop sẽ gửi SIGTERM
  const shutdown = async (signal: string) => {
    console.log(`[ERP] ${signal} received, shutting down...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  await app.listen(port, '0.0.0.0');
  console.log(`[ERP] Server ready → port ${port} | prefix /${prefix} | env ${process.env.NODE_ENV ?? 'development'}`);
}

bootstrap().catch((err) => {
  console.error('[ERP] Bootstrap failed:', err);
  process.exit(1);
});
