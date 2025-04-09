# Score Board - Gestion de Tournois

![Score Board](https://img.shields.io/badge/Score%20Board-Gestion%20de%20Tournois-blue)
![Kotlin](https://img.shields.io/badge/Kotlin-1.9-orange)
![Ktor](https://img.shields.io/badge/Ktor-2.3-purple)
![Angular](https://img.shields.io/badge/Angular-19-red)
![Portfolio](https://img.shields.io/badge/Projet-Portfolio-green)
![Deploy](https://img.shields.io/badge/Deploy-Render-blueviolet)

## 🧩 À propos

Ce projet est un projet personnel développé pour mon portfolio. Il démontre mes compétences en développement full-stack avec Kotlin et Angular, ainsi que mes connaissances en architecture logicielle et en déploiement continu.

Une application complète pour gérer vos tournois, suivre les scores et visualiser les classements des joueurs.

## 📋 Sommaire

- [Présentation](#-présentation)
- [Architecture & Stack Technique](#-architecture--stack-technique)
- [Installation](#-installation)
- [Exécution en local](#-exécution-en-local)
- [Déploiement](#-déploiement)
- [API Documentation](#-api-documentation)
- [Fonctionnalités](#-fonctionnalités)
- [Captures d'écran](#-captures-décran)
- [Licence](#-licence)
- [Contact](#-contact)

## 🎯 Présentation

Score Board est une application de gestion de tournois qui permet de :
- Gérer une liste de joueurs
- Simuler des matchs entre joueurs
- Mettre à jour automatiquement les classements
- Visualiser les statistiques des joueurs

Avec une interface utilisateur intuitive et un backend robuste, l'application facilite la gestion complète des tournois de jeux.

## 🔧 Architecture & Stack Technique

### Structure du projet

```
scoreboard/
├── backend/           # Backend Kotlin avec Ktor
├── frontend/          # Frontend Angular
├── .github/           # Configuration CI/CD
├── lib/               # Scripts utilitaires
├── start-service.sh   # Script de démarrage
└── stop-service.sh    # Script d'arrêt
```

### Backend (Kotlin)

- **Langage** : Kotlin 1.9
- **Framework** : Ktor 2.3
- **Injection de dépendances** : Koin
- **Base de données** : MongoDB
- **API REST** complète avec documentation Swagger

Le backend suit une architecture hexagonale (ports et adaptateurs) :
- `domain` : Logique métier et entités
- `application` : Cas d'utilisation et services
- `infrastructure` : Implémentations techniques et adaptateurs

### Frontend (Angular)

- **Framework** : Angular 19
- **UI Components** : Angular Material
- **State Management** : Services Angular avec RxJS
- **Responsive Design** pour mobile et desktop

### Intégration Frontend/Backend

Une particularité de ce projet est que le frontend Angular est compilé directement dans les ressources statiques du backend Kotlin, ce qui permet de déployer l'application comme un monolithe. Cette approche :

- Élimine les problèmes de CORS
- Simplifie le déploiement
- Améliore les performances en évitant les appels cross-origin

## 🚀 Installation

### Prérequis

- JDK 17+
- Node.js 18+
- npm 9+
- MongoDB

### Cloner le projet

```bash
git clone https://github.com/votre-username/scoreboard.git
cd scoreboard
```

## 🖥️ Exécution en local

Le projet fournit des scripts qui automatisent le processus de construction et d'exécution.

### Étape 1 : Démarrer l'application

```bash
./start-service.sh
```

Ce script :
1. Construit l'application Angular 
2. Copie les fichiers compilés dans `backend/src/main/resources/static`
3. Compile le backend Kotlin
4. Démarre le serveur sur le port 9090 (par défaut)

### Options supplémentaires

```bash
./start-service.sh --port 8080  # Définir un port différent
./start-service.sh --quiet      # Mode silencieux (affiche uniquement les erreurs)
./start-service.sh --verbose    # Mode verbeux (affiche tous les messages)
```

### Arrêter l'application

```bash
./stop-service.sh
```

## 🌐 Déploiement

L'application est déployée automatiquement sur [Render](https://render.com) via GitHub Actions.

### Démonstration

**URL** : [https://scoreboard-v4cu.onrender.com](https://scoreboard-v4cu.onrender.com)

> **Note** : Lors du premier accès, veuillez patienter 30-45 secondes si l'application était en veille. C'est une caractéristique du plan gratuit de Render qui met les applications en veille après 15 minutes d'inactivité.

Le workflow CI/CD :
1. Construit l'application Angular
2. Intègre les fichiers compilés dans les ressources du backend
3. Prépare les fichiers nécessaires pour Render (Dockerfile et render.yaml)
4. Crée un package de déploiement

### Configuration Render

Le déploiement utilise:
- Un service Web Docker sur le plan gratuit
- Le Dockerfile à la racine du projet
- La connexion à MongoDB Cloud est déjà configurée dans le fichier `application.conf`

### Avantages et particularités de Render

- Déploiement gratuit pour les projets personnels
- Intégration facile avec GitHub
- Containers Docker pour une exécution cohérente
- **Mise en veille automatique** : Sur le plan gratuit, l'application se met en veille après 15 minutes d'inactivité
- **Délai au premier accès** : Lors du premier accès après une période d'inactivité, l'application peut mettre 30-45 secondes à démarrer

### Déploiement sur Render

Pour déployer cette application sur Render :

1. **Créez un compte sur [Render](https://render.com)**

2. **Connectez votre dépôt GitHub**
   - Sur le dashboard Render, cliquez sur "New" puis "Web Service"
   - Choisissez GitHub comme source
   - Sélectionnez votre dépôt

3. **Configurez le service**
   - Nom : `scoreboard` (ou un nom de votre choix)
   - Type d'environnement : Docker
   - Plan : Free
   - Configuration automatique grâce au fichier `render.yaml`

4. **Variables d'environnement**
   - Aucune configuration supplémentaire n'est requise car la connexion MongoDB est déjà paramétrée dans `application.conf`
   - Pour une approche plus sécurisée en production, vous pourriez toutefois externaliser ces informations dans les variables d'environnement

Le déploiement démarre automatiquement après la création du service Web.

## 📚 API Documentation

La documentation de l'API est disponible via Swagger UI.

- **En local** : [http://localhost:9090/swagger-ui](http://localhost:9090/swagger-ui)
- **En production** : [https://scoreboard-v4cu.onrender.com/swagger-ui](https://scoreboard-v4cu.onrender.com/swagger-ui)

## 🎮 Fonctionnalités

- **Gestion des joueurs**
  - Ajouter/supprimer des joueurs
  - Personnaliser avec des avatars
  - Définir des points initiaux

- **Simulation de matchs**
  - Matchs entre deux joueurs
  - Attribution automatique des points
  - Mise à jour en temps réel du classement

- **Tableau de classement**
  - Visualisation du classement des joueurs
  - Tri par points, matchs joués, etc.

## 📸 Captures d'écran

*À ajouter ultérieurement*

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📬 Contact

Luc CLEMENT - [lucclement38@gmail.com](mailto:lucclement38@gmail.com)

Projet GitHub : [https://github.com/lc-4918/scoreboard](https://github.com/lc-4918/scoreboard)