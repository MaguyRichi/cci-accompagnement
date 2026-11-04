import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer'; // ✅ On utilise la mémoire au lieu du disque

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule, // fournit JwtStrategy + AuthService
    PassportModule.register({ defaultStrategy: 'jwt' }), // pour AuthGuard('jwt')
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
    MulterModule.register({
      // ✅ On garde le fichier en mémoire vive pour l'envoyer à Cloudinary
      storage: memoryStorage(),
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}