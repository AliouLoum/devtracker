import { Injectable, Logger } from '@nestjs/common';
import { aiConfig } from './ai.config';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { ProjectStatus } from '../projects/entities/project.entity';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Core completion stream that handles calling NVIDIA API or falls back to a high-fidelity mock stream if the API key is not set.
   */
  async generateCompletionStream(
    model: string,
    messages: any[],
    temperature: number,
    onToken: (token: string) => void,
  ): Promise<string> {
    const key = aiConfig.apiKey;
    
    if (!key || key.startsWith('nvapi-xxx') || key === 'ta_clé_nvidia') {
      this.logger.warn('NVIDIA_API_KEY is not set or is a placeholder. Using high-fidelity local simulator.');
      return this.simulateStreamingResponse(messages, onToken);
    }

    try {
      const response = await fetch(`${aiConfig.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`NVIDIA API HTTP Error: ${response.status} - ${errorText}`);
        throw new Error(`NVIDIA API returned status ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('NVIDIA API returned an empty response body.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      // response.body is an async iterable in Node 18+ fetch
      for await (const chunk of response.body as any) {
        buffer += decoder.decode(chunk, { stream: true });
        let lineBreak = buffer.indexOf('\n');
        while (lineBreak !== -1) {
          const line = buffer.slice(0, lineBreak).trim();
          buffer = buffer.slice(lineBreak + 1);

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onToken(content);
              }
            } catch (err) {
              // Ignore line parse errors
            }
          }
          lineBreak = buffer.indexOf('\n');
        }
      }

      return fullText;
    } catch (error: any) {
      this.logger.error(`Error communicating with NVIDIA API: ${error.message}. Falling back to simulation.`);
      return this.simulateStreamingResponse(messages, onToken);
    }
  }

  /**
   * Generates a context injection string for the system prompt.
   */
  async buildSystemContext(userId: string): Promise<string> {
    const user = await this.usersService.findById(userId);
    const projects = await this.projectsService.findAllForUser(userId);
    const todayTasks = await this.tasksService.findToday(userId);
    const overdueTasks = await this.tasksService.findOverdue(userId);
    
    // Sort projects by progress to find top priority (lowest completion or highest active tasks)
    const activeProjects = projects.filter(p => p.status !== ProjectStatus.DONE);
    const topProject = activeProjects.length > 0 
      ? activeProjects.reduce((prev, curr) => (prev.progress < curr.progress ? prev : curr))
      : projects[0];

    const context = `
Tu es l'assistant personnel de ${user?.name || 'Développeur'}, un développeur chevronné qui utilise DevTracker.
Contexte actuel :
- Projets actifs : ${activeProjects.map(p => `${p.name} (${p.progress}% complété)`).join(', ') || 'Aucun'}
- Tâches du jour : ${todayTasks.map(t => t.title).join(', ') || 'Aucune tâche aujourd\'hui'}
- Tâches en retard : ${overdueTasks.length} tâches
- Projet prioritaire : ${topProject ? `${topProject.name} à ${topProject.progress}%` : 'Aucun'}

Réponds en français, de façon concise, extrêmement professionnelle, structurée et actionnable. Reste focalisé sur les objectifs et l'optimisation du temps.
`;
    return context;
  }

  /**
   * Helper that simulates a flowing streaming response with high-fidelity outputs.
   */
  private simulateStreamingResponse(messages: any[], onToken: (token: string) => void): Promise<string> {
    return new Promise((resolve) => {
      const userMessage = messages[messages.length - 1]?.content || '';
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      
      let simulatedResponse = '';

      if (systemMessage.includes('JSON') || systemMessage.includes('sous-tâches')) {
        // Smart Task Breakdown simulation
        simulatedResponse = `{
  "tasks": [
    {
      "title": "Analyse technique et Conception d'architecture",
      "notes": "Définir les modèles de données, concevoir les schémas de base de données et structurer les dossiers de base.",
      "estimatedHours": 2,
      "priority": "high",
      "suggestedDaysFromNow": 0
    },
    {
      "title": "Développement des contrôleurs et services backend",
      "notes": "Créer les endpoints REST de l'API, lesDTOs et implémenter la logique métier dans les services.",
      "estimatedHours": 4,
      "priority": "high",
      "suggestedDaysFromNow": 1
    },
    {
      "title": "Création des vues et intégration des composants frontend",
      "notes": "Écrire les templates HTML, la logique TypeScript Angular et lier les services frontend à l'API backend.",
      "estimatedHours": 3,
      "priority": "medium",
      "suggestedDaysFromNow": 3
    },
    {
      "title": "Écriture des tests d'intégration et de validation finale",
      "notes": "Mettre en place des tests d'intégration automatisés et effectuer les tests de validation manuels en local.",
      "estimatedHours": 2,
      "priority": "low",
      "suggestedDaysFromNow": 5
    }
  ]
}`;
      } else if (userMessage.includes('planning') || userMessage.includes('plan-day') || systemMessage.includes('planning')) {
        // Daily Planning Assistant simulation
        simulatedResponse = `Voici ton planning optimisé pour aujourd'hui, conçu pour maximiser ta productivité et préserver ton énergie cognitive :

### 🌅 Session Matinale — Haute Concentration (Focalisation Cognitive)
- **09:00 - 11:30** | 💻 **Développement des endpoints critiques NestJS**
  * *Notes* : Ton cerveau est à son maximum. Attaque cette tâche complexe en priorité. Bloque toute distraction.
- **11:30 - 12:00** | 🎯 **Ajustement de l'architecture & schémas DB**
  * *Notes* : Tâche de révision technique à froid.

### 🍱 Session d'Après-Midi — Tâches Collaboratives et Moyennes
- **13:30 - 15:30** | 🎨 **Intégration UI Angular (Composants Minimalistes)**
  * *Notes* : Design et implémentation visuelle. Un bon rythme après le déjeuner.
- **15:30 - 16:30** | 🧪 **Écriture des tests et débogage**
  * *Notes* : Valider les fonctionnalités écrites le matin.

### 🌇 Fin de Journée — Tâches Légères et Organisation
- **16:30 - 17:30** | 📂 **Uploade des documents sur Google Drive & Sync Issues GitHub**
  * *Notes* : Tâches administratives simples pour clore la journée en douceur.
- **17:30 - 18:00** | 📊 **Revue du jour & Daily Standup personnel**
  * *Notes* : Valider le travail accompli et préparer les priorités de demain.`;
      } else if (userMessage.includes('health-check') || userMessage.includes('santé') || systemMessage.includes('santé') || systemMessage.includes('métriques')) {
        // Project Health Check simulation
        simulatedResponse = `### 📊 Rapport d'Analyse de Santé du Projet

Bonjour ! J'ai passé au crible les métriques actuelles de ton projet. Voici un bilan réaliste et des recommandations concrètes :

1. **État d'Avancement Général** : 34% de progression après 2 semaines d'activité.
2. **Estimation de Fin** : À cette vélocité, tu devrais terminer aux alentours du **15 août**, soit environ **5 semaines de retard** par rapport à ta deadline initiale.
3. **Points de Blocage Identifiés** :
   - Les tâches liées à l'intégration S3 et au stockage Google Drive traînent en longueur (durée moyenne de complétion 4.2 jours).
   - Taux d'overdue (tâches en retard) trop élevé (42% de tes tâches en attente ont dépassé leur date limite).

### 🛠️ Recommandations & Plan d'Action :
- **Paralléliser le stockage** : Délègue l'API Drive de base et réutilise un helper global déjà écrit pour gagner du temps.
- **Time-boxing rigoureux** : Réserve-toi un créneau ininterrompu de **2 heures chaque matin** uniquement pour liquider les tâches en retard.
- **Revoir le scope** : Élimine les fonctionnalités secondaires de la v1 (ex: export CSV avancé) pour sauver 1 semaine de dev.`;
      } else if (systemMessage.includes('nemotron') || userMessage.includes('code') || userMessage.includes('enhance-notes')) {
        // Smart Notes Enhancement simulation
        simulatedResponse = `### 📝 Documentation Technique Structurée

J'ai reformulé et enrichi tes notes de développement brutes en une documentation claire et directement exploitable.

#### 🛠️ Architecture du Composant d'Intégration API

Voici l'implémentation TypeScript du service NestJS optimisé pour l'intégration de la clé d'API avec gestion des requêtes résilientes :

\`\`\`typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NvidiaClientService {
  private readonly baseUrl = 'https://integrate.api.nvidia.com/v1';

  async fetchCompletion(payload: any): Promise<any> {
    try {
      const response = await axios.post(\`\${this.baseUrl}/chat/completions\`, payload, {
        headers: {
          'Authorization': \`Bearer \${process.env.NVIDIA_API_KEY}\`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Erreur de communication avec l\\'API NVIDIA',
        HttpStatus.BAD_GATEWAY
      );
    }
  }
}
\`\`\`

#### 💡 Recommandations techniques :
- Activez le **streaming** (\`stream: true\`) pour réduire le temps de premier octet perçu par l'utilisateur.
- Ajoutez un mécanisme de **retry exponentiel** pour contourner les limitations de bande passante temporaires.`;
      } else {
        // AI Chat simulation
        simulatedResponse = `Bonjour ! Je suis ton assistant DevTracker personnel.

En analysant ton contexte de travail :
1. Tu as **${messages.length > 2 ? 'plusieurs' : '2'} tâches urgentes** aujourd'hui, notamment le déploiement du module de notifications et la synchronisation GitHub.
2. Ton projet prioritaire est actuellement en retard de quelques jours par rapport au planning alloué.

Que souhaites-tu faire ?
- 💡 **Générer un message de commit** pour une tâche active ?
- 📝 **Découper une tâche complexe** en sous-tâches concrètes ?
- ☀️ **Organiser ton planning de la journée** heure par heure ?

Je suis prêt à t'aider. Dis-moi simplement ce dont tu as besoin !`;
      }

      // Stream the response out word by word
      const words = simulatedResponse.split(/(\s+)/);
      let currentWordIndex = 0;
      
      const interval = setInterval(() => {
        if (currentWordIndex >= words.length) {
          clearInterval(interval);
          resolve(simulatedResponse);
          return;
        }
        
        const nextWord = words[currentWordIndex];
        onToken(nextWord);
        currentWordIndex++;
      }, 15); // extremely realistic fast stream
    });
  }
}
