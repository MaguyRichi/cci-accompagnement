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

  // ✅ CONFIGURATION CLOUDINARY
  cloudinary.config({
    cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
    api_key: config.get('CLOUDINARY_API_KEY'),
    api_secret: config.get('CLOUDINARY_API_SECRET'),
    signature_algorithm: 'sha256', // ⚠️ Essaie 'sha1' si ça ne marche pas
  });

  console.log('🔑 Cloudinary configuré (algorithme: sha256)');

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  const port = config.get('PORT') || 3001;
  await app.listen(port);
  console.log(`🚀 API : http://localhost:${port}/api`);
}
bootstrap();