# ── Étape 1 : Build Angular ──────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production
 
# ── Étape 2 : Serveur Nginx ──────────────────────────────────────
FROM nginx:1.28-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/angular-app/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
