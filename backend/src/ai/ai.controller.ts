import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { aiConfig } from './ai.config';
import { ProjectsService } from '../projects/projects.service';

interface AuthRequest {
  user: { userId: string };
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('breakdown')
  async breakdown(@Body() body: { text: string }) {
    const systemPrompt = `Tu es un assistant de gestion de projet expert. 
Quand l'utilisateur décrit une tâche, tu la décomposes en sous-tâches 
concrètes et actionnables. Réponds UNIQUEMENT en JSON valide avec ce format :
{ "tasks": [{ "title": "", "notes": "", "estimatedHours": 0, "priority": "high|medium|low", "suggestedDaysFromNow": 0 }] }`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: body.text },
    ];

    let fullText = '';
    await this.aiService.generateCompletionStream(
      aiConfig.defaultModel,
      messages,
      0.3,
      (token) => {
        fullText += token;
      },
    );

    try {
      return JSON.parse(fullText);
    } catch (e) {
      // If parsing failed or has extra tokens, attempt to extract JSON block
      const startJson = fullText.indexOf('{');
      const endJson = fullText.lastIndexOf('}');
      if (startJson !== -1 && endJson !== -1) {
        try {
          return JSON.parse(fullText.slice(startJson, endJson + 1));
        } catch (innerError) {
          // ignore
        }
      }
      return { tasks: [] };
    }
  }

  @Post('plan-day')
  async planDay(
    @Req() req: AuthRequest,
    @Body() body: { tasks: string[]; freeHours: number },
  ) {
    const context = await this.aiService.buildSystemContext(req.user.userId);
    const systemPrompt = `${context}\nTu es un assistant spécialisé dans l'organisation du temps quotidien. 
Planifie la journée de l'utilisateur avec ses tâches et ses heures libres. Organise un planning heure par heure en tenant compte de son énergie cognitive (tâches difficiles le matin, légères l'après-midi). Réponds en Markdown clair avec des emojis.`;

    const userMessage = `Voici mes tâches disponibles :\n${body.tasks.map(t => `- ${t}`).join('\n')}\nJ'ai ${body.freeHours} heures libres aujourd'hui. Optimise mon planning.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let fullText = '';
    await this.aiService.generateCompletionStream(
      aiConfig.defaultModel,
      messages,
      0.7,
      (token) => {
        fullText += token;
      },
    );
    return { plan: fullText };
  }

  @Post('health-check')
  async healthCheck(
    @Req() req: AuthRequest,
    @Body() body: { projectId: string },
  ) {
    const project = await this.projectsService.findOneForUser(req.user.userId, body.projectId);
    
    const systemPrompt = `Tu es un assistant expert en audit de projet et en agilité.
Analyse les métriques du projet de l'utilisateur et génère un rapport narratif court avec des recommandations concrètes pour le remettre sur les rails si nécessaire.`;

    const userMessage = `Projet : "${project.name}" (Description : ${project.description})
Métriques :
- Progression globale : ${project.progress}%
- Nombre de tâches complétées : ${project.doneTasks} sur ${project.totalTasks} au total.
- Date de début : ${project.startDate || 'Non définie'}
- Date limite (Date de fin) : ${project.endDate || 'Non définie'}
- Heures allouées par semaine : ${project.hoursPerWeek || 'Non définies'}
- Durée totale estimée : ${project.estimatedWeeks || 'Non définie'} semaines.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let fullText = '';
    await this.aiService.generateCompletionStream(
      aiConfig.defaultModel,
      messages,
      0.5,
      (token) => {
        fullText += token;
      },
    );
    return { report: fullText };
  }

  @Post('enhance-notes')
  async enhanceNotes(@Body() body: { notes: string }) {
    const systemPrompt = `Tu es un assistant de rédaction technique expert.
Prends les notes brèves de l'utilisateur sur sa tâche et reformule-les en une documentation de code extrêmement claire, structurée et professionnelle. Si c'est pertinent, ajoute des exemples de code TypeScript/JavaScript propres.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: body.notes },
    ];

    let fullText = '';
    // Use NVIDIA Nemotron model specifically for code enhancement
    await this.aiService.generateCompletionStream(
      aiConfig.codeModel,
      messages,
      0.4,
      (token) => {
        fullText += token;
      },
    );
    return { enhancedNotes: fullText };
  }

  @Post('chat')
  async chat(@Req() req: AuthRequest, @Body() body: { message: string; history?: any[] }) {
    const systemContext = await this.aiService.buildSystemContext(req.user.userId);
    
    const messages = [
      { role: 'system', content: systemContext },
      ...(body.history || []).map((msg) => ({
        role: msg.role || (msg.isUser ? 'user' : 'assistant'),
        content: msg.content,
      })),
      { role: 'user', content: body.message },
    ];

    let fullText = '';
    await this.aiService.generateCompletionStream(
      aiConfig.defaultModel,
      messages,
      0.7,
      (token) => {
        fullText += token;
      },
    );
    return { response: fullText };
  }
}
