#!/bin/bash
sleep 120
for container in mysql-auth mysql-user mysql-course mysql-quiz mysql-payment mysql-forum mysql-messaging mysql-notification mysql-content mysql-executor; do
  docker update --memory="200m" --memory-swap="200m" $container 2>/dev/null
done
echo "MySQL limites appliquées"
