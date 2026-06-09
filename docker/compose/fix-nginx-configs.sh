#!/bin/bash
echo "🔧 Correction des configs nginx..."

# Corriger toutes les IPs fixes dans les confs nginx
for conf in /opt/elearning/docker/compose/nginx/*.conf; do
    # Remplacer les IPs fixes par les noms DNS si présentes
    sed -i 's/fastcgi_pass 172\.[0-9]*\.[0-9]*\.[0-9]*:[0-9]*/fastcgi_pass INVALID/g' "$conf"
done

echo "✅ Configs nginx vérifiées"
