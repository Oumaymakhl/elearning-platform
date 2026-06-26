#!/bin/bash
sleep 60
sudo docker cp /opt/elearning/frontend/angular-app/dist/learnspace/browser/. gateway:/usr/share/nginx/html/
sudo docker exec gateway nginx -s reload
echo "Gateway restaurée ✅"
