import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SessionFPD } from './entities/session-fpd.entity';
import { InscriptionFPD } from './entities/inscription-fpd.entity';
import { ModuleFPD } from './entities/module-fpd.entity';
import { QuizFPD } from './entities/quiz-fpd.entity';
import { ResultatFPD } from './entities/resultat-fpd.entity';
import { User } from '../users/entities/user.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';

import { FpdService } from './fpd.service';
import { FpdController } from './fpd.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionFPD,
      InscriptionFPD,
      ModuleFPD,
      QuizFPD,
      ResultatFPD,
      User,
      Entreprise,
    ]),
    NotificationsModule,
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
  controllers: [FpdController],
  providers: [FpdService],
  exports: [FpdService],
})
export class FpdModule {}