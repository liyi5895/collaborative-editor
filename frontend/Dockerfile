FROM node:18-alpine

WORKDIR /app

# Set Node options to allow legacy OpenSSL provider
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
