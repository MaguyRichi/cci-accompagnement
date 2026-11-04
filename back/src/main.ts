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
  // CONFIGURATION CLOUDINARY (avec SHA-256)
  // ============================================
  const cloudName = config.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = config.get('CLOUDINARY_API_KEY');
  const apiSecret = config.get('CLOUDINARY_API_SECRET');

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    signature_algorithm: 'sha256', // ✅ Force l'utilisation de SHA-256
  });

  console.log('🔑 Cloudinary configuré avec succès (SHA-256).');

  // ============================================
  // CONFIGURATION NESTJS
  // ============================================
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

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = config.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API NestJS : http://localhost:${port}/api`);
  console.log(`📁 Uploads     : http://localhost:${port}/uploads/`);
}
bootstrap();