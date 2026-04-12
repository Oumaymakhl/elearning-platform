#!/bin/bash
echo "🚀 Démarrage de la plateforme E-Learning..."
cd ~/projects/elearning-platform/docker/compose
docker-compose up -d
echo "⏳ Attente des services..."
sleep 5
echo "🔧 Configuration des permissions..."
sudo chmod 777 /tmp/executor
mkdir -p /tmp/go-cache /tmp/gopath
sudo chmod 777 /tmp/go-cache /tmp/gopath
echo "✅ Plateforme démarrée !"
echo "💬 Démarrage du forum service..."
cd ~/projects/elearning-platform/backend/forum-service
if ! lsof -i:8008 > /dev/null 2>&1; then
  php artisan serve --port=8008 &
else
  echo "⚠️  Forum service déjà actif sur :8008"
fi
echo "💬 Forum    : http://localhost:8008"

echo "✉️  Démarrage du messaging service..."
cd ~/projects/elearning-platform/backend/messaging-service
if ! lsof -i:8009 > /dev/null 2>&1; then
  php artisan serve --port=8009 &
else
  echo "⚠️  Messaging service déjà actif sur :8009"
fi
echo "✉️  Messages  : http://localhost:8009"

echo "🎨 Démarrage du frontend Angular..."
cd ~/projects/elearning-platform/frontend/angular-app && ng serve &
echo "🌐 Frontend : http://localhost:4200"
echo "🔧 Backend  : http://localhost:8080"
