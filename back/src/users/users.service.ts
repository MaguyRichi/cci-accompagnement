import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { tokenActivation: token },
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { tokenReset: token },
    });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    await this.userRepository.update(id, data);
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }
    return user;
  }


  async findMentors(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: 'MENTOR' as any, actif: true },
    });
  }
  /* ============================================
   MENTORS PUBLICS (pour page d'accueil)
   ============================================ */
async findMentorsPublic() {
  const mentors = await this.userRepository.find({
    where: { role: 'MENTOR' as any, actif: true },
    select: [
      'id',
      'nom',
      'prenom',
      'photoProfil',
      'domaineMentor',
      'experienceMentor',
      'bioMentor',
      'disponibilite',
      'agrementMentor',
      'noteMoyenne',
      'nbEvaluations',
      'languesMentor',
    ],
    order: { noteMoyenne: 'DESC' },
  });

  // Compter les PME suivies par chaque mentor
  const result = await Promise.all(
    mentors.map(async (m) => {
      const nbPme = await this.userRepository.manager
        .createQueryBuilder()
        .select('COUNT(*)', 'count')
        .from('entreprises', 'e')
        .where('e.mentor_id = :id', { id: m.id })
        .andWhere('e.statut = :statut', { statut: 'ACTIF' })
        .getRawOne();

      return {
        ...m,
        nbPmeSuivies: Number(nbPme?.count || 0),
      };
    }),
  );

  return result;
}

/* ============================================
   LISTER TOUS LES UTILISATEURS (admin)
   ============================================ */
async findAll(role?: string) {
  const where: any = {};
  if (role) where.role = role;

  const users = await this.userRepository.find({
    where,
    order: { createdAt: 'DESC' },
  });

  // Ne pas exposer les hashs
  return users.map((u) => {
    const { motDePasseHash, tokenActivation, tokenReset, ...rest } = u;
    return rest;
  });
}
/* ============================================
   CONTACTS POUR LE CHAT
   ============================================ */
async findContactsForChat() {
  const users = await this.userRepository.find({
    where: { actif: true },
    select: [
      "id",
      "nom",
      "prenom",
      "email",
      "role",
      "photoProfil",
      "domaineMentor",
      "telephone",
    ],
    order: { role: "ASC", nom: "ASC" },
  });

  return users;
}

/* ============================================
   TROUVER UN UTILISATEUR (safe)
   ============================================ */
async findOneSafe(id: number) {
  const user = await this.userRepository.findOne({
    where: { id },
    select: [
      "id",
      "nom",
      "prenom",
      "email",
      "role",
      "photoProfil",
      "telephone",
      "domaineMentor",
      "experienceMentor",
    ],
  });

  if (!user) {
    throw new Error(`Utilisateur ${id} introuvable`);
  }

  return user;
}
/* ============================================
   BANNIR UN UTILISATEUR (admin)
   ============================================ */
async banUser(id: number, motif: string) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`Utilisateur ${id} introuvable`);
  }

  if (user.role === "ADMIN") {
    throw new ForbiddenException("Impossible de bannir un administrateur");
  }

  user.actif = false;
  user.bioCourte = `[BANNI] ${motif}`;
  await this.userRepository.save(user);

  // Si c'est un dirigeant, suspendre son entreprise
  if (user.role === "DIRIGEANT") {
    await this.userRepository.manager
      .createQueryBuilder()
      .update("entreprises")
      .set({
        statut: "SUSPENDU",
        motifSuspension: motif,
        dateSuspension: new Date(),
      })
      .where("dirigeant_id = :id", { id: user.id })
      .execute();
  }

  return { message: "Utilisateur banni avec succès", user };
}

/* ============================================
   RÉACTIVER UN UTILISATEUR (admin)
   ============================================ */
async unbanUser(id: number) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`Utilisateur ${id} introuvable`);
  }

  user.actif = true;
  user.bioCourte = null;
  await this.userRepository.save(user);

  // Réactiver l'entreprise si dirigeant
  if (user.role === "DIRIGEANT") {
    await this.userRepository.manager
      .createQueryBuilder()
      .update("entreprises")
      .set({
        statut: "ACTIF",
        motifSuspension: null,
        dateSuspension: null,
      })
      .where("dirigeant_id = :id", { id: user.id })
      .execute();
  }

  return { message: "Utilisateur réactivé avec succès", user };
}

/* ============================================
   SUPPRIMER UN UTILISATEUR (admin)
   ============================================ */
async deleteUser(id: number) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`Utilisateur ${id} introuvable`);
  }

  if (user.role === "ADMIN") {
    throw new ForbiddenException("Impossible de supprimer un administrateur");
  }

  // Récupérer l'entreprise liée (si dirigeant)
  let entrepriseId: number | null = null;
  if (user.role === "DIRIGEANT") {
    const entreprise = await this.userRepository.manager
      .createQueryBuilder()
      .select("id")
      .from("entreprises", "e")
      .where("e.dirigeant_id = :id", { id: user.id })
      .getRawOne();
    if (entreprise) entrepriseId = entreprise.id;
  }

  // 1. Supprimer les conversations de l'utilisateur
  await this.userRepository.manager
    .createQueryBuilder()
    .delete()
    .from("messages")
    .where("expediteur_id = :id", { id: user.id })
    .execute();

  await this.userRepository.manager
    .createQueryBuilder()
    .delete()
    .from("conversations")
    .where("demandeur_id = :id OR destinataire_id = :id", { id: user.id })
    .execute();

  // 2. Supprimer les notifications
  await this.userRepository.manager
    .createQueryBuilder()
    .delete()
    .from("notifications")
    .where("utilisateur_id = :id", { id: user.id })
    .execute();

  // 3. Supprimer les demandes émises
  await this.userRepository.manager
    .createQueryBuilder()
    .delete()
    .from("demandes")
    .where("emetteur_id = :id OR cible_id = :id", { id: user.id })
    .execute();

  // 4. Si dirigeant, supprimer l'entreprise et ses données
  if (entrepriseId) {
    await this.userRepository.manager
      .createQueryBuilder()
      .delete()
      .from("publications")
      .where("entreprise_id = :eid", { eid: entrepriseId })
      .execute();

    await this.userRepository.manager
      .createQueryBuilder()
      .delete()
      .from("diagnostics")
      .where("entreprise_id = :eid", { eid: entrepriseId })
      .execute();

    await this.userRepository.manager
      .createQueryBuilder()
      .delete()
      .from("documents")
      .where("entreprise_id = :eid", { eid: entrepriseId })
      .execute();

    await this.userRepository.manager
      .createQueryBuilder()
      .delete()
      .from("entreprises")
      .where("id = :eid", { eid: entrepriseId })
      .execute();
  }

  // 5. Supprimer les documents personnels
  await this.userRepository.manager
    .createQueryBuilder()
    .delete()
    .from("documents")
    .where("utilisateur_id = :id", { id: user.id })
    .execute();

  // 6. Enfin supprimer l'utilisateur
  await this.userRepository.remove(user);

  return { message: "Utilisateur supprimé définitivement" };
}
/* ============================================
   METTRE À JOUR SON PROPRE PROFIL
   ============================================ */
async updateMe(
  id: number,
  data: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    photoProfil?: string;
    bioCourte?: string;
  },
) {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException(`Utilisateur ${id} introuvable`);
  }

  // Champs autorisés à la modification par l'utilisateur lui-même
  const allowedFields = [
    'nom',
    'prenom',
    'telephone',
    'photoProfil',
    'bioCourte',
  ];

  for (const key of allowedFields) {
    if (data[key as keyof typeof data] !== undefined) {
      (user as any)[key] = (data as any)[key];
    }
  }

  await this.userRepository.save(user);

  // Retourner sans hash
  const { motDePasseHash, tokenActivation, tokenReset, ...rest } = user;
  return rest;
}
}
