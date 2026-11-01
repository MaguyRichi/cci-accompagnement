import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST', 'smtp.gmail.com'),
      port: parseInt(this.config.get('MAIL_PORT', '587'), 10),
      secure: this.config.get('MAIL_SECURE') === 'true',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASSWORD'),
      },
    });
  }

  /* ============================================
     TEMPLATE HTML GÉNÉRIQUE
     ============================================ */
  private htmlTemplate(
    titre: string,
    contenu: string,
    boutonTexte?: string,
    boutonLien?: string,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f8fa; padding: 20px;">
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #1e40af; font-size: 22px; margin: 0;">CCI Haute Matsiatra</h1>
            <p style="color: #888; font-size: 13px; margin: 4px 0 0 0;">Plateforme d'accompagnement des PME</p>
          </div>
          <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 16px 0;">${titre}</h2>
          <div style="color: #333; font-size: 15px; line-height: 1.6;">
            ${contenu}
          </div>
          ${
            boutonTexte && boutonLien
              ? `
            <div style="text-align: center; margin: 32px 0 16px 0;">
              <a href="${boutonLien}" style="background: #1e40af; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">${boutonTexte}</a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin: 8px 0 0 0;">
              Si le bouton ne fonctionne pas, copiez ce lien :<br>
              <span style="color: #1e40af; word-break: break-all;">${boutonLien}</span>
            </p>
          `
              : ''
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 16px 0;" />
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Cet email est automatique, merci de ne pas y répondre.<br>
            © CCI Haute Matsiatra — Matsiatra Ambony
          </p>
        </div>
      </div>
    `;
  }

  /* ============================================
     EMAIL D'ACTIVATION DE COMPTE
     ============================================ */
  async sendActivationEmail(
    email: string,
    nomComplet: string,
    roleLabel: string,
    lienActivation: string,
  ) {
    const sujet = 'Activez votre compte — CCI Haute Matsiatra';

    const contenu = `
      <p>Bonjour <strong>${nomComplet}</strong>,</p>
      <p>Votre dossier en tant que <strong>${roleLabel}</strong> a été <strong>validé par la CCI Haute Matsiatra</strong>.</p>
      <p>Il ne vous reste plus qu'à créer votre mot de passe pour accéder à votre espace personnel.</p>
      <p style="color: #666; font-size: 13px;">Ce lien est valable 7 jours.</p>
    `;

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to: email,
      subject: sujet,
      html: this.htmlTemplate(sujet, contenu, 'Créer mon mot de passe', lienActivation),
    });

    this.logger.log(`✅ Email activation envoyé à ${email}`);
  }

  /* ============================================
     EMAIL DE NOTIFICATION GÉNÉRIQUE
     ============================================ */
  async sendNotificationEmail(
    to: string,
    sujet: string,
    message: string,
    lien?: string,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000');
    const lienComplet = lien ? `${frontendUrl}${lien}` : undefined;

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to,
      subject: sujet,
      html: this.htmlTemplate(sujet, `<p>${message}</p>`, lien ? 'Voir' : undefined, lienComplet),
    });

    this.logger.log(`✅ Email notification envoyé à ${to}`);
  }

  /* ============================================
     EMAIL DE RÉINITIALISATION DE MOT DE PASSE
     ============================================ */
  async sendResetPasswordEmail(
    email: string,
    nomComplet: string,
    lienReset: string,
  ) {
    const sujet = 'Réinitialisation de votre mot de passe — CCI Haute Matsiatra';

    const contenu = `
      <p>Bonjour <strong>${nomComplet}</strong>,</p>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.</p>
      <p style="color: #666; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `;

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM'),
      to: email,
      subject: sujet,
      html: this.htmlTemplate(sujet, contenu, 'Réinitialiser mon mot de passe', lienReset),
    });

    this.logger.log(`✅ Email reset envoyé à ${email}`);
  }
}