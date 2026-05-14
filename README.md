# 🎓 E-Learning Platform

Plateforme d'apprentissage en ligne basée sur une architecture **microservices**, développée avec Laravel (backend), Angular (frontend), et déployée sur **AWS EC2** via Docker Compose.

---

## 🏗️ Architecture

| Route | Service | Port |
|---|---|---|
| `/api/auth/*` | auth-service | 8000 |
| `/api/users/*` | user-service | 8001 |
| `/api/courses/*` | course-service | 8002 |
| `/api/content/*` | content-service | 8003 |
| `/api/quiz/*` | quiz-service | 8004 |
| `/api/forum/*` | forum-service | 8005 |
| `/api/messaging/*` | messaging-service | 8006 |
| `/api/notifications/*` | notification-service | 8007 |
| `/api/chatbot/*` | chatbot-service | 8008 |
| `/api/executor/*` | executor-service | 8009 |
| `/api/payment/*` | payment-service | 8010 |
| `/*` | frontend Angular | 4200 |
---

## 🧩 Microservices

| Service | Technologie | Rôle |
|---|---|---|
| `auth-service` | Laravel + MySQL | Authentification, JWT |
| `user-service` | Laravel + MySQL | Gestion des utilisateurs |
| `course-service` | Laravel + MySQL | Cours et inscriptions |
| `content-service` | Laravel + MySQL | Chapitres et leçons |
| `quiz-service` | Laravel + MySQL | Quiz et résultats |
| `forum-service` | Laravel + MySQL | Forum de discussion |
| `messaging-service` | Laravel + MySQL | Messagerie en temps réel |
| `notification-service` | Laravel + MySQL | Notifications |
| `chatbot-service` | Laravel + MySQL | Assistant IA |
| `executor-service` | Laravel + MySQL | Exécution de code |
| `payment-service` | Laravel + MySQL | Paiements |
| `frontend` | Angular | Interface utilisateur |

---

## 🚀 Déploiement sur AWS EC2

### Prérequis
- Instance EC2 Ubuntu 24.04 (t3.large recommandé)
- Ports 22 et 80 ouverts dans le Security Group
- Clé SSH .pem

### Étapes

**1. Copier le projet sur l'instance :**
\`\`\`bash
scp -i "ma-cle.pem" -r elearning-platform/ ubuntu@<EC2_IP>:/tmp/elearning
\`\`\`

**2. Se connecter en SSH :**
\`\`\`bash
ssh -i "ma-cle.pem" ubuntu@<EC2_IP>
\`\`\`

**3. Lancer le déploiement :**
\`\`\`bash
cd /tmp/elearning && bash start.sh
\`\`\`

---

## 💻 Lancement en local

\`\`\`bash
git clone https://github.com/Oumaymakhl/elearning-platform.git
cd elearning-platform/docker/compose
docker compose up --build
\`\`\`

Application accessible sur http://localhost

---

## 🔧 Stack technique

| Couche | Technologie |
|---|---|
| Backend | Laravel 11 (PHP) |
| Frontend | Angular 17 |
| Base de données | MySQL 8.0 |
| Conteneurisation | Docker + Docker Compose |
| Reverse Proxy | Nginx |
| CI/CD | GitHub Actions |
| Analyse sécurité | Trivy |
| Qualité de code | SonarCloud |
| Cloud | AWS EC2 |

---

## 🔁 CI/CD

Le pipeline GitHub Actions s'exécute à chaque push sur `main` ou `develop` :

1. **Détection des changements** — seuls les services modifiés sont re-buildés
2. **Build Docker** — construction de l'image pour chaque service
3. **Scan Trivy** — analyse des vulnérabilités (CRITICAL, HIGH, MEDIUM)
4. **SonarCloud** — analyse de la qualité du code
5. **Security Dashboard** — rapport HTML uploadé en artifact

---

## 👩‍💻 Auteur

Développé par **Oumaymakhl**
