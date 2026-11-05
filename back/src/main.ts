import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // ✅ CONFIGURATION CLOUDINARY (fonctionne désormais avec Master Admin)
  cloudinary.config({
    cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
    api_key: config.get('CLOUDINARY_API_KEY'),
    api_secret: config.get('CLOUDINARY_API_SECRET'),
    signature_algorithm: 'sha256',
  });

  // ✅ CONFIGURATION NESTJS
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: config.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Fichiers statiques (pour les anciens uploads locaux, même si Cloudinary gère maintenant)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ✅ PORT DYNAMIQUE (pour Render, qui utilise process.env.PORT)
  const port = process.env.PORT || config.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API NestJS : http://localhost:${port}/api`);
  console.log(`📁 Uploads     : http://localhost:${port}/uploads/`);
}

bootstrap();