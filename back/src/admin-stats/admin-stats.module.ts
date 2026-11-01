import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { Demande } from '../demandes/entities/demande.entity';
import { Document } from '../documents/entities/document.entity';
import { Diagnostic } from '../diagnostics/entities/diagnostic.entity';
import { Publication } from '../publications/entities/publication.entity';

import { AdminStatsService } from './admin-stats.service';
import { AdminStatsController } from './admin-stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Entreprise,
      Demande,
      Document,
      Diagnostic,
      Publication,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
  exports: [AdminStatsService],
})
export class AdminStatsModule {}