import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { EntreprisesModule } from '../entreprises/entreprises.module';

@Module({
  imports: [EntreprisesModule],
  providers: [CronService],
})
export class CronModule {}