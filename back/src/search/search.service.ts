import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Entreprise } from '../entreprises/entities/entreprise.entity';
import { Demande } from '../demandes/entities/demande.entity';
import { Document } from '../documents/entities/document.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
    @InjectRepository(Demande)
    private readonly demandeRepository: Repository<Demande>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async searchAll(q: string, limit = 5) {
    const term = `%${q.trim()}%`;

    const [utilisateurs, entreprises, demandes, documents] = await Promise.all([
      // 1. UTILISATEURS
      this.userRepository.find({
        where: [
          { nom: ILike(term) },
          { prenom: ILike(term) },
          { email: ILike(term) },
        ],
        select: [
          'id',
          'nom',
          'prenom',
          'email',
          'role',
          'photoProfil',
          'actif',
        ],
        take: limit,
      }),

      // 2. ENTREPRISES
      this.entrepriseRepository.find({
        where: [
          { raisonSociale: ILike(term) },
          { sigle: ILike(term) },
          { nif: ILike(term) },
          { stat: ILike(term) },
          { ville: ILike(term) },
        ],
        select: [
          'id',
          'raisonSociale',
          'sigle',
          'nif',
          'stat',
          'ville',
          'logo',
          'statut',
          'verifie',
        ],
        take: limit,
      }),

      // 3. DEMANDES
      this.demandeRepository.find({
        where: [
          { titre: ILike(term) },
          { description: ILike(term) },
        ],
        relations: ['emetteur', 'entreprise'],
        take: limit,
      }),

      // 4. DOCUMENTS
      this.documentRepository.find({
        where: [
          { nom: ILike(term) },
        ],
        relations: ['utilisateur', 'entreprise'],
        take: limit,
      }),
    ]);

    // Nettoyage : retirer les hash de mot de passe
    const utilisateursSafe = utilisateurs.map((u) => {
      const { motDePasseHash, tokenActivation, tokenReset, ...rest } = u as any;
      return rest;
    });

    return {
      utilisateurs: utilisateursSafe,
      entreprises,
      demandes,
      documents,
      total:
        utilisateursSafe.length +
        entreprises.length +
        demandes.length +
        documents.length,
    };
  }
}