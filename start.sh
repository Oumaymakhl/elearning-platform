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
echo "🎨 Démarrage du frontend Angular..."
cd ~/projects/elearning-platform/frontend/angular-app && ng serve &
echo "🌐 Frontend : http://localhost:4200"
echo "🔧 Backend  : http://localhost:8080"
