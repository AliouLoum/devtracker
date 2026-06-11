import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initTransporter();
  }

  private initTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST', 'localhost');
    const port = this.configService.get<number>('EMAIL_PORT', 1025);
    const user = this.configService.get<string>('EMAIL_USER', '');
    const pass = this.configService.get<string>('EMAIL_PASS', '');

    const config: any = {
      host,
      port,
      secure: port === 465,
    };

    if (user && pass) {
      config.auth = { user, pass };
    }

    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail(to: string, subject: string, htmlContent: string) {
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'DevTracker <noreply@devtracker.local>',
    );

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      this.logger.log(`Email sent successfully to ${to}: ${subject}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  /**
   * 1. Email Daily Briefing
   */
  async sendDailyBriefing(
    toEmail: string,
    userName: string,
    todayTasks: any[],
    overdueTasks: any[],
  ) {
    const todayStr = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const todayRows = todayTasks.length > 0
      ? todayTasks
          .map(
            (t) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-weight: 500; font-size: 14px;">${t.title}</td>
          <td style="padding: 12px; font-size: 13px;"><span style="background-color: ${t.projectColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${t.projectName}</span></td>
          <td style="padding: 12px; font-size: 13px; text-transform: uppercase; font-weight: bold; color: ${
            t.priority === 'high' ? '#e53e3e' : t.priority === 'medium' ? '#dd6b20' : '#3182ce'
          };">${t.priority}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #a0aec0; font-size: 14px;">Aucune tâche planifiée aujourd'hui. Profites-en ! 🙌</td></tr>`;

    const overdueRows = overdueTasks.length > 0
      ? overdueTasks
          .map(
            (t) => `
        <tr style="border-bottom: 1px solid #fee2e2; background-color: #fff5f5;">
          <td style="padding: 12px; font-weight: 500; font-size: 14px; color: #9b2c2c;">⚠️ ${t.title}</td>
          <td style="padding: 12px; font-size: 13px;"><span style="background-color: ${t.projectColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${t.projectName}</span></td>
          <td style="padding: 12px; font-size: 13px; font-weight: 500; color: #e53e3e;">Dépassé le ${t.dueDate}</td>
        </tr>`,
          )
          .join('')
      : `<tr><td colspan="3" style="padding: 16px; text-align: center; color: #38a169; font-size: 14px;">Super ! Aucune tâche en retard. 🎉</td></tr>`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>☀️ Ton briefing du jour - DevTracker</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7fafc; color: #2d3748; margin: 0; padding: 40px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 32px;">
        <tr>
          <td>
            <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1a202c;">DevTracker</h2>
            <p style="margin: 0 0 24px 0; color: #718096; font-size: 14px;">${todayStr}</p>
            
            <p style="font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">Bonjour <strong>${userName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; margin: 0 0 24px 0; color: #4a5568;">Voici ton briefing matinal. Reste concentré et accomplis tes objectifs pas à pas !</p>
            
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #3182ce; padding-bottom: 6px; margin: 32px 0 16px 0; color: #2b6cb0;">☀️ Tâches d'aujourd'hui (${todayTasks.length})</h3>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #edf2f7; text-align: left; font-size: 12px; text-transform: uppercase; color: #4a5568;">
                  <th style="padding: 10px 12px;">Tâche</th>
                  <th style="padding: 10px 12px;">Projet</th>
                  <th style="padding: 10px 12px;">Priorité</th>
                </tr>
              </thead>
              <tbody>
                ${todayRows}
              </tbody>
            </table>

            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #e53e3e; padding-bottom: 6px; margin: 32px 0 16px 0; color: #c53030;">🔴 Tâches en retard (${overdueTasks.length})</h3>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 32px;">
              <thead>
                <tr style="background-color: #fee2e2; text-align: left; font-size: 12px; text-transform: uppercase; color: #9b2c2c;">
                  <th style="padding: 10px 12px;">Tâche en retard</th>
                  <th style="padding: 10px 12px;">Projet</th>
                  <th style="padding: 10px 12px;">Échéance</th>
                </tr>
              </thead>
              <tbody>
                ${overdueRows}
              </tbody>
            </table>

            <div style="text-align: center; margin: 40px 0 20px 0;">
              <a href="http://localhost:4200" style="background-color: #1a202c; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 4px; font-size: 14px; display: inline-block;">Ouvrir DevTracker</a>
            </div>
            
            <p style="margin: 32px 0 0 0; padding-top: 16px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0; text-align: center;">
              Envoyé automatiquement par DevTracker. Tu peux configurer tes préférences de notification dans la page Paramètres.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await this.sendMail(toEmail, `☀️ Briefing du jour — DevTracker`, html);
  }

  /**
   * 2. Email Reminder
   */
  async sendTaskReminder(
    toEmail: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    dueDate: string,
    notes: string,
  ) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>⏰ Rappel de Tâche — ${projectName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7fafc; color: #2d3748; margin: 0; padding: 40px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="550" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 32px;">
        <tr>
          <td>
            <div style="text-transform: uppercase; font-size: 11px; font-weight: bold; color: #718096; margin-bottom: 8px;">DevTracker Rappel</div>
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #1a202c;">⏰ C'est l'heure de ta tâche !</h2>
            
            <p style="font-size: 15px; margin: 0 0 24px 0;">Bonjour <strong>${userName}</strong>,</p>
            
            <div style="border-left: 4px solid #1a202c; background-color: #f7fafc; padding: 20px; margin-bottom: 24px;">
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #2d3748;">${taskTitle}</div>
              <div style="font-size: 13px; color: #4a5568; margin-bottom: 12px;">Projet : <strong>${projectName}</strong> | Échéance : ${dueDate || 'Aujourd\'hui'}</div>
              <div style="font-size: 14px; line-height: 1.5; color: #718096; white-space: pre-wrap;">${notes || 'Aucune note descriptive sur cette tâche.'}</div>
            </div>

            <div style="text-align: center; margin: 32px 0 16px 0;">
              <a href="http://localhost:4200" style="background-color: #1a202c; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 4px; font-size: 13px; display: inline-block;">Accéder à la tâche</a>
            </div>
            
            <p style="margin-top: 32px; font-size: 11px; color: #a0aec0; text-align: center; border-top: 1px solid #edf2f7; padding-top: 16px;">
              DevTracker Inc. · Travaillez intelligemment, automatisez le reste.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await this.sendMail(toEmail, `⏰ Rappel : ${taskTitle} (${projectName})`, html);
  }

  /**
   * 3. Email Weekly Report
   */
  async sendWeeklyReport(
    toEmail: string,
    userName: string,
    completedTasks: any[],
    projectProgress: Array<{ name: string; progress: number }>,
    pendingTasks: any[],
  ) {
    const completedList = completedTasks.length > 0
      ? completedTasks.map(t => `<li style="margin-bottom: 8px; font-size: 14px;"><strong>${t.projectName}</strong> : ${t.title}</li>`).join('')
      : `<li style="font-size: 14px; color: #a0aec0;">Aucune tâche complétée cette semaine. On fera mieux la semaine prochaine ! 💪</li>`;

    const pendingList = pendingTasks.length > 0
      ? pendingTasks.map(t => `<li style="margin-bottom: 8px; font-size: 14px; color: #4a5568;"><strong>${t.projectName}</strong> : ${t.title}</li>`).join('')
      : `<li style="font-size: 14px; color: #a0aec0;">Incroyable ! Aucune tâche en attente pour la semaine prochaine. 🌟</li>`;

    const progressRows = projectProgress.length > 0
      ? projectProgress
          .map((p) => {
            const filledCount = Math.round(p.progress / 10);
            const emptyCount = 10 - filledCount;
            const asciiBar = '█'.repeat(filledCount) + '░'.repeat(emptyCount);
            return `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 500; margin-bottom: 4px;">
            <span>${p.name}</span>
            <span style="font-family: monospace; font-weight: bold; color: #4a5568;">${p.progress}%</span>
          </div>
          <div style="font-family: monospace; font-size: 16px; letter-spacing: 2px; color: #2d3748;">
            ${asciiBar}
          </div>
        </div>`;
          })
          .join('')
      : `<p style="font-size: 14px; color: #a0aec0;">Aucun projet actif en cours d'avancement.</p>`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>📊 Revue hebdomadaire - DevTracker</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7fafc; color: #2d3748; margin: 0; padding: 40px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 32px;">
        <tr>
          <td>
            <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; text-transform: uppercase; color: #1a202c;">DevTracker</h2>
            <p style="margin: 0 0 24px 0; color: #718096; font-size: 13px;">📊 Revue hebdomadaire de tes performances</p>
            
            <p style="font-size: 16px; margin: 0 0 24px 0;">Bonjour <strong>${userName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; color: #4a5568; margin-bottom: 32px;">
              Une autre semaine s'achève ! Voici un récapitulatif complet de tes accomplissements sur DevTracker et de l'état de tes projets.
            </p>

            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a202c; padding-bottom: 6px; color: #1a202c; margin-bottom: 16px;">📈 Avancement des Projets (Barre ASCII)</h3>
            <div style="background-color: #f7fafc; border: 1px solid #edf2f7; padding: 20px; border-radius: 4px; margin-bottom: 32px;">
              ${progressRows}
            </div>

            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #38a169; padding-bottom: 6px; color: #2f855a; margin-bottom: 16px;">✅ Complété cette semaine (${completedTasks.length})</h3>
            <ul style="margin: 0 0 32px 0; padding-left: 20px; line-height: 1.6;">
              ${completedList}
            </ul>

            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #dd6b20; padding-bottom: 6px; color: #c05621; margin-bottom: 16px;">⏳ À faire la semaine prochaine (${pendingTasks.length})</h3>
            <ul style="margin: 0 0 32px 0; padding-left: 20px; line-height: 1.6;">
              ${pendingList}
            </ul>

            <div style="text-align: center; margin: 40px 0 10px 0;">
              <a href="http://localhost:4200" style="background-color: #1a202c; color: #ffffff; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 4px; font-size: 14px; display: inline-block;">Aller sur mon Dashboard</a>
            </div>
            
            <p style="margin-top: 40px; font-size: 11px; color: #a0aec0; text-align: center; border-top: 1px solid #edf2f7; padding-top: 16px;">
              Rapport dominical généré par DevTracker local. Reste régulier pour bâtir des habitudes solides.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await this.sendMail(toEmail, `📊 Revue hebdomadaire — DevTracker`, html);
  }

  /**
   * 4. Email Milestone
   */
  async sendMilestoneReached(
    toEmail: string,
    userName: string,
    projectName: string,
    percent: number,
    nextTasks: string[],
  ) {
    const nextList = nextTasks.length > 0
      ? nextTasks.map(t => `<li style="margin-bottom: 6px; font-size: 14px;">${t}</li>`).join('')
      : `<li style="font-size: 14px; color: #a0aec0;">Aucune tâche restante. Projet entièrement terminé ! 🏁</li>`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>🎯 Milestone Franchi ! — ${projectName}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7fafc; color: #2d3748; margin: 0; padding: 40px 0;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="550" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 32px;">
        <tr>
          <td style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 16px;">🎯</div>
            <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #2b6cb0;">Milestone Atteint !</h2>
            <p style="margin: 0 0 24px 0; color: #718096; font-size: 15px;">Le projet <strong>${projectName}</strong> progresse à grands pas !</p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="font-size: 15px; margin: 0 0 20px 0;">Félicitations <strong>${userName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; color: #4a5568; margin-bottom: 24px;">
              Tu as franchi un jalon crucial ! Ton projet <strong>${projectName}</strong> vient d'atteindre le cap symbolique des <strong>${percent}%</strong> de complétion !
            </p>

            <div style="background-color: #ebf8ff; border: 1px solid #bee3f8; border-radius: 4px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <span style="font-size: 14px; font-weight: bold; color: #2b6cb0;">📊 Barre de Progression :</span>
              <div style="font-family: monospace; font-size: 18px; letter-spacing: 1px; color: #2b6cb0; margin-top: 8px;">
                ${'█'.repeat(Math.round(percent / 10))}${'░'.repeat(10 - Math.round(percent / 10))} ${percent}%
              </div>
            </div>

            <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #bee3f8; padding-bottom: 6px; color: #2b6cb0; margin-bottom: 12px;">🚀 Prochaines étapes suggérées :</h3>
            <ul style="margin: 0 0 32px 0; padding-left: 20px; line-height: 1.6; color: #4a5568;">
              ${nextList}
            </ul>

            <div style="text-align: center; margin: 24px 0 0 0;">
              <a href="http://localhost:4200" style="background-color: #2b6cb0; color: #ffffff; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 4px; font-size: 13px; display: inline-block;">Continuer sur DevTracker</a>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await this.sendMail(
      toEmail,
      `🎯 Milestone franchi : ${projectName} est à ${percent}% !`,
      html,
    );
  }
}
