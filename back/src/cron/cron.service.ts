import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  // ⚠️ Cron cota supprimé — l'entraide est gratuite
  // La méthode notifierCotasEnRetard() existe toujours dans EntreprisesService
  // mais n'est plus appelée. À supprimer si tu veux nettoyer complètement.

  // Exemple de cron vide (désactivé) :
  // @Cron('0 8 * * *', { name: 'cota-retard' })
  // async handleCotaRetard() {
  //   // Désactivé
  // }
}