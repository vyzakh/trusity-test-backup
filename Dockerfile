# Step 1: Build NestJS app with Puppeteer support
FROM node:22.17-alpine

# Install system dependencies required by Chromium
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  libreoffice \
  ttf-freefont \
  bash

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true 

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose app port
EXPOSE 3000

RUN npm run build

CMD ["npm", "run", "start:prod"]
