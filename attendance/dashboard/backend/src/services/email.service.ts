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

  async sendWelcomeEmail(email: string, prenom: string, password: string, pin?: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Bienvenue sur Attendance — Vos identifiants de connexion',
      text: `Bonjour ${prenom || 'nouvel employé'},

Votre compte a été créé sur l'application Attendance.

Voici vos informations de connexion :

Tableau de bord :
  Email : ${email}
  Mot de passe : ${password}

Application mobile :
  Email : ${email}
  Code PIN : ${pin || 'à définir'}

Nous vous recommandons de modifier votre mot de passe dès votre première connexion.
Pour des raisons de sécurité, ne partagez jamais vos identifiants.

L'équipe Attendance`,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Attendance — Réinitialisation de votre mot de passe',
      text: `Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe.

Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable 15 minutes) :
${resetLink}

Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.

L'équipe Attendance`,
    });
  }
}
