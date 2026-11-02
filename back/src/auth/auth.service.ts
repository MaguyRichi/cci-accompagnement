import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UsersService } from "../users/users.service";
import { Entreprise } from "../entreprises/entities/entreprise.entity";
import {
  Demande,
  StatutDemandeEnum,
  TypeDemandeEnum,
} from "../demandes/entities/demande.entity";
import { User } from "../users/entities/user.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../mail/mail.service";

import { RegisterDirigeantDto } from "./dto/register-dirigeant.dto";
import { RegisterMentorDto } from "./dto/register-mentor.dto";
import { LoginDto } from "./dto/login.dto";
import { ActivateDto } from "./dto/activate.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    @InjectRepository(Entreprise)
    private readonly entrepriseRepository: Repository<Entreprise>,
    @InjectRepository(Demande)
    private readonly demandeRepository: Repository<Demande>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /* ============================================
     INSCRIPTION DIRIGEANT — pas d'email envoyé
     ============================================ */
  async registerDirigeant(dto: RegisterDirigeantDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new BadRequestException("Cet email est déjà utilisé");
    }

    const tokenActivation = crypto.randomBytes(32).toString("hex");
    const tokenExpireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await this.usersService.create({
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email,
      telephone: dto.telephone,
      role: "DIRIGEANT" as any,
      actif: false,
      emailVerifie: false,
      tokenActivation,
      tokenExpireAt,
    });

    const entreprise = this.entrepriseRepository.create({
      raisonSociale: dto.raisonSociale,
      sigle: dto.sigle || null,
      nif: dto.nif,
      stat: dto.stat,
      rcs: dto.rcs || null,
      formeJuridique: dto.formeJuridique || null,
      secteur: dto.secteur,
      taille: dto.taille as any,
      effectif: dto.effectif || null,
      adresse: dto.adresse || null,
      ville: dto.ville || null,
      description: dto.description || null,
      dirigeantId: user.id,
      statut: "INACTIF" as any,
    });
    const savedEntreprise = await this.entrepriseRepository.save(entreprise);

    const demande = this.demandeRepository.create({
      type: TypeDemandeEnum.INSCRIPTION_DIRIGEANT,
      emetteurId: user.id,
      entrepriseId: savedEntreprise.id,
      titre: `Inscription dirigeant — ${dto.raisonSociale}`,
      description: `Nouvelle demande d'inscription de ${dto.prenom} ${dto.nom} pour l'entreprise ${dto.raisonSociale} (NIF: ${dto.nif})`,
      statut: StatutDemandeEnum.EN_ATTENTE,
      visiblePubliquement: false,
    } as any);
    await this.demandeRepository.save(demande);

    try {
      await this.notificationsService.create({
        utilisateurId: user.id,
        titre: " Votre inscription est enregistrée",
        message: `Bonjour ${dto.prenom}, votre dossier est en cours d'examen par la CCI. Vous recevrez un email d'activation dès validation.`,
        type: "INFO" as any,
        lien: "/connexion",
      });
    } catch (err) {
      this.logger.error("Erreur notification inscription:", err);
    }

    try {
      const admins = await this.userRepository.find({
        where: { role: "ADMIN" as any, actif: true },
        select: ["id"],
      });

      for (const admin of admins) {
        await this.notificationsService.create({
          utilisateurId: admin.id,
          titre: " Nouvelle demande d'inscription",
          message: `${dto.prenom} ${dto.nom} s'est inscrit en tant que Dirigeant de PME.`,
          type: "INFO" as any,
          lien: "/admin/inscriptions",
        });
      }
    } catch (err) {
      this.logger.error("Erreur notification admins:", err);
    }

    return {
      message:
        "Dossier enregistré. Votre demande sera examinée par un agent consulaire. Vous recevrez un email d'activation après validation.",
      email: user.email,
    };
  }

  /* ============================================
     INSCRIPTION MENTOR — pas d'email envoyé
     ============================================ */
  async registerMentor(dto: RegisterMentorDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) {
      throw new BadRequestException("Cet email est déjà utilisé");
    }

    const tokenActivation = crypto.randomBytes(32).toString("hex");
    const tokenExpireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await this.usersService.create({
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email,
      telephone: dto.telephone,
      role: "MENTOR" as any,
      actif: false,
      emailVerifie: false,
      tokenActivation,
      tokenExpireAt,
      domaineMentor: dto.domaineMentor,
      experienceMentor: dto.experienceMentor,
      bioMentor: dto.bioMentor,
      disponibilite: dto.disponibilite as any,
      agrementMentor: dto.agrementMentor || null,
    });

    const demande = this.demandeRepository.create({
      type: TypeDemandeEnum.INSCRIPTION_MENTOR,
      emetteurId: user.id,
      titre: `Candidature mentor — ${dto.prenom} ${dto.nom}`,
      description: `Candidature mentor dans le domaine : ${dto.domaineMentor}. Expérience : ${dto.experienceMentor} ans.`,
      statut: StatutDemandeEnum.EN_ATTENTE,
      visiblePubliquement: false,
    } as any);
    await this.demandeRepository.save(demande);

    try {
      await this.notificationsService.create({
        utilisateurId: user.id,
        titre: " Votre candidature est enregistrée",
        message: `Bonjour ${dto.prenom}, votre candidature mentor est en cours d'examen par la CCI. Vous recevrez un email d'activation dès validation.`,
        type: "INFO" as any,
        lien: "/connexion",
      });
    } catch (err) {
      this.logger.error("Erreur notification inscription mentor:", err);
    }

    try {
      const admins = await this.userRepository.find({
        where: { role: "ADMIN" as any, actif: true },
        select: ["id"],
      });

      for (const admin of admins) {
        await this.notificationsService.create({
          utilisateurId: admin.id,
          titre: "📥 Nouvelle candidature mentor",
          message: `${dto.prenom} ${dto.nom} souhaite devenir mentor (${dto.domaineMentor}).`,
          type: "INFO" as any,
          lien: "/admin/inscriptions",
        });
      }
    } catch (err) {
      this.logger.error("Erreur notification admins mentor:", err);
    }

    return {
      message:
        "Candidature enregistrée. Elle sera examinée par la CCI. Vous recevrez un email d'activation après validation.",
      email: user.email,
    };
  }

  /* ============================================
     CONNEXION
     ============================================ */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }

    if (!user.motDePasseHash) {
      throw new UnauthorizedException(
        "Votre compte n'est pas encore activé. Vérifiez votre email.",
      );
    }

    const valid = await bcrypt.compare(dto.motDePasse, user.motDePasseHash);
    if (!valid) {
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }

    if (!user.actif) {
      if (user.bioCourte?.startsWith("[BANNI]")) {
        throw new UnauthorizedException(
          "Votre compte a été suspendu par la CCI. Contactez l'administrateur.",
        );
      }
      throw new UnauthorizedException(
        "Votre compte est en attente de validation par la CCI.",
      );
    }

    await this.usersService.update(user.id, { derniereConnexion: new Date() });

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: "Connexion réussie",
      access_token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        photoProfil: user.photoProfil,
      },
    };
  }

  /* ============================================
     VÉRIFIER UN TOKEN D'ACTIVATION
     ============================================ */
  async verifyActivationToken(token: string) {
    if (!token) {
      return { valide: false, raison: "Token manquant" };
    }

    const user = await this.usersService.findByToken(token);

    if (!user) {
      return {
        valide: false,
        raison:
          "Ce lien est invalide ou a déjà été utilisé. Si vous avez déjà créé votre mot de passe, connectez-vous.",
      };
    }

    if (user.tokenExpireAt && user.tokenExpireAt < new Date()) {
      return {
        valide: false,
        raison:
          "Ce lien a expiré. Veuillez contacter la CCI pour recevoir un nouveau lien.",
      };
    }

    if (user.motDePasseHash) {
      return {
        valide: false,
        raison:
          "Ce lien a déjà été utilisé. Vous pouvez vous connecter avec votre email.",
      };
    }

    return {
      valide: true,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    };
  }

  /* ============================================
     ACTIVER LE COMPTE (création mot de passe)
     ============================================ */
  async activate(dto: ActivateDto) {
    const user = await this.usersService.findByToken(dto.token);
    if (!user) throw new BadRequestException("Token invalide");

    if (user.tokenExpireAt && user.tokenExpireAt < new Date()) {
      throw new BadRequestException("Token expiré");
    }

    if (user.motDePasseHash) {
      throw new BadRequestException(
        "Ce compte est déjà activé. Vous pouvez vous connecter.",
      );
    }

    const hash = await bcrypt.hash(dto.motDePasse, 10);

    await this.usersService.update(user.id, {
      motDePasseHash: hash,
      emailVerifie: true,
      tokenActivation: null,
      tokenExpireAt: null,
    });

    return {
      message:
        "Mot de passe créé. Vous pouvez maintenant vous connecter avec votre email.",
      email: user.email,
      role: user.role,
    };
  }

  /* ============================================
     ENVOYER L'EMAIL D'ACTIVATION 
     ============================================ */
  async envoyerEmailActivation(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    // Si pas de token ou token expiré → régénérer
    if (!user.tokenActivation || (user.tokenExpireAt && user.tokenExpireAt < new Date())) {
      const tokenActivation = crypto.randomBytes(32).toString("hex");
      const tokenExpireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.usersService.update(user.id, {
        tokenActivation,
        tokenExpireAt,
      });
      user.tokenActivation = tokenActivation;
    }

    const frontendUrl = this.config.get("FRONTEND_URL", "http://localhost:3000");
    const lienActivation = `${frontendUrl}/activation?token=${user.tokenActivation}`;

    const roleLabel =
      user.role === "MENTOR"
        ? "Mentor"
        : user.role === "DIRIGEANT"
          ? "Dirigeant de PME"
          : user.role;

    try {
      await this.mailService.sendActivationEmail(
        user.email,
        `${user.prenom} ${user.nom}`,
        roleLabel,
        lienActivation,
      );
      this.logger.log(` Email d'activation envoyé à ${user.email}`);
    } catch (err) {
      this.logger.error(` Erreur envoi email activation ${user.email}:`, err);
      // ✅ On log l'erreur mais on ne bloque plus la validation de l'admin
      return { 
        message: `Compte validé, mais l'email n'a pas pu être envoyé (problème serveur SMTP). L'utilisateur devra demander un renvoi.`,
        warning: true 
      };
    }

    return { message: `Email d'activation envoyé à ${user.email}` };
  }

  /* ============================================
     MOT DE PASSE OUBLIÉ
     ============================================ */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return {
        message:
          "Si cet email existe, un lien de réinitialisation a été envoyé.",
      };
    }

    const tokenReset = crypto.randomBytes(32).toString("hex");
    await this.usersService.update(user.id, { tokenReset });

    const frontendUrl = this.config.get("FRONTEND_URL", "http://localhost:3000");
    const lienReset = `${frontendUrl}/reset-password?token=${tokenReset}`;

    try {
      await this.mailService.sendResetPasswordEmail(
        user.email,
        `${user.prenom} ${user.nom}`,
        lienReset,
      );
    } catch (err) {
      this.logger.error("Erreur envoi email reset:", err);
    }

    return {
      message:
        "Si cet email existe, un lien de réinitialisation a été envoyé.",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);
    if (!user) throw new BadRequestException("Token invalide");

    const hash = await bcrypt.hash(dto.nouveauMotDePasse, 10);

    await this.usersService.update(user.id, {
      motDePasseHash: hash,
      tokenReset: null,
    });

    return { message: "Mot de passe réinitialisé avec succès." };
  }

  async getMe(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException("Utilisateur introuvable");
    const { motDePasseHash, tokenActivation, tokenReset, ...rest } = user;
    return rest;
  }
}