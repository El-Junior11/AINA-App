FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Installer les dépendances directement à l'intérieur du conteneur
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npm", "start"]