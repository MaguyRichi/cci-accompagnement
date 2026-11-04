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

  // ============================================
  // DEBUG : Vérification des clés Cloudinary
  // ============================================
  const apiKey = config.get('CLOUDINARY_API_KEY');
  const apiSecret = config.get('CLOUDINARY_API_SECRET');
  const cloudName = config.get('CLOUDINARY_CLOUD_NAME');

  console.log('🔍 API KEY RECUE:', JSON.stringify(apiKey));
  console.log('🔍 SECRET RECU:', JSON.stringify(apiSecret));
  console.log('🔍 CLOUD NAME RECU:', JSON.stringify(cloudName));

  // ============================================
  // CONFIGURATION CLOUDINARY
  // ============================================
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  console.log('🔑 Cloudinary configuré avec succès.');

  // ============================================
  // CONFIGURATION NESTJS
  // ============================================
  // Préfixe global
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: config.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Fichiers statiques (uploads accessibles via /uploads/...)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // ============================================
  // DÉMARRAGE
  // ============================================
  const port = config.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API NestJS : http://localhost:${port}/api`);
  console.log(`📁 Uploads     : http://localhost:${port}/uploads/`);
}
bootstrap();