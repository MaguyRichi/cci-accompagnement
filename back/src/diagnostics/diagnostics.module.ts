import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Diagnostic } from './entities/diagnostic.entity';
import { QuestionDiagnostic } from './entities/question-diagnostic.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { DiagnosticsService } from './diagnostics.service';
import { DiagnosticsController } from './diagnostics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Diagnostic, QuestionDiagnostic, Entreprise]),
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
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}