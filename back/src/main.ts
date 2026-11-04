import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { v2 as cloudinary } from 'cloudinary'; // ✅ Import ajouté
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // ✅ CONFIGURATION GLOBALE DE CLOUDINARY
  cloudinary.config({
    cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
    api_key: config.get('CLOUDINARY_API_KEY'),
    api_secret: config.get('CLOUDINARY_API_SECRET'),
  });
  console.log('🔑 Cloudinary configuré avec succès.');

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

  // ✅ Fichiers statiques (uploads accessibles via /uploads/...)
  // Note: Avec Cloudinary, ceci ne servira plus pour les nouvelles images, 
  // mais on le garde pour les anciennes ou les fichiers locaux.
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = config.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 API NestJS : http://localhost:${port}/api`);
  console.log(`📁 Uploads     : http://localhost:${port}/uploads/`);
}
bootstrap();