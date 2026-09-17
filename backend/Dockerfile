FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=dev --no-audit --progress=false

COPY . .

EXPOSE 5000

CMD ["npm", "start"]