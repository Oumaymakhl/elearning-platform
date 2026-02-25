#!/bin/bash

echo "=========================================="
echo "  Plateforme E-Learning - Démarrage"
echo "=========================================="

# Vérifier si Docker est en cours d'exécution
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas en cours d'exécution."
    echo "Veuillez démarrer Docker Desktop sur Windows."
    exit 1
fi

echo "✅ Docker est en cours d'exécution."

# Construire les images
echo "🔨 Construction des images Docker..."
docker-compose build

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que MySQL soit prêt
echo "⏳ Attente du démarrage de MySQL (20 secondes)..."
sleep 20

# Exécuter les migrations
echo "📦 Exécution des migrations Laravel..."
docker-compose exec auth-service php artisan migrate --force

echo ""
echo "=========================================="
echo "          Services Disponibles"
echo "=========================================="
echo "🌐 Laravel API:     http://localhost:8000"
echo "🗄️  phpMyAdmin:      http://localhost:8080"
echo "   - Utilisateur:   auth_user"
echo "   - Mot de passe:  auth_password"
echo ""
echo "=========================================="
echo "Commandes utiles:"
echo "  docker-compose logs -f     # Voir les logs"
echo "  docker-compose down        # Arrêter les services"
echo "  docker-compose restart     # Redémarrer"
echo "=========================================="
