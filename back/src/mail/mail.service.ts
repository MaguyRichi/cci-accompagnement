import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {
    // ✅ On force le typage avec "as any" pour accepter le paramètre "family" (IPv4)
    // qui n'est pas reconnu par défaut dans les types TypeScript de Nodemailer.
    const transporterOptions: any = {
      host: this.config.get("MAIL_HOST", "smtp.gmail.com"),
      port: Number(this.config.get("MAIL_PORT", 465)),
      secure: true, // true pour le port 465 (SSL direct)
      auth: {
        user: this.config.get("MAIL_USER"),
        pass: this.config.get("MAIL_PASSWORD"),
      },
      family: 4, // ✅ Force l'utilisation d'IPv4 (contourne l'erreur ENETUNREACH d'IPv6 sur Render)
      connectionTimeout: 10000, // Timeout de 10s pour éviter de bloquer le serveur indéfiniment
      tls: {
        rejectUnauthorized: false, // Souvent nécessaire sur les environnements cloud (Render)
      },
    };

    this.transporter = nodemailer.createTransport(transporterOptions);
  }

  async sendActivationEmail(
    to: string,
    nomComplet: string,
    role: string,
    lienActivation: string,
  ) {
    try {
      const mailOptions = {
        from: `"CCI Haute Matsiatra" <${this.config.get("MAIL_FROM")}>`,
        to,
        subject: "Activation de votre compte - CCI Haute Matsiatra",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #1e3a5f; text-align: center;">Bienvenue sur la plateforme CCI</h2>
            <p>Bonjour <strong>${nomComplet}</strong>,</p>
            <p>Votre demande d'inscription en tant que <strong>${role}</strong> a été validée par l'administration.</p>
            <p>Pour activer votre compte et créer votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${lienActivation}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Créer mon mot de passe</a>
            </div>
            <p style="font-size: 12px; color: #666;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${lienActivation}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">CCI Haute Matsiatra - Plateforme d'accompagnement des PME</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email d'activation envoyé à ${to}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi d'email d'activation à ${to}`, error);
      throw error;
    }
  }

  async sendResetPasswordEmail(
    to: string,
    nomComplet: string,
    lienReset: string,
  ) {
    try {
      const mailOptions = {
        from: `"CCI Haute Matsiatra" <${this.config.get("MAIL_FROM")}>`,
        to,
        subject: "Réinitialisation de votre mot de passe - CCI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #1e3a5f; text-align: center;">Réinitialisation de mot de passe</h2>
            <p>Bonjour <strong>${nomComplet}</strong>,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour en créer un nouveau :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${lienReset}" style="background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
            </div>
            <p style="font-size: 12px; color: #666;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de reset envoyé à ${to}`);
    } catch (error) {
      this.logger.error(`Erreur d'envoi d'email reset à ${to}`, error);
      throw error;
    }
  }
}