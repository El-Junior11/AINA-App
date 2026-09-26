FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install --prefer-offline --no-audit

COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production --prefer-offline --no-audit

COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "server.js"]