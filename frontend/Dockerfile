FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# 1. Limiter la mémoire de Node.js pour éviter le crash
ENV NODE_OPTIONS="--max-old-space-size=512"

# 2. Utiliser npm ci à la place de npm install
RUN npm ci

COPY . .

# 3. Le build de Vite fonctionnera car les dépendances seront bien installées
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]