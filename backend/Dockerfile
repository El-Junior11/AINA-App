FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY node_modules ./node_modules
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
