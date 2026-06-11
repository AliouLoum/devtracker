import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'votre.email@gmail.com',
        pass: process.env.EMAIL_PASS || 'votre_mot_de_passe_d_application',
      },
    });
  }

  async sendDailyReport(to: string, highPriorityTasks: any[]) {
    const subject = `🚀 Ton récapitulatif DevTracker - Tâches Prioritaires !`;

    const highPriorityList = highPriorityTasks.length > 0
      ? highPriorityTasks.map(t => `<li>🔴 <strong>${t.title}</strong> (Échéance: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Aucune'})</li>`).join('')
      : '<li>Aucune tâche urgente pour le moment.</li>';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #4F46E5;">Bonjour Alioune ! 👋</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Voici la liste de tes tâches prioritaires du jour. Ce sont les tâches les plus importantes sur lesquelles tu dois te concentrer ! Ne lâche rien ! 💪
        </p>

        <h3 style="color: #E11D48; border-bottom: 2px solid #E11D48; padding-bottom: 4px;">🚨 Tes Tâches Prioritaires</h3>
        <ul>
          ${highPriorityList}
        </ul>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; text-align: center;">
          <p>Envoyé avec ❤️ par DevTracker</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"DevTracker" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email report sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
    }
  }
}
