import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
    return this.transporter;
  }

  async send(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Attendance" <noreply@attendance.company.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
      });
      this.logger.log(`Email envoyé à ${options.to} — ${options.subject}`);
      return true;
    } catch (err) {
      this.logger.warn(`Échec envoi email à ${options.to}: ${(err as Error).message}`);
      this.logger.log(`[FALLBACK] Email simulé — À: ${options.to} | Sujet: ${options.subject}`);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, prenom: string, password: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Bienvenue sur Attendance — Vos identifiants de connexion',
      text: `Bonjour ${prenom || 'nouvel employé'},

Votre compte a été créé sur l'application Attendance.

Voici vos identifiants de connexion :
  Email : ${email}
  Mot de passe : ${password}

Nous vous recommandons de modifier votre mot de passe dès votre première connexion.
Pour des raisons de sécurité, ne partagez jamais vos identifiants.

L'équipe Attendance`,
    });
  }

  async sendPasswordResetEmail(email: string, newPassword: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Attendance — Réinitialisation de votre mot de passe',
      text: `Bonjour,

Votre mot de passe a été réinitialisé.

Votre nouveau mot de passe est : ${newPassword}

Nous vous recommandons de le modifier dès votre prochaine connexion.

L'équipe Attendance`,
    });
  }
}
