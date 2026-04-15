#!/bin/bash
echo "🚀 Démarrage de la plateforme E-Learning..."
cd ~/projects/elearning-platform/docker/compose
docker-compose up -d
echo "⏳ Attente des services Docker..."
sleep 5
echo "🔧 Configuration des permissions..."
sudo chmod 777 /tmp/executor
mkdir -p /tmp/go-cache /tmp/gopath
sudo chmod 777 /tmp/go-cache /tmp/gopath

echo ""
echo "✅ Tous les services sont démarrés !"
echo "🌐 Frontend  : http://localhost:4200"
echo "🔧 Backend   : http://localhost:8080"
echo "💬 Forum     : http://localhost:8008"
echo "✉️  Messages  : http://localhost:8009"
echo ""
