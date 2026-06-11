# 📘 DevTracker - Documentation Complète

DevTracker est une application de gestion de projet et de productivité conçue spécifiquement pour les développeurs. Elle combine un suivi de tâches puissant, une intégration GitHub poussée, des outils de gestion du temps (Pomodoro), et un assistant IA.

---

## 🏗️ Architecture et Technologies (Stack)

Le projet est divisé en deux parties principales (Frontend et Backend) avec une stack technique moderne.

### Frontend (Interface Utilisateur)
- **Framework** : React 18 avec Vite.js (très rapide).
- **Styling** : Tailwind CSS avec des composants de [shadcn/ui] et des icônes [Lucide React].
- **Gestion d'état** : Zustand (pour l'état global comme l'authentification et le Pomodoro) et React Query (pour la gestion des données asynchrones API).
- **Graphiques** : Highcharts (pour les statistiques du tableau de bord).
- **Internationalisation** : `i18next` (Support natif Français / Anglais).
- **Fonctionnalités avancées** : PWA (Progressive Web App) avec support du mode hors-ligne.

### Backend (Serveur API)
- **Framework** : NestJS (Framework Node.js robuste basé sur TypeScript).
- **Base de données** : PostgreSQL.
- **ORM** : Prisma (pour interagir facilement avec la base de données).
- **Authentification** : JWT (JSON Web Tokens).
- **Tâches en arrière-plan** : `@nestjs/schedule` (Cron jobs pour les envois d'emails et stand-ups).

---

## 🌟 Fonctionnalités Principales

### 1. Gestion des Projets et Tâches
- Création de projets personnalisés avec code couleur.
- Tâches organisables en multiples vues : **Liste**, **Tableau (Kanban)**, et **Calendrier**.
- Panneau latéral de détails de tâche (Side peek) pour ajouter des sous-tâches, commentaires, et estimer le temps.

### 2. Intégration GitHub Sélective
- Liez votre compte GitHub via un Personal Access Token (PAT) dans les paramètres.
- Importez manuellement des dépôts (Repositories) pour en faire des Projets DevTracker.
- Importez de manière sélective des *Issues* GitHub pour les transformer en tâches gérables dans DevTracker.

### 3. Gestion du Temps et Productivité
- **Minuteur Global** : Pour traquer le temps passé sur une tâche spécifique de manière continue.
- **Minuteur Pomodoro** : Technique de concentration par intervalles (ex: 25 min de travail, 5 min de pause) directement intégrée dans la barre supérieure.
- Suivi du temps cumulé affiché sur les statistiques.

### 4. Assistant IA (NVIDIA)
- Chat IA contextuel disponible à tout moment.
- Suggestions intelligentes ("Smart Breakdowns") pour découper automatiquement une grosse tâche complexe en plusieurs petites sous-tâches.

### 5. Stand-up et Rapports Automatiques
- **Daily Stand-up** : Un écran récapitulatif apparaît une fois par jour pour vous montrer ce qui a été fait la veille et ce qui est prévu aujourd'hui.
- **Emails automatiques** : Rapports de productivité et alertes envoyés par email grâce à `Nodemailer`.

### 6. Carnet de Notes
- Système de prise de notes complet avec support de favoris (Pin), recherche rapide, et interface responsive Maître/Détail.

---

## 💻 Guide d'Installation Locale

Si vous souhaitez faire tourner le projet sur votre machine (en mode développement), suivez ces étapes :

### Étape 1 : Prérequis
- Node.js (version 18 ou supérieure)
- PostgreSQL installé localement (ou via Docker)

### Étape 2 : Configuration de la Base de données (Backend)
1. Ouvrez un terminal dans le dossier `backend`.
2. Installez les dépendances : `npm install`.
3. Créez un fichier `.env` basé sur `.env.example` et configurez votre URL PostgreSQL.
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/devtracker?schema=public"
   JWT_SECRET="votre_cle_secrete_super_securisee"
   EMAIL_USER="votre_email@gmail.com"
   EMAIL_PASS="votre_mot_de_passe_application_google"
   ```
4. Lancez les migrations pour créer les tables : `npx prisma migrate dev`.
5. Démarrez le serveur : `npm run start:dev`. Le serveur tournera sur `http://localhost:3000`.

### Étape 3 : Configuration de l'Interface (Frontend)
1. Ouvrez un autre terminal dans le dossier `frontend`.
2. Installez les dépendances : `npm install`.
3. Vérifiez le fichier `.env` (il doit contenir `VITE_API_URL=http://localhost:3000/api`).
4. Démarrez le frontend : `npm run dev`.
5. Ouvrez votre navigateur sur `http://localhost:5173`.

---

## 🚀 Guide de Déploiement

Pour déployer l'application en ligne, l'approche recommandée (et gratuite) est la suivante :

1. **Base de données** : Créez une base de données PostgreSQL gratuite sur [Supabase](https://supabase.com).
2. **Backend API** : Déployez le dossier `backend` sur [Render](https://render.com) (Web Service). Cela permettra à vos tâches d'arrière-plan (envoi d'emails) de tourner correctement. N'oubliez pas de configurer les variables d'environnement (`DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`).
3. **Frontend** : Déployez le dossier `frontend` sur [Vercel](https://vercel.com) en configurant `VITE_API_URL` avec l'URL fournie par Render.
