import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";

import { User } from "./users/entities/user.entity";
import { Entreprise } from "./entreprises/entities/entreprise.entity";
import { Demande } from "./demandes/entities/demande.entity";
import { Document } from "./documents/entities/document.entity";
import { Conversation } from "./conversations/entities/conversation.entity";
import { Message } from "./messages/entities/message.entity";
import { Diagnostic } from "./diagnostics/entities/diagnostic.entity";
import { QuestionDiagnostic } from "./diagnostics/entities/question-diagnostic.entity";
import { Publication } from "./publications/entities/publication.entity";
import { Notification } from "./notifications/entities/notification.entity";

// ⬇️ FPD Entities
import { SessionFPD } from "./fpd/entities/session-fpd.entity";
import { InscriptionFPD } from "./fpd/entities/inscription-fpd.entity";
import { ModuleFPD } from "./fpd/entities/module-fpd.entity";
import { QuizFPD } from "./fpd/entities/quiz-fpd.entity";
import { ResultatFPD } from "./fpd/entities/resultat-fpd.entity";

import { MailModule } from "./mail/mail.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { EntreprisesModule } from "./entreprises/entreprises.module";
import { DemandesModule } from "./demandes/demandes.module";
import { DiagnosticsModule } from "./diagnostics/diagnostics.module";
import { PublicationsModule } from "./publications/publications.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UploadModule } from "./upload/upload.module";
import { DocumentsModule } from "./documents/documents.module";
import { CronModule } from "./cron/cron.module";
import { AdminStatsModule } from "./admin-stats/admin-stats.module";
import { FpdModule } from "./fpd/fpd.module";
import { SearchModule } from "./search/search.module";

@Module({
  imports: [
    /* ============================================
       1. CONFIG (global)
       ============================================ */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    /* ============================================
       2. CRON (Schedule)
       ============================================ */
    ScheduleModule.forRoot(),

    /* ============================================
       3. BASE DE DONNÉES
       ============================================ */
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST", "localhost"),
        port: parseInt(config.get("DB_PORT", "5432"), 10),
        username: config.get("DB_USER", "postgres"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_NAME", "accompagnement"),
        entities: [
          User,
          Entreprise,
          Demande,
          Document,
          Conversation,
          Message,
          Diagnostic,
          QuestionDiagnostic,
          Publication,
          Notification,
          // ⬇️ FPD
          SessionFPD,
          InscriptionFPD,
          ModuleFPD,
          QuizFPD,
          ResultatFPD,
        ],
        synchronize: false,
        logging: ["error", "warn"],
      }),
    }),

    /* ============================================
       4. MODULES MÉTIER
       ============================================ */
    MailModule,
    AuthModule,
    UsersModule,
    EntreprisesModule,
    DemandesModule,
    DiagnosticsModule,
    PublicationsModule,
    ConversationsModule,
    NotificationsModule,
    UploadModule,
    DocumentsModule,
    CronModule,
    AdminStatsModule,
    FpdModule,
    SearchModule,
  ],
})
export class AppModule {}